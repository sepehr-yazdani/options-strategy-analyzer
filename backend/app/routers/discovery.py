from fastapi import APIRouter, Query

from app.services.discovery import SCREEN_IDS, get_market_movers
from app.services.earnings_calendar import get_earnings_calendar
from app.services.sentiment import get_wsb_sentiment

router = APIRouter(prefix="/discovery", tags=["discovery"])


@router.get("/movers")
async def movers(
    screen: str = Query("most_actives", enum=SCREEN_IDS),
    count: int = Query(25, ge=1, le=50),
):
    return get_market_movers(screen, count)


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
