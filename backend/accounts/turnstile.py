"""Utility helpers for verifying Cloudflare Turnstile tokens."""

from __future__ import annotations

import json
import logging
from urllib import parse, request

from django.conf import settings

logger = logging.getLogger(__name__)
VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile_token(token: str | None) -> bool:
    """Return True when the provided Turnstile token is valid.

    When the secret key is not configured (e.g., local development), the
    verification is skipped so the backend continues to function without the
    widget.
    """

    secret = getattr(settings, "TURNSTILE_SECRET_KEY", "") or ""
    if not secret:
        return True
    if not token:
        return False

    payload = parse.urlencode({"secret": secret, "response": token}).encode()
    req = request.Request(VERIFY_URL, data=payload)

    try:
        with request.urlopen(req, timeout=5) as resp:  # noqa: S310 - external call intentional
            result = json.load(resp)
    except Exception as exc:  # noqa: BLE001 - log and treat as failure
        logger.warning("Turnstile verification error: %s", exc)
        return False

    if result.get("success"):
        return True

    logger.info("Turnstile verification rejected: %s", result)
    return False
