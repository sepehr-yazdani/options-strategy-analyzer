import asyncio
import logging

from fastapi import APIRouter, Query

from app.services.discovery import SCREEN_IDS, get_market_movers
from app.services.earnings_calendar import get_earnings_calendar
from app.services.sentiment import get_wsb_sentiment
from app.services.unusual_activity import scan_unusual

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discovery", tags=["discovery"])


@router.get("/movers")
async def movers(
    screen: str = Query("most_actives", enum=SCREEN_IDS),
    count: int = Query(25, ge=1, le=50),
):
    return get_market_movers(screen, count)


@router.get("/unusual-activity/top-movers")
async def unusual_activity_top():
    movers = get_market_movers("most_actives", 15)
    symbols = [r["symbol"] for r in movers.get("results", [])]

    from app.services.data_provider import get_option_chain_fast
    all_unusual = []
    for sym in symbols:
        try:
            chain, _ = await get_option_chain_fast(sym)
            unusual = scan_unusual(chain)[:10]
            all_unusual.extend(unusual)
        except Exception as e:
            logger.info("Unusual scan failed for %s: %s", sym, e)

    all_unusual.sort(key=lambda x: -x["volume"])
    return {"results": all_unusual}


@router.post("/unusual-activity/scan")
async def unusual_activity_scan(body: dict):
    from app.services.data_provider import get_option_chain_fast
    symbols = body.get("symbols", [])[:15]
    all_unusual = []
    tasks = [get_option_chain_fast(sym) for sym in symbols]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for chain_result in results:
        if isinstance(chain_result, Exception):
            continue
        chain, _ = chain_result
        all_unusual.extend(scan_unusual(chain)[:10])
    all_unusual.sort(key=lambda x: -x["volume"])
    return {"results": all_unusual}


@router.get("/unusual-activity/{symbol}")
async def unusual_activity_single(symbol: str):
    from app.services.data_provider import get_option_chain
    chain, _ = await get_option_chain(symbol)
    results = scan_unusual(chain)
    return {"symbol": symbol.upper(), "results": results}


@router.get("/wsb-sentiment")
async def wsb_sentiment(count: int = Query(50, ge=1, le=100)):
    results = await get_wsb_sentiment(count)
    return {"results": results}


@router.get("/earnings-calendar")
async def earnings_calendar(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    count: int = Query(50, ge=1, le=100),
):
    results = get_earnings_calendar(start, end, count)
    return {"start": start, "end": end, "results": results}
