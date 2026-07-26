import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.transaction import AdjustmentDirection, TransactionType


class CreditSaleCreate(BaseModel):
    customer_id: uuid.UUID
    amount: Decimal = Field(gt=0, decimal_places=2)
    invoice_number: str = Field(min_length=1, max_length=100)
    invoice_date: date
    description: str | None = None
    # Owner-override checkbox from the FRD's credit-limit warning flow.
    override_credit_limit: bool = False

    @field_validator("invoice_date")
    @classmethod
    def not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Invoice date cannot be in the future.")
        return v


class PaymentCreate(BaseModel):
    customer_id: uuid.UUID
    amount: Decimal = Field(gt=0, decimal_places=2)
    payment_date: date
    payment_method: str = Field(min_length=1, max_length=50)
    reference_number: str | None = Field(default=None, max_length=100)
    description: str | None = None

    @field_validator("payment_date")
    @classmethod
    def not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Payment date cannot be in the future.")
        return v


class AdjustmentCreate(BaseModel):
    customer_id: uuid.UUID
    amount: Decimal = Field(gt=0, decimal_places=2)
    direction: AdjustmentDirection
    description: str = Field(min_length=1)
    reference_number: str | None = Field(default=None, max_length=100)


class ReversalCreate(BaseModel):
    reason: str = Field(min_length=1, description="Required audit note explaining the correction.")


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_id: uuid.UUID
    type: TransactionType
    amount: Decimal
    invoice_number: str | None
    invoice_date: date | None
    payment_method: str | None
    adjustment_direction: AdjustmentDirection | None
    reference_number: str | None
    description: str | None
    is_reversal: bool
    reversed_transaction_id: uuid.UUID | None
    running_balance: Decimal
    created_by: uuid.UUID
    created_at: datetime


class LedgerFilter(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    type: TransactionType | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)


class PaginatedLedger(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int
    opening_balance: Decimal
    closing_balance: Decimal