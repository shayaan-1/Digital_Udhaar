"""
app/core/rate_limit.py

Brute-force protection for /auth/login and /auth/signup.

Implementation note: this is an in-process, fixed-window limiter. It is
correct and sufficient for Phase 1 (a single uvicorn worker per the
Roadmap's "single-owner web app" scope), but it does NOT share state across
multiple processes/workers or multiple app instances behind a load balancer.

Phase 2 already introduces Redis to the stack (see Roadmap) -- when that
lands, swap `_Store` for a Redis-backed implementation (INCR + EXPIRE, or a
sorted-set sliding window) behind the same `check()` interface, and nothing
in auth.py needs to change.
"""
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    def __init__(self, max_attempts: int, window_seconds: int):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> None:
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            hits = self._hits[key]
            hits[:] = [t for t in hits if t > cutoff]
            if len(hits) >= self.max_attempts:
                retry_after = int(self.window_seconds - (now - hits[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many attempts. Please try again later.",
                    headers={"Retry-After": str(max(retry_after, 1))},
                )
            hits.append(now)

    def reset(self, key: str) -> None:
        """Call on a successful login so a genuine user isn't punished by
        earlier failed attempts still sitting in the window."""
        with self._lock:
            self._hits.pop(key, None)


# 5 failed attempts per 5 minutes per email, and a wider net per IP to slow
# down credential-stuffing across many different email addresses.
_login_by_email = InMemoryRateLimiter(max_attempts=5, window_seconds=300)
_login_by_ip = InMemoryRateLimiter(max_attempts=20, window_seconds=300)
_signup_by_ip = InMemoryRateLimiter(max_attempts=5, window_seconds=3600)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def enforce_login_rate_limit(request: Request, email: str) -> None:
    _login_by_ip.check(f"ip:{_client_ip(request)}")
    _login_by_email.check(f"email:{email.lower()}")


def clear_login_rate_limit(email: str) -> None:
    _login_by_email.reset(f"email:{email.lower()}")


def enforce_signup_rate_limit(request: Request) -> None:
    _signup_by_ip.check(f"ip:{_client_ip(request)}")