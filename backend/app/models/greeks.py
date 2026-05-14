from __future__ import annotations

from pydantic import BaseModel

from app.models.option import CamelModel


class GreeksSurfaceRequest(BaseModel):
    option_type: str
    strike: float
    expiration: str
    iv: float
    underlying_price: float
    price_range: tuple[float, float] | None = None


class GreeksSurfacePoint(CamelModel):
    underlying_price: float
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float
    theoretical_price: float


class GreeksSurfaceResponse(CamelModel):
    points: list[GreeksSurfacePoint]
    option_type: str
    strike: float
    dte: int
    iv: float


class TimeDecayRequest(BaseModel):
    option_type: str
    strike: float
    dte: int
    iv: float
    underlying_price: float


class TimeDecayPoint(CamelModel):
    dte: int
    delta: float
    gamma: float
    theta: float
    vega: float
    theoretical_price: float


class TimeDecayResponse(CamelModel):
    points: list[TimeDecayPoint]
    option_type: str
    strike: float
    underlying_price: float
    iv: float


class IvImpactRequest(BaseModel):
    option_type: str
    strike: float
    dte: int
    underlying_price: float
    iv_range: tuple[float, float] | None = None


class IvImpactPoint(CamelModel):
    iv: float
    delta: float
    gamma: float
    theta: float
    vega: float
    theoretical_price: float


class IvImpactResponse(CamelModel):
    points: list[IvImpactPoint]
    option_type: str
    strike: float
    dte: int
    underlying_price: float
