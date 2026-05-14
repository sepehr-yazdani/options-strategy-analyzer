from __future__ import annotations

import logging
import time

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TOKEN_URL = "https://api.schwabapi.com/v1/oauth/token"

_access_token: str = ""
_expires_at: float = 0.0


def _is_configured() -> bool:
    return bool(settings.schwab_client_id and settings.schwab_client_secret)


async def get_valid_token() -> str:
    global _access_token, _expires_at

    if not _is_configured():
        raise ValueError("Schwab credentials not set in .env")

    if _access_token and time.time() < _expires_at:
        return _access_token

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(settings.schwab_client_id, settings.schwab_client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        data = resp.json()

    _access_token = data["access_token"]
    _expires_at = time.time() + int(data.get("expires_in", 1800)) - 30
    logger.info("Schwab token acquired, expires in %ss", data.get("expires_in"))
    return _access_token
