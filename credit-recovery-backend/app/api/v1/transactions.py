import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.core.exceptions import DomainError
from app.db.session import get_db
from app.models.transaction import Transaction, TransactionType
from app.schemas.customer import CreditSaleContext
from app.schemas.transaction import (
    AdjustmentCreate,
    CreditSaleCreate,
    LedgerFilter,
    PaginatedLedger,
    PaymentCreate,
    ReversalCreate,
    TransactionOut,
)
from app.services import customer_service, transaction_service

router = APIRouter(tags=["transactions"])


def _require_idempotency_key(
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")
) -> str:
    """
    Required on every ledger-mutating request. Clients should generate a
    fresh UUID per user-initiated action (e.g. per form submission) and
    resend the SAME key if they need to retry after a network error/timeout,
    so retries can never double-post a sale or payment.
    """
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key header is required for this operation.",
        )
    return idempotency_key.strip()


@router.post(
    "/transactions/credit-sale",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
def record_credit_sale(
    payload: CreditSaleCreate,
    response: Response,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str = Depends(_require_idempotency_key),
):
    try:
        result = transaction_service.create_transaction(
            db,
            business_id=current_user.business_id,
            customer_id=payload.customer_id,
            tx_type=TransactionType.credit_sale,
            amount=payload.amount,
            created_by=current_user.id,
            idempotency_key=idempotency_key,
            invoice_number=payload.invoice_number,
            invoice_date=payload.invoice_date,
            description=payload.description,
            override_credit_limit=payload.override_credit_limit,
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    # Idempotent replay of an already-committed request -> 200, not 201.
    response.status_code = status.HTTP_201_CREATED if result.created else status.HTTP_200_OK
    return result.transaction


@router.post(
    "/transactions/payment",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
def record_payment(
    payload: PaymentCreate,
    response: Response,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str = Depends(_require_idempotency_key),
):
    try:
        result = transaction_service.create_transaction(
            db,
            business_id=current_user.business_id,
            customer_id=payload.customer_id,
            tx_type=TransactionType.payment,
            amount=payload.amount,
            created_by=current_user.id,
            idempotency_key=idempotency_key,
            payment_method=payload.payment_method,
            reference_number=payload.reference_number,
            description=payload.description,
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    response.status_code = status.HTTP_201_CREATED if result.created else status.HTTP_200_OK
    return result.transaction


@router.post(
    "/transactions/adjustment",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
def record_adjustment(
    payload: AdjustmentCreate,
    response: Response,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str = Depends(_require_idempotency_key),
):
    try:
        result = transaction_service.create_transaction(
            db,
            business_id=current_user.business_id,
            customer_id=payload.customer_id,
            tx_type=TransactionType.adjustment,
            amount=payload.amount,
            created_by=current_user.id,
            idempotency_key=idempotency_key,
            adjustment_direction=payload.direction,
            reference_number=payload.reference_number,
            description=payload.description,
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    response.status_code = status.HTTP_201_CREATED if result.created else status.HTTP_200_OK
    return result.transaction


@router.post(
    "/transactions/{transaction_id}/reverse",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
def reverse_transaction(
    transaction_id: uuid.UUID,
    payload: ReversalCreate,
    response: Response,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str = Depends(_require_idempotency_key),
):
    try:
        result = transaction_service.reverse_transaction(
            db,
            business_id=current_user.business_id,
            original_transaction_id=transaction_id,
            created_by=current_user.id,
            idempotency_key=idempotency_key,
            reason=payload.reason,
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    response.status_code = status.HTTP_201_CREATED if result.created else status.HTTP_200_OK
    return result.transaction


@router.get("/customers/{customer_id}/credit-sale-context", response_model=CreditSaleContext)
def credit_sale_context(
    customer_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        customer = customer_service.get_customer_or_404(
            db, business_id=current_user.business_id, customer_id=customer_id
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    available = customer.credit_limit - customer.current_outstanding
    return CreditSaleContext(
        customer_id=customer.id,
        current_outstanding=customer.current_outstanding,
        credit_limit=customer.credit_limit,
        credit_status=customer.credit_status,
        available_credit=available if available > 0 else Decimal("0"),
    )


@router.get("/customers/{customer_id}/ledger", response_model=PaginatedLedger)
def get_customer_ledger(
    customer_id: uuid.UUID,
    filters: LedgerFilter = Depends(),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        customer = customer_service.get_customer_or_404(
            db, business_id=current_user.business_id, customer_id=customer_id
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    stmt = select(Transaction).where(
        Transaction.business_id == current_user.business_id, Transaction.customer_id == customer_id
    )
    if filters.date_from:
        stmt = stmt.where(Transaction.created_at >= filters.date_from)
    if filters.date_to:
        stmt = stmt.where(Transaction.created_at <= filters.date_to)
    if filters.type:
        stmt = stmt.where(Transaction.type == filters.type)

    from sqlalchemy import func as sa_func

    total = db.execute(select(sa_func.count()).select_from(stmt.subquery())).scalar_one()

    stmt = (
        stmt.order_by(Transaction.created_at.desc())
        .offset((filters.page - 1) * filters.page_size)
        .limit(filters.page_size)
    )
    items = list(db.execute(stmt).scalars().all())

    # Oldest-first running_balance right before the earliest item on this page
    # gives us a correct opening_balance for the page even when filtered/paginated.
    opening_balance = Decimal("0")
    if items:
        oldest_on_page = items[-1]
        prior = db.execute(
            select(Transaction.running_balance)
            .where(
                Transaction.customer_id == customer_id,
                Transaction.business_id == current_user.business_id,
                Transaction.created_at < oldest_on_page.created_at,
            )
            .order_by(Transaction.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        opening_balance = prior if prior is not None else Decimal("0")

    closing_balance = items[0].running_balance if items else customer.current_outstanding

    return PaginatedLedger(
        items=[TransactionOut.model_validate(t) for t in items],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        opening_balance=opening_balance,
        closing_balance=closing_balance,
    )