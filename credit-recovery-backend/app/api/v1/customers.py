import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.customer import (
    CustomerCreate,
    CustomerListItem,
    CustomerOut,
    CustomerUpdate,
    PaginatedCustomers,
)
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return customer_service.create_customer(
        db, business_id=current_user.business_id, created_by=current_user.id, data=payload
    )


@router.get("", response_model=PaginatedCustomers)
def list_customers(
    search: str | None = Query(default=None, description="Matches customer name or mobile number."),
    include_archived: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = customer_service.list_customers(
        db,
        business_id=current_user.business_id,
        search=search,
        include_archived=include_archived,
        page=page,
        page_size=page_size,
    )
    return PaginatedCustomers(
        items=[CustomerListItem.model_validate(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return customer_service.get_customer_or_404(db, business_id=current_user.business_id, customer_id=customer_id)


@router.patch("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return customer_service.update_customer(
        db, business_id=current_user.business_id, customer_id=customer_id, data=payload
    )


@router.post("/{customer_id}/archive", response_model=CustomerOut)
def archive_customer(
    customer_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Per FRD Section 4: hard delete is never exposed via the API at all in
    # Phase 1 -- archiving is the only supported removal path, regardless of
    # whether the customer has transactions.
    return customer_service.archive_customer(db, business_id=current_user.business_id, customer_id=customer_id)