from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require_owner
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.business import Business
from app.schemas.business import BusinessOut, BusinessUpdate

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.get("/me", response_model=BusinessOut)
def get_my_business(current_user: CurrentUser = Depends(require_owner), db: Session = Depends(get_db)):
    business = db.get(Business, current_user.business_id)
    if business is None:
        raise NotFoundError("Business not found.")
    return business


@router.patch("/me", response_model=BusinessOut)
def update_my_business(
    payload: BusinessUpdate,
    current_user: CurrentUser = Depends(require_owner),
    db: Session = Depends(get_db),
):
    business = db.get(Business, current_user.business_id)
    if business is None:
        raise NotFoundError("Business not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(business, field, value)
    db.flush()
    return business