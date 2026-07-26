import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.customer import CreditStatus

# Very permissive intl-friendly check: keeps the DB layer authoritative,
# this just rejects obviously-malformed input early with a clear message.
_MOBILE_MIN_DIGITS = 7


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    business_name: str | None = Field(default=None, max_length=255)
    mobile_number: str = Field(min_length=1, max_length=20)
    whatsapp_number: str | None = Field(default=None, max_length=20)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    notes: str | None = None
    credit_limit: Decimal = Field(default=Decimal("0"), ge=0)
    opening_balance: Decimal = Field(default=Decimal("0"))
    credit_status: CreditStatus = CreditStatus.active

    @field_validator("mobile_number")
    @classmethod
    def mobile_has_enough_digits(cls, v: str) -> str:
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) < _MOBILE_MIN_DIGITS:
            raise ValueError("Mobile number does not look valid.")
        return v.strip()

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Customer name cannot be blank.")
        return v.strip()


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    business_name: str | None = Field(default=None, max_length=255)
    mobile_number: str | None = Field(default=None, min_length=1, max_length=20)
    whatsapp_number: str | None = Field(default=None, max_length=20)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    notes: str | None = None
    credit_limit: Decimal | None = Field(default=None, ge=0)
    credit_status: CreditStatus | None = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    business_name: str | None
    mobile_number: str
    whatsapp_number: str | None
    address: str | None
    city: str | None
    notes: str | None
    credit_limit: Decimal
    opening_balance: Decimal
    credit_status: CreditStatus
    current_outstanding: Decimal
    total_purchases: Decimal
    total_payments: Decimal
    last_purchase_date: date | None
    last_payment_date: date | None
    archived_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CustomerListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    business_name: str | None
    mobile_number: str
    credit_status: CreditStatus
    current_outstanding: Decimal
    credit_limit: Decimal
    archived_at: datetime | None


class PaginatedCustomers(BaseModel):
    items: list[CustomerListItem]
    total: int
    page: int
    page_size: int


class CreditSaleContext(BaseModel):
    """Shown to Staff/Owner right before recording a credit sale (FRD Section 6)."""
    customer_id: uuid.UUID
    current_outstanding: Decimal
    credit_limit: Decimal
    credit_status: CreditStatus
    available_credit: Decimal  # credit_limit - current_outstanding, floor 0
    # Placeholders wired up for real in Phase 5 (Risk Engine); kept in the
    # response shape now so the frontend contract doesn't change later.
    average_payment_delay_days: int = 0
    risk_rating: str = "not_available"