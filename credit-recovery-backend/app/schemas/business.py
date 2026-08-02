import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

#Business api schema relevant to api calls
class BusinessUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    address: str | None = None
    phone: str | None = Field(default=None, max_length=20)
    whatsapp_number: str | None = Field(default=None, max_length=20)
    currency: str | None = Field(default=None, max_length=10)
    payment_instructions: str | None = None


class BusinessOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    logo_url: str | None
    address: str | None
    phone: str | None
    whatsapp_number: str | None
    currency: str
    payment_instructions: str | None
    created_at: datetime
    updated_at: datetime