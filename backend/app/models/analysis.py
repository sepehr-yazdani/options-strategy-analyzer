from __future__ import annotations

from pydantic import BaseModel

from app.models.option import CamelModel


class GridRequest(BaseModel):
    symbol: str
    option_type: str = "call"
    metric: str = "iv"
    target_price: float | None = None


class GridResponse(CamelModel):
    strikes: list[float]
    expirations: list[str]
    dtes: list[int]
    grid: list[list[float | None]]
    metric: str
    underlying_price: float


class ContractPoint(CamelModel):
    strike: float
    expiration: str
    dte: int
    bid: float
    ask: float
    last: float
    volume: int
    open_interest: int
    iv: float
    delta: float
    gamma: float
    theta: float
    vega: float
    in_the_money: bool


class ContractScatterRequest(BaseModel):
    symbol: str
    option_type: str = "call"


class ContractScatterResponse(CamelModel):
    contracts: list[ContractPoint]
    underlying_price: float
    symbol: str
    option_type: str
    short_percent_of_float: float | None = None
    short_ratio: float | None = None
