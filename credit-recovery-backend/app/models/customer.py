import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CreditStatus(str, enum.Enum):
    active = "active"
    restricted = "restricted"
    blocked = "blocked"


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (CheckConstraint("credit_limit >= 0", name="chk_credit_limit_nonneg"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_name: Mapped[str | None] = mapped_column(String(255))
    mobile_number: Mapped[str] = mapped_column(String(20), nullable=False)
    whatsapp_number: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)

    credit_limit: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    opening_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    credit_status: Mapped[CreditStatus] = mapped_column(String(20), nullable=False, default=CreditStatus.active.value)

    current_outstanding: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    total_purchases: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    total_payments: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    last_purchase_date: Mapped[date | None] = mapped_column(Date)
    last_payment_date: Mapped[date | None] = mapped_column(Date)

    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    business: Mapped["Business"] = relationship(back_populates="customers")  # noqa: F821

    @property
    def is_archived(self) -> bool:
        return self.archived_at is not None