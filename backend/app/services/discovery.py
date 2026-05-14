from __future__ import annotations

import logging
from datetime import datetime

import yfinance as yf

logger = logging.getLogger(__name__)

SCREEN_IDS = ["day_gainers", "day_losers", "most_actives", "most_shorted_stocks"]


def _parse_quote(q: dict) -> dict | None:
    sym = q.get("symbol")
    if not sym or q.get("quoteType") != "EQUITY":
        return None

    earnings_ts = q.get("earningsTimestamp")
    earnings_date = None
    if earnings_ts and isinstance(earnings_ts, (int, float)) and earnings_ts > 0:
        try:
            earnings_date = datetime.fromtimestamp(earnings_ts).date().isoformat()
        except Exception:
            pass

    return {
        "symbol": sym,
        "name": q.get("shortName") or q.get("longName") or sym,
        "price": round(float(q.get("regularMarketPrice", 0)), 2),
        "change_pct": round(float(q.get("regularMarketChangePercent", 0)), 2),
        "volume": int(q.get("regularMarketVolume", 0)),
        "avg_volume": int(q.get("averageDailyVolume3Month", 0)),
        "market_cap": int(q.get("marketCap", 0)),
        "fifty_two_week_high": float(q.get("fiftyTwoWeekHigh", 0)),
        "fifty_two_week_low": float(q.get("fiftyTwoWeekLow", 0)),
        "earnings_date": earnings_date,
    }


def get_market_movers(screen_id: str = "most_actives", count: int = 25) -> dict:
    if screen_id not in SCREEN_IDS:
        screen_id = "most_actives"

    try:
        result = yf.screen(screen_id, count=min(count, 50))
        quotes = result.get("quotes", [])
    except Exception as e:
        logger.error("Screener failed for %s: %s", screen_id, e)
        return {"screen": screen_id, "results": []}

    parsed = []
    for q in quotes:
        p = _parse_quote(q)
        if p:
            parsed.append(p)

    return {"screen": screen_id, "results": parsed}
