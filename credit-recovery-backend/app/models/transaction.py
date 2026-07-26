import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TransactionType(str, enum.Enum):
    credit_sale = "credit_sale"
    payment = "payment"
    adjustment = "adjustment"
    opening_balance = "opening_balance"


class AdjustmentDirection(str, enum.Enum):
    """
    Added in migration 0002. The original schema's trigger always added
    `amount` for adjustments, meaning a manual adjustment could never
    *decrease* a customer's outstanding balance (e.g. a goodwill write-off).
    This column disambiguates the sign, keeping `amount` itself always > 0
    as required by the `chk_amount_positive` CHECK constraint.
    """
    increase = "increase"
    decrease = "decrease"


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_amount_positive"),
        CheckConstraint(
            "(invoice_date IS NULL OR invoice_date <= CURRENT_DATE)", name="chk_future_date"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True
    )

    type: Mapped[TransactionType] = mapped_column(String(30), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    invoice_number: Mapped[str | None] = mapped_column(String(100), index=True)
    invoice_date: Mapped[date | None] = mapped_column(Date)

    payment_method: Mapped[str | None] = mapped_column(String(50))

    adjustment_direction: Mapped[AdjustmentDirection | None] = mapped_column(String(10))

    reference_number: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)

    is_reversal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reversed_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transactions.id")
    )

    running_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    # Added in migration 0002 for safe client-side retries (see services/transaction_service.py)
    idempotency_key: Mapped[str | None] = mapped_column(String(255))

    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)