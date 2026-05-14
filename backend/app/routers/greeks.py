from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter

from app.models.greeks import (
    GreeksSurfacePoint,
    GreeksSurfaceRequest,
    GreeksSurfaceResponse,
    IvImpactPoint,
    IvImpactRequest,
    IvImpactResponse,
    TimeDecayPoint,
    TimeDecayRequest,
    TimeDecayResponse,
)
from app.services.greeks_engine import (
    DIVIDEND_YIELD,
    RISK_FREE_RATE,
    compute_greeks,
    compute_greeks_over_time,
    compute_greeks_surface,
    compute_theoretical_price,
)

router = APIRouter(prefix="/greeks", tags=["greeks"])


@router.post("/surface", response_model=GreeksSurfaceResponse)
async def greeks_surface(req: GreeksSurfaceRequest):
    exp_date = datetime.strptime(req.expiration, "%Y-%m-%d").date()
    dte = (exp_date - date.today()).days
    t_years = max(dte, 0) / 365.0

    if req.price_range:
        spot_range = req.price_range
    else:
        half = max(req.underlying_price * 0.20, req.strike * 0.20)
        center = (req.strike + req.underlying_price) / 2
        spot_range = (max(0.01, center - half), center + half)

    raw = compute_greeks_surface(
        req.option_type, req.strike, t_years, req.iv, spot_range,
        RISK_FREE_RATE, DIVIDEND_YIELD, 200,
    )
    points = [GreeksSurfacePoint(**p) for p in raw]
    return GreeksSurfaceResponse(
        points=points, option_type=req.option_type,
        strike=req.strike, dte=dte, iv=req.iv,
    )


@router.post("/time-decay", response_model=TimeDecayResponse)
async def greeks_time_decay(req: TimeDecayRequest):
    raw = compute_greeks_over_time(
        req.option_type, req.underlying_price, req.strike,
        req.iv, req.dte, RISK_FREE_RATE, DIVIDEND_YIELD,
    )
    points = [TimeDecayPoint(**p) for p in raw]
    return TimeDecayResponse(
        points=points, option_type=req.option_type,
        strike=req.strike, underlying_price=req.underlying_price, iv=req.iv,
    )


@router.post("/iv-impact", response_model=IvImpactResponse)
async def greeks_iv_impact(req: IvImpactRequest):
    t_years = max(req.dte, 1) / 365.0
    iv_low, iv_high = req.iv_range or (0.05, 1.50)

    import numpy as np
    points = []
    for iv in np.linspace(iv_low, iv_high, 150):
        iv = float(iv)
        g = compute_greeks(
            req.option_type, req.underlying_price, req.strike,
            t_years, RISK_FREE_RATE, iv, DIVIDEND_YIELD,
        )
        p = compute_theoretical_price(
            req.option_type, req.underlying_price, req.strike,
            t_years, RISK_FREE_RATE, iv, DIVIDEND_YIELD,
        )
        points.append(IvImpactPoint(
            iv=round(iv, 4), delta=g.delta, gamma=g.gamma,
            theta=g.theta, vega=g.vega, theoretical_price=round(p, 4),
        ))

    return IvImpactResponse(
        points=points, option_type=req.option_type,
        strike=req.strike, dte=req.dte, underlying_price=req.underlying_price,
    )
