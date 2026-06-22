from __future__ import annotations

import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

# Simple in-memory rate limiter: key -> list of timestamps
_buckets: dict[str, list[float]] = defaultdict(list)


def _cleanup(key: str, window: float) -> None:
    """Remove timestamps older than the window."""
    cutoff = time.monotonic() - window
    _buckets[key] = [t for t in _buckets[key] if t > cutoff]


def check_rate_limit(
    request: Request,
    *,
    max_requests: int = 10,
    window_seconds: float = 60.0,
    key_prefix: str = "global",
) -> None:
    """Raise 429 if the caller exceeds *max_requests* within *window_seconds*."""
    forwarded_for = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
    client_ip = forwarded_for or (request.client.host if request.client else "unknown")
    key = f"{key_prefix}:{client_ip}"
    _cleanup(key, window_seconds)
    if len(_buckets[key]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )
    _buckets[key].append(time.monotonic())

