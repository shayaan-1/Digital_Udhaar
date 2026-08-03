"""
scripts/seed.py

Seeds the database with one demo business + owner login, and 5 demo
customers with realistic PKR balances and transaction history -- built
entirely through the real service layer (auth_service, customer_service,
transaction_service), not raw INSERTs. That means:
  - Seeded data obeys every validation rule and balance calculation real
    usage would, so what you see in the frontend is trustworthy.
  - Running this script is itself a smoke test that signup, customer
    creation, credit sales, payments, adjustments, and reversals all work
    end-to-end against a real database.

Usage:
    cd backend
    python -m scripts.seed

Safe to re-run: if the demo owner's email already exists, the script exits
without creating duplicates.
Remove this file before sending to production
"""
import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.customer import CreditStatus
from app.models.transaction import AdjustmentDirection, TransactionType
from app.models.user import User
from app.schemas.auth import SignupRequest
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.services import auth_service, customer_service, transaction_service

DEMO_OWNER_EMAIL = "khataDemo@gmail.com"
DEMO_OWNER_PASSWORD = "Demo@Pass123"  # meets signup's password-strength rule
DEMO_BUSINESS_NAME = "ABC Traders"

# Every customer is created as 'active' first (transactions need an active,
# non-blocked customer to post against), then flipped to its intended final
# credit_status / archived state at the very end -- this mirrors how these
# states actually arise in real usage (a customer doesn't start out blocked,
# they get blocked after a pattern of late payment).
CUSTOMERS = [
    dict(
        name="Ahmed Furniture House", business_name="Ahmed Furniture",
        mobile_number="03001234567", city="Lahore",
        credit_limit=Decimal("50000"), opening_balance=Decimal("10000"),
        final_status=CreditStatus.active, archived=False,
    ),
    dict(
        name="Bilal Traders", business_name="Bilal Traders",
        mobile_number="03011234567", city="Karachi",
        credit_limit=Decimal("30000"), opening_balance=Decimal("0"),
        final_status=CreditStatus.active, archived=False,
    ),
    dict(
        name="Chaudhry Hardware", business_name="Chaudhry Hardware Store",
        mobile_number="03021234567", city="Faisalabad",
        credit_limit=Decimal("20000"), opening_balance=Decimal("5000"),
        final_status=CreditStatus.restricted, archived=False,
    ),
    dict(
        name="Danish Electronics", business_name="Danish Electronics",
        mobile_number="03031234567", city="Lahore",
        credit_limit=Decimal("15000"), opening_balance=Decimal("0"),
        final_status=CreditStatus.blocked, archived=False,
    ),
    dict(
        name="Ehsan General Store", business_name=None,
        mobile_number="03041234567", city="Multan",
        credit_limit=Decimal("10000"), opening_balance=Decimal("0"),
        final_status=CreditStatus.active, archived=True,
    ),
]


def _days_ago(n: int) -> date:
    return date.today() - timedelta(days=n)


def run() -> None:
    db = SessionLocal()
    try:
        existing = db.execute(
            select(User).where(User.email == DEMO_OWNER_EMAIL)
        ).scalar_one_or_none()
        if existing is not None:
            print(f"Seed data already exists (owner '{DEMO_OWNER_EMAIL}' found). Skipping.")
            return

        print("Creating demo business + owner...")
        owner = auth_service.signup(
            db,
            SignupRequest(
                business_name=DEMO_BUSINESS_NAME,
                email=DEMO_OWNER_EMAIL,
                password=DEMO_OWNER_PASSWORD,
            ),
        )
        db.flush()
        print(f"  business_id = {owner.business_id}")
        print(f"  login       = {DEMO_OWNER_EMAIL} / {DEMO_OWNER_PASSWORD}")

        for i, raw in enumerate(CUSTOMERS, start=1):
            data = dict(raw)
            final_status = data.pop("final_status")
            should_archive = data.pop("archived")

            print(f"Creating customer {i}/5: {data['name']}...")
            customer = customer_service.create_customer(
                db,
                business_id=owner.business_id,
                created_by=owner.id,
                data=CustomerCreate(**data),  # credit_status defaults to 'active'
            )
            db.flush()

            # Two credit sales spread over the last month.
            transaction_service.create_transaction(
                db,
                business_id=owner.business_id,
                customer_id=customer.id,
                tx_type=TransactionType.credit_sale,
                amount=Decimal("4000"),
                created_by=owner.id,
                idempotency_key=f"seed-sale-1-{customer.id}",
                invoice_number=f"INV-{1000 + i}",
                invoice_date=_days_ago(20),
                description="Seed data: sample credit sale",
                override_credit_limit=True,
            )
            transaction_service.create_transaction(
                db,
                business_id=owner.business_id,
                customer_id=customer.id,
                tx_type=TransactionType.credit_sale,
                amount=Decimal("2500"),
                created_by=owner.id,
                idempotency_key=f"seed-sale-2-{customer.id}",
                invoice_number=f"INV-{2000 + i}",
                invoice_date=_days_ago(7),
                description="Seed data: sample credit sale",
                override_credit_limit=True,
            )

            # One payment against the outstanding balance.
            transaction_service.create_transaction(
                db,
                business_id=owner.business_id,
                customer_id=customer.id,
                tx_type=TransactionType.payment,
                amount=Decimal("3000"),
                created_by=owner.id,
                idempotency_key=f"seed-payment-1-{customer.id}",
                payment_method="cash" if i % 2 == 0 else "easypaisa",
                reference_number=f"PMT-{i}",
                description="Seed data: sample payment",
            )

            # Give the first customer one adjustment + its reversal, so the
            # frontend has a real example of both to render/test against.
            if i == 1:
                adj = transaction_service.create_transaction(
                    db,
                    business_id=owner.business_id,
                    customer_id=customer.id,
                    tx_type=TransactionType.adjustment,
                    amount=Decimal("500"),
                    created_by=owner.id,
                    idempotency_key=f"seed-adjustment-1-{customer.id}",
                    adjustment_direction=AdjustmentDirection.decrease,
                    description="Seed data: goodwill discount adjustment",
                )
                transaction_service.reverse_transaction(
                    db,
                    business_id=owner.business_id,
                    original_transaction_id=adj.transaction.id,
                    created_by=owner.id,
                    idempotency_key=f"seed-reversal-1-{customer.id}",
                    reason="Seed data: correcting adjustment entered in error",
                )

            # Apply the customer's intended final state now that its
            # transaction history has already been posted.
            if final_status != CreditStatus.active:
                customer_service.update_customer(
                    db,
                    business_id=owner.business_id,
                    customer_id=customer.id,
                    data=CustomerUpdate(credit_status=final_status),
                )
            if should_archive:
                customer_service.archive_customer(
                    db, business_id=owner.business_id, customer_id=customer.id
                )

        db.commit()
        print("\nSeed complete — 1 owner, 5 customers, ~4 transactions each.")
        print(f"Log in with: {DEMO_OWNER_EMAIL} / {DEMO_OWNER_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
