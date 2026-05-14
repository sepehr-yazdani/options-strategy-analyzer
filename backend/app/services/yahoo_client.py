from __future__ import annotations

from datetime import date, datetime

import yfinance as yf

from app.models.option import (
    ExpirationData,
    Greeks,
    OptionChainResponse,
    QuoteResponse,
    ShortInterest,
    StrikeData,
)


class YahooProvider:
    async def get_option_chain(
        self,
        symbol: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> OptionChainResponse:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        current_price = info.get("regularMarketPrice") or info.get("previousClose", 0.0)

        expirations_strs = ticker.options  # tuple of date strings like '2026-04-17'

        # Filter by date range if provided
        exp_dates = [datetime.strptime(e, "%Y-%m-%d").date() for e in expirations_strs]
        if from_date:
            from_d = datetime.strptime(from_date, "%Y-%m-%d").date()
            exp_dates = [d for d in exp_dates if d >= from_d]
        if to_date:
            to_d = datetime.strptime(to_date, "%Y-%m-%d").date()
            exp_dates = [d for d in exp_dates if d <= to_d]

        today = date.today()
        expirations: list[ExpirationData] = []

        for exp_date in exp_dates:
            exp_str = exp_date.strftime("%Y-%m-%d")
            chain = ticker.option_chain(exp_str)
            dte = (exp_date - today).days

            calls = _parse_strikes(chain.calls, current_price, "call")
            puts = _parse_strikes(chain.puts, current_price, "put")

            expirations.append(
                ExpirationData(
                    expiration=exp_date,
                    dte=dte,
                    calls=calls,
                    puts=puts,
                )
            )

        si = ShortInterest(
            shares_short=int(info.get("sharesShort", 0) or 0),
            short_percent_of_float=_safe_float(info.get("shortPercentOfFloat")),
            short_ratio=_safe_float(info.get("shortRatio")),
            float_shares=int(info.get("floatShares", 0) or 0),
        )

        return OptionChainResponse(
            symbol=symbol.upper(),
            underlying_price=float(current_price),
            expirations=expirations,
            short_interest=si if si.shares_short > 0 else None,
        )

    async def get_quote(self, symbol: str) -> QuoteResponse:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return QuoteResponse(
            symbol=symbol.upper(),
            last=float(info.get("regularMarketPrice") or info.get("previousClose", 0)),
            bid=float(info.get("bid", 0)),
            ask=float(info.get("ask", 0)),
            volume=int(info.get("regularMarketVolume") or info.get("volume", 0)),
        )


def _safe_int(val, default: int = 0) -> int:
    """Convert a value to int, handling NaN and None."""
    if val is None:
        return default
    try:
        import math
        if math.isnan(val):
            return default
    except (TypeError, ValueError):
        pass
    return int(val)


def _safe_float(val, default: float = 0.0) -> float:
    """Convert a value to float, handling NaN and None."""
    if val is None:
        return default
    try:
        f = float(val)
        import math
        if math.isnan(f):
            return default
        return f
    except (TypeError, ValueError):
        return default


def _parse_strikes(df, current_price: float, option_type: str) -> list[StrikeData]:
    """Convert a yfinance options DataFrame into our StrikeData models."""
    strikes = []
    for _, row in df.iterrows():
        strike = _safe_float(row.get("strike"))
        iv = _safe_float(row.get("impliedVolatility"))

        if option_type == "call":
            itm = current_price > strike
        else:
            itm = current_price < strike

        strikes.append(
            StrikeData(
                strike=strike,
                bid=_safe_float(row.get("bid")),
                ask=_safe_float(row.get("ask")),
                last=_safe_float(row.get("lastPrice")),
                volume=_safe_int(row.get("volume")),
                open_interest=_safe_int(row.get("openInterest")),
                iv=round(iv, 4),
                greeks=Greeks(),
                in_the_money=itm,
            )
        )
    return strikes
