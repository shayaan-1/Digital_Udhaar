from fastapi import APIRouter

from app.api.v1 import auth, businesses, customers, dashboard, transactions

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(businesses.router)
api_router.include_router(customers.router)
api_router.include_router(transactions.router)
api_router.include_router(dashboard.router)