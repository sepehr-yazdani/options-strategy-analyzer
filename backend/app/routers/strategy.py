from fastapi import APIRouter

from app.models.option import PayoffRequest, PayoffResponse
from app.services.payoff import compute_payoff

router = APIRouter(tags=["strategy"])


@router.post("/strategy/payoff", response_model=PayoffResponse)
async def calculate_payoff(req: PayoffRequest):
    return compute_payoff(
        legs=req.legs,
        underlying_price=req.underlying_price,
        price_range=req.price_range,
        time_horizons=req.time_horizons,
    )
