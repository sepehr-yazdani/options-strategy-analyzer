from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class CamelModel(BaseModel):
    """Base model that serializes to camelCase for JSON responses."""
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)


class Greeks(CamelModel):
    delta: float = 0.0
    gamma: float = 0.0
    theta: float = 0.0
    vega: float = 0.0
    rho: float = 0.0


class OptionLeg(CamelModel):
    id: str
    option_type: Literal["call", "put", "stock"]
    action: Literal["buy", "sell"]
    strike: float | None = None
    expiration: date | None = None
    quantity: int = 1
    premium: float = 0.0
    iv: float | None = None


class StrikeData(CamelModel):
    strike: float
    bid: float = 0.0
    ask: float = 0.0
    last: float = 0.0
    volume: int = 0
    open_interest: int = 0
    iv: float = 0.0
    greeks: Greeks = Field(default_factory=Greeks)
    in_the_money: bool = False


class ExpirationData(CamelModel):
    expiration: date
    dte: int
    calls: list[StrikeData] = []
    puts: list[StrikeData] = []


class ShortInterest(CamelModel):
    shares_short: int = 0
    short_percent_of_float: float | None = None
    short_ratio: float | None = None
    float_shares: int = 0


class OptionChainResponse(CamelModel):
    symbol: str
    underlying_price: float
    expirations: list[ExpirationData] = []
    short_interest: ShortInterest | None = None


class QuoteResponse(CamelModel):
    symbol: str
    last: float
    bid: float = 0.0
    ask: float = 0.0
    volume: int = 0


class PayoffPoint(CamelModel):
    underlying_price: float
    pnl: float


class PayoffCurve(CamelModel):
    label: str
    days_to_expiry: int
    points: list[PayoffPoint]


class PayoffRequest(BaseModel):
    legs: list[OptionLeg]
    underlying_price: float
    price_range: tuple[float, float] | None = None
    time_horizons: list[int] | None = None
    greek_overrides: dict[str, Greeks] = Field(default_factory=dict)


class PayoffResponse(CamelModel):
    curves: list[PayoffCurve]
    breakevens: list[float]
    max_profit: float | None = None
    max_loss: float | None = None
    aggregate_greeks: Greeks = Field(default_factory=Greeks)
