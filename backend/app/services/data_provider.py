from __future__ import annotations

import logging
from datetime import date, timedelta

from app.models.option import OptionChainResponse, QuoteResponse, ShortInterest
from app.services.schwab_client import SchwabProvider
from app.services.yahoo_client import YahooProvider

logger = logging.getLogger(__name__)

_schwab = SchwabProvider()
_yahoo = YahooProvider()


def _fetch_short_interest(symbol: str) -> ShortInterest | None:
    try:
        import yfinance as yf
        info = yf.Ticker(symbol).info
        si = ShortInterest(
            shares_short=int(info.get("sharesShort", 0) or 0),
            short_percent_of_float=info.get("shortPercentOfFloat"),
            short_ratio=info.get("shortRatio"),
            float_shares=int(info.get("floatShares", 0) or 0),
        )
        return si if si.shares_short > 0 else None
    except Exception:
        return None


def _get_to_date_for_earnings(symbol: str) -> str | None:
    try:
        import yfinance as yf
        cal = yf.Ticker(symbol).calendar
        if cal and "Earnings Date" in cal:
            dates = cal["Earnings Date"]
            if dates:
                ed = dates[0] if isinstance(dates, list) else dates
                if hasattr(ed, "date"):
                    ed = ed.date() if callable(ed.date) else ed
                post_earnings = ed + timedelta(days=7)
                return post_earnings.isoformat()
    except Exception:
        pass
    return None


async def get_option_chain(
    symbol: str,
    from_date: str | None = None,
    to_date: str | None = None,
) -> tuple[OptionChainResponse, str]:
    if to_date is None:
        earnings_to = _get_to_date_for_earnings(symbol)
        default_to = (date.today() + timedelta(days=90)).isoformat()
        if earnings_to and earnings_to > default_to:
            to_date = earnings_to

    try:
        chain = await _schwab.get_option_chain(symbol, from_date, to_date)
        if chain.short_interest is None:
            chain.short_interest = _fetch_short_interest(symbol)
        return chain, "schwab"
    except Exception as exc:
        logger.info("Schwab chain unavailable, falling back to Yahoo: %s", exc)
        return await _yahoo.get_option_chain(symbol, from_date, to_date), "yahoo"


async def get_quote(symbol: str) -> tuple[QuoteResponse, str]:
    try:
        return await _schwab.get_quote(symbol), "schwab"
    except Exception as exc:
        logger.info("Schwab quote unavailable, falling back to Yahoo: %s", exc)
        return await _yahoo.get_quote(symbol), "yahoo"
