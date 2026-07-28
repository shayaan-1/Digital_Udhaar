from datetime import date, datetime, time, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionType

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    todays_credit_sales: Decimal
    todays_payments: Decimal
    total_outstanding: Decimal
    total_customers: int
    active_customers: int
    archived_customers: int


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    today_start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
    today_end = datetime.combine(date.today(), time.max, tzinfo=timezone.utc)

    def _sum_today(tx_type: TransactionType) -> Decimal:
        result = db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.business_id == current_user.business_id,
                Transaction.type == tx_type,
                Transaction.is_reversal.is_(False),
                Transaction.created_at.between(today_start, today_end),
            )
        ).scalar_one()
        return Decimal(result)

    total_outstanding = db.execute(
        select(func.coalesce(func.sum(Customer.current_outstanding), 0)).where(
            Customer.business_id == current_user.business_id, Customer.archived_at.is_(None)
        )
    ).scalar_one()

    total_customers = db.execute(
        select(func.count()).select_from(Customer).where(Customer.business_id == current_user.business_id)
    ).scalar_one()

    active_customers = db.execute(
        select(func.count())
        .select_from(Customer)
        .where(Customer.business_id == current_user.business_id, Customer.archived_at.is_(None))
    ).scalar_one()

    return DashboardSummary(
        todays_credit_sales=_sum_today(TransactionType.credit_sale),
        todays_payments=_sum_today(TransactionType.payment),
        total_outstanding=Decimal(total_outstanding),
        total_customers=total_customers,
        active_customers=active_customers,
        archived_customers=total_customers - active_customers,
    )