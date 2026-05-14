from datetime import date

from fastapi import APIRouter

from app.models.earnings import EarningsMoveAnalysis, EarningsResponse
from app.services.data_provider import get_option_chain
from app.services.earnings import get_earnings, get_earnings_move_analysis

router = APIRouter(prefix="/earnings", tags=["earnings"])


@router.get("/{symbol}", response_model=EarningsResponse)
async def earnings(symbol: str):
    return get_earnings(symbol)


@router.get("/{symbol}/move-analysis", response_model=EarningsMoveAnalysis)
async def move_analysis(symbol: str):
    chain, _ = await get_option_chain(symbol)

    implied_move = None
    current_atm_iv = None
    today = date.today()
    for exp in chain.expirations:
        dte = (exp.expiration - today).days
        if dte > 0 and exp.calls and exp.puts:
            price = chain.underlying_price
            atm_call = min(exp.calls, key=lambda s: abs(s.strike - price))
            atm_put = min(exp.puts, key=lambda s: abs(s.strike - price))
            if atm_call.ask > 0 and atm_put.ask > 0:
                straddle = atm_call.ask + atm_put.ask
                implied_move = round(straddle / price * 100, 2)
            atm_ivs = [s.iv for s in [atm_call, atm_put] if s.iv > 0]
            if atm_ivs:
                current_atm_iv = round(sum(atm_ivs) / len(atm_ivs), 4)
            break

    result = get_earnings_move_analysis(symbol, implied_move=implied_move)
    result.current_atm_iv = current_atm_iv
    return result
