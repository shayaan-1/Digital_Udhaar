"""
app/services/transaction_service.py

THE load-bearing module of the whole system (per Roadmap Epic 1.4).

Every write to `transactions` -- credit sale, payment, adjustment, opening
balance, reversal, and (in Phase 6) bulk import -- MUST go through
`create_transaction()` / `reverse_transaction()` below rather than issuing
raw INSERTs elsewhere. That is what makes Phase 4 (audit log) and Phase 5
(risk recalculation) cheap to bolt on later: they hook into this one place.

Concurrency & correctness
--------------------------
`transactions.running_balance` is written by the application (not the DB
trigger -- the trigger only maintains the rolled-up `customers` aggregate
columns). Two concurrent credit sales for the same customer must therefore
never compute their running_balance from the same "old" balance. We prevent
that race with `SELECT ... FOR UPDATE` on the customer row: the second
transaction blocks until the first commits, then sees the updated balance.

Idempotency
------------
Every mutating endpoint requires an `Idempotency-Key` header (see
api/v1/transactions.py). We rely on the unique constraint
`uq_transactions_business_idempotency (business_id, idempotency_key)`
(migration 0002) as the source of truth: on a retried request we attempt the
insert, catch the resulting IntegrityError inside a SAVEPOINT, and return the
row that was already committed by the original request -- this is safe even
if two identical requests race each other, unlike a "check-then-insert"
approach without a DB constraint backing it.
"""
import uuid
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    CreditLimitExceededError,
    CustomerArchivedError,
    CustomerBlockedError,
    NotFoundError,
)
from app.models.customer import Customer, CreditStatus
from app.models.transaction import AdjustmentDirection, Transaction, TransactionType


@dataclass
class TransactionResult:
    transaction: Transaction
    created: bool  # False => this was an idempotent replay of an existing request


def _compute_delta(
    tx_type: TransactionType,
    amount: Decimal,
    adjustment_direction: AdjustmentDirection | None,
    is_reversal: bool,
) -> Decimal:
    """
    Returns the signed change to apply to customer.current_outstanding.
    A reversal always applies the exact opposite of what the original
    transaction type would normally apply.
    """
    if tx_type in (TransactionType.credit_sale, TransactionType.opening_balance):
        base = amount
    elif tx_type == TransactionType.payment:
        base = -amount
    elif tx_type == TransactionType.adjustment:
        if adjustment_direction is None:
            raise ValueError("adjustment_direction is required for adjustment transactions.")
        base = amount if adjustment_direction == AdjustmentDirection.increase else -amount
    else:  # pragma: no cover - exhaustiveness guard
        raise ValueError(f"Unhandled transaction type: {tx_type}")

    return -base if is_reversal else base


def _get_existing_by_idempotency_key(
    db: Session, business_id: uuid.UUID, idempotency_key: str
) -> Transaction | None:
    return db.execute(
        select(Transaction).where(
            Transaction.business_id == business_id,
            Transaction.idempotency_key == idempotency_key,
        )
    ).scalar_one_or_none()


def _lock_customer_for_update(db: Session, business_id: uuid.UUID, customer_id: uuid.UUID) -> Customer:
    customer = db.execute(
        select(Customer)
        .where(Customer.id == customer_id, Customer.business_id == business_id)
        .with_for_update()
    ).scalar_one_or_none()
    if customer is None:
        raise NotFoundError("Customer not found.")
    return customer


def create_transaction(
    db: Session,
    *,
    business_id: uuid.UUID,
    customer_id: uuid.UUID,
    tx_type: TransactionType,
    amount: Decimal,
    created_by: uuid.UUID,
    idempotency_key: str,
    invoice_number: str | None = None,
    invoice_date: date | None = None,
    payment_method: str | None = None,
    adjustment_direction: AdjustmentDirection | None = None,
    reference_number: str | None = None,
    description: str | None = None,
    override_credit_limit: bool = False,
    is_reversal: bool = False,
    reversed_transaction_id: uuid.UUID | None = None,
) -> TransactionResult:
    # 1. Idempotent fast path -- covers the common "client retried after a
    #    timeout but the first request actually succeeded" case cheaply,
    #    without taking any lock.
    existing = _get_existing_by_idempotency_key(db, business_id, idempotency_key)
    if existing is not None:
        return TransactionResult(transaction=existing, created=False)

    # 2. Lock the customer row for the remainder of this DB transaction.
    #    Any other concurrent transaction for the SAME customer will block
    #    here until we commit/rollback, which is exactly the serialization
    #    we need to compute a correct running_balance.
    customer = _lock_customer_for_update(db, business_id, customer_id)

    if customer.is_archived:
        raise CustomerArchivedError()

    if tx_type == TransactionType.credit_sale and customer.credit_status == CreditStatus.blocked:
        raise CustomerBlockedError()

    delta = _compute_delta(tx_type, amount, adjustment_direction, is_reversal)
    projected_balance = customer.current_outstanding + delta

    if (
        tx_type == TransactionType.credit_sale
        and not is_reversal
        and customer.credit_limit > 0
        and projected_balance > customer.credit_limit
        and not override_credit_limit
    ):
        raise CreditLimitExceededError(
            current_outstanding=customer.current_outstanding,
            credit_limit=customer.credit_limit,
            projected_balance=projected_balance,
        )

    txn = Transaction(
        business_id=business_id,
        customer_id=customer_id,
        type=tx_type,
        amount=amount,
        invoice_number=invoice_number,
        invoice_date=invoice_date,
        payment_method=payment_method,
        adjustment_direction=adjustment_direction,
        reference_number=reference_number,
        description=description,
        is_reversal=is_reversal,
        reversed_transaction_id=reversed_transaction_id,
        running_balance=projected_balance,
        created_by=created_by,
        idempotency_key=idempotency_key,
    )

    # 3. SAVEPOINT so a duplicate-key race (two identical retried requests
    #    arriving concurrently) can be recovered from without aborting the
    #    customer-row lock / whole outer transaction.
    try:
        with db.begin_nested():
            db.add(txn)
            db.flush()  # surfaces IntegrityError now, and populates txn.created_at
    except IntegrityError:
        winner = _get_existing_by_idempotency_key(db, business_id, idempotency_key)
        if winner is not None:
            return TransactionResult(transaction=winner, created=False)
        raise  # a different constraint failed -- a genuine error, re-raise

    # NOTE: customer.current_outstanding / total_purchases / total_payments /
    # last_purchase_date / last_payment_date are updated by the
    # `trg_apply_transaction_to_customer` DB trigger immediately on INSERT
    # (see migration 0002 for the corrected trigger body), so we deliberately
    # do not mutate `customer` in Python here -- the DB is the single writer
    # of those derived columns.
    return TransactionResult(transaction=txn, created=True)


def reverse_transaction(
    db: Session,
    *,
    business_id: uuid.UUID,
    original_transaction_id: uuid.UUID,
    created_by: uuid.UUID,
    idempotency_key: str,
    reason: str,
) -> TransactionResult:
    """
    Corrections-only model (FRD Section 5): the original row is never
    edited or deleted. We insert a new transaction that is flagged as a
    reversal of the original and carries the exact opposite balance effect.
    """
    original = db.execute(
        select(Transaction).where(
            Transaction.id == original_transaction_id, Transaction.business_id == business_id
        )
    ).scalar_one_or_none()
    if original is None:
        raise NotFoundError("Original transaction not found.")

    return create_transaction(
        db,
        business_id=business_id,
        customer_id=original.customer_id,
        tx_type=original.type,
        amount=original.amount,
        created_by=created_by,
        idempotency_key=idempotency_key,
        invoice_number=original.invoice_number,
        invoice_date=original.invoice_date,
        payment_method=original.payment_method,
        adjustment_direction=original.adjustment_direction,
        reference_number=original.reference_number,
        description=f"Reversal of {original.id}: {reason}",
        is_reversal=True,
        reversed_transaction_id=original.id,
    )