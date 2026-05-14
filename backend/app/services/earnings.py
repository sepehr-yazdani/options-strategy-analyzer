from __future__ import annotations

import logging
import math
from datetime import date, datetime

import yfinance as yf

from datetime import timedelta

from app.models.earnings import EarningsEvent, EarningsMove, EarningsMoveAnalysis, EarningsResponse

logger = logging.getLogger(__name__)


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) else round(f, 4)
    except (TypeError, ValueError):
        return None


def get_earnings(symbol: str) -> EarningsResponse:
    ticker = yf.Ticker(symbol)
    today = date.today()

    next_date: str | None = None
    dte: int | None = None
    eps_est: float | None = None

    try:
        cal = ticker.calendar
        if cal and "Earnings Date" in cal:
            dates = cal["Earnings Date"]
            if dates:
                ed = dates[0] if isinstance(dates, list) else dates
                if hasattr(ed, "date"):
                    ed = ed.date() if callable(ed.date) else ed
                next_date = str(ed)
                dte = (date.fromisoformat(next_date) - today).days
            eps_est = _safe_float(cal.get("Earnings Average"))
    except Exception as e:
        logger.info("Calendar fetch failed for %s: %s", symbol, e)

    recent: list[EarningsEvent] = []
    try:
        ed = ticker.earnings_dates
        if ed is not None and len(ed) > 0:
            for dt_idx, row in ed.iterrows():
                dt_val = dt_idx
                if hasattr(dt_val, "date"):
                    dt_date = dt_val.date()
                    dt_str = dt_date.isoformat()
                else:
                    dt_str = str(dt_val)[:10]
                    dt_date = date.fromisoformat(dt_str)

                is_future = dt_date > today
                actual = _safe_float(row.get("Reported EPS"))

                if is_future and actual is None:
                    continue

                recent.append(EarningsEvent(
                    date=dt_str,
                    eps_estimate=_safe_float(row.get("EPS Estimate")),
                    eps_actual=actual,
                    surprise_pct=_safe_float(row.get("Surprise(%)")),
                ))
                if len(recent) >= 8:
                    break
    except Exception as e:
        logger.info("Earnings dates fetch failed for %s: %s", symbol, e)

    return EarningsResponse(
        symbol=symbol.upper(),
        next_earnings_date=next_date,
        dte_to_earnings=dte,
        eps_estimate=eps_est,
        recent_earnings=recent,
    )


def _find_close(hist, target_date, direction: int, max_days: int = 5) -> float | None:
    for offset in range(0, max_days):
        d = target_date + timedelta(days=direction * (offset + (1 if direction > 0 else 1)))
        matches = hist.loc[hist.index.date == d]
        if len(matches) > 0:
            return float(matches["Close"].iloc[0])
    return None


def get_earnings_move_analysis(
    symbol: str,
    implied_move: float | None = None,
    next_earnings_date: str | None = None,
    dte_to_earnings: int | None = None,
) -> EarningsMoveAnalysis:
    ticker = yf.Ticker(symbol)
    today = date.today()

    hist = ticker.history(period="5y")
    if hist.empty:
        return EarningsMoveAnalysis(
            symbol=symbol.upper(), historical_moves=[],
            avg_abs_move=0, median_abs_move=0, max_abs_move=0,
        )

    ed = None
    try:
        ed = ticker.earnings_dates
    except Exception:
        pass

    if next_earnings_date is None:
        try:
            cal = ticker.calendar
            if cal and "Earnings Date" in cal:
                dates_list = cal["Earnings Date"]
                if dates_list:
                    d = dates_list[0] if isinstance(dates_list, list) else dates_list
                    if hasattr(d, "date"):
                        d = d.date() if callable(d.date) else d
                    next_earnings_date = str(d)
                    dte_to_earnings = (date.fromisoformat(next_earnings_date) - today).days
        except Exception:
            pass

    moves: list[EarningsMove] = []
    if ed is not None:
        for dt_idx in ed.index:
            ed_date = dt_idx.date() if hasattr(dt_idx, "date") else date.fromisoformat(str(dt_idx)[:10])
            if ed_date >= today:
                continue

            pre = _find_close(hist, ed_date, -1)
            post = _find_close(hist, ed_date, 1)
            if pre is None or post is None or pre <= 0:
                continue

            move_pct = round((post - pre) / pre * 100, 2)
            moves.append(EarningsMove(
                date=ed_date.isoformat(),
                pre_close=round(pre, 2),
                post_close=round(post, 2),
                move_pct=move_pct,
                abs_move_pct=round(abs(move_pct), 2),
                direction="up" if move_pct > 0 else "down",
            ))
            if len(moves) >= 12:
                break

    abs_moves = [m.abs_move_pct for m in moves]
    if abs_moves:
        avg = round(sum(abs_moves) / len(abs_moves), 2)
        sorted_moves = sorted(abs_moves)
        mid = len(sorted_moves) // 2
        median = sorted_moves[mid] if len(sorted_moves) % 2 else round((sorted_moves[mid - 1] + sorted_moves[mid]) / 2, 2)
        max_move = max(abs_moves)
    else:
        avg = median = max_move = 0.0

    implied_vs_avg = None
    if implied_move is not None and avg > 0:
        implied_vs_avg = round(implied_move / avg, 2)

    return EarningsMoveAnalysis(
        symbol=symbol.upper(),
        historical_moves=moves,
        avg_abs_move=avg,
        median_abs_move=median,
        max_abs_move=max_move,
        implied_move=implied_move,
        implied_vs_avg=implied_vs_avg,
        next_earnings_date=next_earnings_date,
        dte_to_earnings=dte_to_earnings,
    )
