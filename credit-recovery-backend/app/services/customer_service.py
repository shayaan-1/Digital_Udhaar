"""
app/services/customer_service.py

All customer reads/writes are scoped by business_id -- see api/deps.py notes
on tenant isolation. Nothing here trusts a business_id from the request body.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionType
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.services import transaction_service


def create_customer(
    db: Session, *, business_id: uuid.UUID, created_by: uuid.UUID, data: CustomerCreate
) -> Customer:
    customer = Customer(
        business_id=business_id,
        name=data.name,
        business_name=data.business_name,
        mobile_number=data.mobile_number,
        whatsapp_number=data.whatsapp_number,
        address=data.address,
        city=data.city,
        notes=data.notes,
        credit_limit=data.credit_limit,
        opening_balance=data.opening_balance,
        credit_status=data.credit_status.value,
        created_by=created_by,
    )
    db.add(customer)
    db.flush()  # populate customer.id for the opening-balance transaction below

    # Route the opening balance through the shared transaction service (not a
    # direct column write) so it is auditable and contributes to the ledger,
    # exactly like the roadmap's data-import design note recommends.
    if data.opening_balance and data.opening_balance != Decimal("0"):
        transaction_service.create_transaction(
            db,
            business_id=business_id,
            customer_id=customer.id,
            tx_type=TransactionType.opening_balance,
            amount=abs(data.opening_balance),
            created_by=created_by,
            idempotency_key=f"opening-balance-{customer.id}",
            description="Opening balance recorded at customer creation.",
        )

    return customer


def get_customer_or_404(db: Session, *, business_id: uuid.UUID, customer_id: uuid.UUID) -> Customer:
    customer = db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.business_id == business_id)
    ).scalar_one_or_none()
    if customer is None:
        raise NotFoundError("Customer not found.")
    return customer


def list_customers(
    db: Session,
    *,
    business_id: uuid.UUID,
    search: str | None,
    include_archived: bool,
    page: int,
    page_size: int,
) -> tuple[list[Customer], int]:
    stmt = select(Customer).where(Customer.business_id == business_id)
    if not include_archived:
        stmt = stmt.where(Customer.archived_at.is_(None))
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(Customer.name.ilike(like), Customer.mobile_number.ilike(like)))

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    stmt = stmt.order_by(Customer.name.asc()).offset((page - 1) * page_size).limit(page_size)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def update_customer(
    db: Session, *, business_id: uuid.UUID, customer_id: uuid.UUID, data: CustomerUpdate
) -> Customer:
    customer = get_customer_or_404(db, business_id=business_id, customer_id=customer_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field == "credit_status" and value is not None:
            value = value.value
        setattr(customer, field, value)
    db.flush()
    return customer


def archive_customer(db: Session, *, business_id: uuid.UUID, customer_id: uuid.UUID) -> Customer:
    customer = get_customer_or_404(db, business_id=business_id, customer_id=customer_id)
    if customer.archived_at is None:
        customer.archived_at = datetime.now(timezone.utc)
        db.flush()
    return customer


def has_transactions(db: Session, *, business_id: uuid.UUID, customer_id: uuid.UUID) -> bool:
    return db.execute(
        select(Transaction.id)
        .where(Transaction.business_id == business_id, Transaction.customer_id == customer_id)
        .limit(1)
    ).scalar_one_or_none() is not None