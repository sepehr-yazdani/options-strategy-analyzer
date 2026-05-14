from typing import Optional

from fastapi import APIRouter

from app.services.data_provider import get_option_chain, get_quote

router = APIRouter(tags=["chain"])


@router.get("/chain/{symbol}")
async def get_chain(
    symbol: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
):
    chain, source = await get_option_chain(symbol, from_date, to_date)
    return {**chain.model_dump(by_alias=True), "source": source}


@router.get("/quote/{symbol}")
async def get_quote_endpoint(symbol: str):
    quote, source = await get_quote(symbol)
    return {**quote.model_dump(by_alias=True), "source": source}
