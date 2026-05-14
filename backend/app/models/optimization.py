from __future__ import annotations

from pydantic import BaseModel

from app.models.option import CamelModel, OptionLeg


class OptimizationRequest(BaseModel):
    symbol: str
    target_price: float
    max_loss: float | None = None
    max_dte: int | None = None
    max_legs: int = 4
    strategy_types: list[str] | None = None
    objective: str = "reward_risk"


class SuggestedStrategy(CamelModel):
    name: str
    legs: list[OptionLeg]
    pnl_at_target: float
    max_profit: float | None = None
    max_loss: float | None = None
    breakevens: list[float] = []
    reward_risk_ratio: float | None = None
    probability_of_profit: float | None = None
    dte: int = 0
    score: float = 0.0


class IvRankData(CamelModel):
    symbol: str
    current_iv: float
    iv_high: float
    iv_low: float
    iv_rank: float
    iv_percentile: float
    classification: str
