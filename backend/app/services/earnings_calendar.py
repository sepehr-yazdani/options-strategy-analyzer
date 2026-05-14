from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta

import yfinance as yf

logger = logging.getLogger(__name__)


def _safe(val, default=None):
    if val is None:
        return default
    try:
        f = float(val)
        return default if math.isnan(f) else f
    except (TypeError, ValueError):
        return default


def get_earnings_calendar(start: str, end: str, limit: int = 50) -> list[dict]:
    try:
        cal = yf.Calendars()
        end_dt = datetime.fromisoformat(end) + timedelta(days=1)
        df = cal.get_earnings_calendar(
            filter_most_active=False,
            start=datetime.fromisoformat(start),
            end=end_dt,
            limit=limit,
        )
    except Exception as e:
        logger.error("Earnings calendar fetch failed: %s", e)
        return []

    if df is None or df.empty:
        return []

    results = []
    seen = set()
    for symbol, row in df.iterrows():
        if symbol in seen:
            continue
        seen.add(symbol)

        event_date = row.get("Event Start Date")
        date_str = str(event_date)[:10] if event_date is not None else None

        results.append({
            "symbol": str(symbol),
            "company": row.get("Company", ""),
            "date": date_str,
            "timing": row.get("Timing", ""),
            "market_cap": int(_safe(row.get("Marketcap"), 0)),
            "eps_estimate": _safe(row.get("EPS Estimate")),
        })

    return results
