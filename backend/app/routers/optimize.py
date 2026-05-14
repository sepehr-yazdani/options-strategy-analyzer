from fastapi import APIRouter

from app.models.optimization import IvRankData, OptimizationRequest, SuggestedStrategy
from app.services.data_provider import get_option_chain
from app.services.optimizer import compute_iv_rank, find_optimal_strategies

router = APIRouter(prefix="/optimize", tags=["optimize"])


@router.post("/find-strategy", response_model=list[SuggestedStrategy])
async def find_strategy(req: OptimizationRequest):
    chain, _source = await get_option_chain(req.symbol)
    return find_optimal_strategies(
        chain,
        target_price=req.target_price,
        max_loss=req.max_loss,
        max_dte=req.max_dte,
        strategy_types=req.strategy_types,
        objective=req.objective,
    )


@router.get("/iv-rank/{symbol}", response_model=IvRankData)
async def iv_rank(symbol: str):
    chain, _source = await get_option_chain(symbol)
    data = compute_iv_rank(chain)
    data.symbol = symbol.upper()
    return data
