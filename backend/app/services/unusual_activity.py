from __future__ import annotations

import logging
from datetime import date

from app.models.option import OptionChainResponse

logger = logging.getLogger(__name__)

MIN_VOLUME = 100
MIN_VOL_OI_RATIO = 3.0


def scan_unusual(chain: OptionChainResponse, min_volume: int = MIN_VOLUME, min_ratio: float = MIN_VOL_OI_RATIO) -> list[dict]:
    today = date.today()
    results = []

    for exp in chain.expirations:
        dte = (exp.expiration - today).days
        if dte <= 0:
            continue

        for side_name, side in [("call", exp.calls), ("put", exp.puts)]:
            for sd in side:
                if sd.volume < min_volume or sd.open_interest <= 0:
                    continue

                ratio = sd.volume / sd.open_interest
                if ratio < min_ratio:
                    continue

                results.append({
                    "symbol": chain.symbol,
                    "strike": sd.strike,
                    "expiration": exp.expiration.isoformat(),
                    "dte": dte,
                    "option_type": side_name,
                    "volume": sd.volume,
                    "open_interest": sd.open_interest,
                    "vol_oi_ratio": round(ratio, 1),
                    "iv": round(sd.iv, 4),
                    "bid": sd.bid,
                    "ask": sd.ask,
                    "underlying_price": chain.underlying_price,
                })

    results.sort(key=lambda x: -x["volume"])
    return results


async def _fetch_and_scan(sym: str, min_volume: int, min_ratio: float) -> list[dict]:
    from app.services.data_provider import get_option_chain_fast
    try:
        chain, _ = await get_option_chain_fast(sym)
        return scan_unusual(chain, min_volume, min_ratio)[:10]
    except Exception as e:
        logger.info("Scan failed for %s: %s", sym, e)
        return []


async def scan_multiple(symbols: list[str], min_volume: int = MIN_VOLUME, min_ratio: float = MIN_VOL_OI_RATIO) -> list[dict]:
    import asyncio

    all_unusual: list[dict] = []
    # Batch in groups of 5 to avoid rate limits
    for i in range(0, min(len(symbols), 15), 5):
        batch = symbols[i:i + 5]
        tasks = [_fetch_and_scan(sym, min_volume, min_ratio) for sym in batch]
        results = await asyncio.gather(*tasks)
        for sublist in results:
            all_unusual.extend(sublist)

    all_unusual.sort(key=lambda x: -x["volume"])
    return all_unusual


async def scan_top_movers(min_volume: int = MIN_VOLUME, min_ratio: float = MIN_VOL_OI_RATIO) -> list[dict]:
    import asyncio
    from app.services.discovery import get_market_movers

    loop = asyncio.get_event_loop()
    movers = await loop.run_in_executor(None, get_market_movers, "most_actives", 15)
    symbols = [r["symbol"] for r in movers.get("results", [])]
    if not symbols:
        return []
    return await scan_multiple(symbols, min_volume, min_ratio)
