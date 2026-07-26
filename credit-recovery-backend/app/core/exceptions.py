"""
app/core/exceptions.py

Domain-level exceptions raised by the service layer. These are translated to
proper HTTP responses in app/main.py's exception handlers, keeping services
free of any HTTP/framework concerns (clean separation of layers).
"""
from decimal import Decimal


class DomainError(Exception):
    """Base class for all business-rule violations."""

    status_code = 400

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(DomainError):
    status_code = 404


class ForbiddenError(DomainError):
    status_code = 403


class ConflictError(DomainError):
    status_code = 409


class ValidationError(DomainError):
    status_code = 422


class CustomerArchivedError(ConflictError):
    def __init__(self):
        super().__init__("This customer is archived and cannot receive new transactions.")


class CustomerBlockedError(ConflictError):
    def __init__(self):
        super().__init__("This customer's credit status is 'blocked'. No further credit sales are allowed.")


class CreditLimitExceededError(ConflictError):
    def __init__(self, current_outstanding: Decimal, credit_limit: Decimal, projected_balance: Decimal):
        self.current_outstanding = current_outstanding
        self.credit_limit = credit_limit
        self.projected_balance = projected_balance
        super().__init__(
            "This sale would push the customer's outstanding balance "
            f"({projected_balance}) above their credit limit ({credit_limit}). "
            "Set override=true to proceed anyway."
        )


class InvalidCredentialsError(DomainError):
    status_code = 401

    def __init__(self):
        super().__init__("Invalid email or password.")


class InactiveUserError(DomainError):
    status_code = 403

    def __init__(self):
        super().__init__("This user account has been disabled.")