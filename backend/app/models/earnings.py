from __future__ import annotations

from app.models.option import CamelModel


class EarningsEvent(CamelModel):
    date: str
    eps_estimate: float | None = None
    eps_actual: float | None = None
    surprise_pct: float | None = None


class EarningsResponse(CamelModel):
    symbol: str
    next_earnings_date: str | None = None
    dte_to_earnings: int | None = None
    eps_estimate: float | None = None
    recent_earnings: list[EarningsEvent] = []


class EarningsMove(CamelModel):
    date: str
    pre_close: float
    post_close: float
    move_pct: float
    abs_move_pct: float
    direction: str


class EarningsMoveAnalysis(CamelModel):
    symbol: str
    historical_moves: list[EarningsMove]
    avg_abs_move: float
    median_abs_move: float
    max_abs_move: float
    implied_move: float | None = None
    implied_vs_avg: float | None = None
    current_atm_iv: float | None = None
    next_earnings_date: str | None = None
    dte_to_earnings: int | None = None
