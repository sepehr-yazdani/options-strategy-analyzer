from fastapi import APIRouter

from app.models.analysis import (
    ContractScatterRequest,
    ContractScatterResponse,
    GridRequest,
    GridResponse,
)
from app.services.analysis import build_contract_scatter, build_strike_expiry_grid
from app.services.data_provider import get_option_chain

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/strike-expiry-grid", response_model=GridResponse)
async def strike_expiry_grid(req: GridRequest):
    chain, _source = await get_option_chain(req.symbol)
    result = build_strike_expiry_grid(
        chain,
        option_type=req.option_type,
        metric=req.metric,
        target_price=req.target_price,
    )
    return result


@router.post("/contract-scatter", response_model=ContractScatterResponse)
async def contract_scatter(req: ContractScatterRequest):
    chain, _source = await get_option_chain(req.symbol)
    contracts = build_contract_scatter(chain, option_type=req.option_type)
    si = chain.short_interest
    return ContractScatterResponse(
        contracts=contracts,
        underlying_price=chain.underlying_price,
        symbol=req.symbol.upper(),
        option_type=req.option_type,
        short_percent_of_float=si.short_percent_of_float if si else None,
        short_ratio=si.short_ratio if si else None,
    )
