from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)

APEWISDOM_URL = "https://apewisdom.io/api/v1.0/filter/all-stocks/page/{page}"


async def get_wsb_sentiment(limit: int = 50) -> list[dict]:
    all_raw = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            pages_needed = (limit + 99) // 100
            for page in range(1, pages_needed + 1):
                resp = await client.get(APEWISDOM_URL.format(page=page))
                resp.raise_for_status()
                data = resp.json()
                all_raw.extend(data.get("results", []))
                if len(all_raw) >= limit:
                    break
    except Exception as e:
        logger.error("ApeWisdom fetch failed: %s", e)
        return []

    results = []
    for r in all_raw[:limit]:
        mentions_ago = r.get("mentions_24h_ago", 0) or 0
        mentions_now = r.get("mentions", 0) or 0
        if mentions_ago > 0:
            momentum = round((mentions_now - mentions_ago) / mentions_ago * 100, 1)
        else:
            momentum = 100.0 if mentions_now > 0 else 0.0

        rank_ago = r.get("rank_24h_ago") or 0

        results.append({
            "rank": r.get("rank", 0),
            "ticker": r.get("ticker", ""),
            "name": r.get("name", ""),
            "mentions": mentions_now,
            "upvotes": r.get("upvotes", 0),
            "rank_24h_ago": rank_ago,
            "mentions_24h_ago": mentions_ago,
            "momentum_pct": momentum,
            "trending_up": r.get("rank", 99) < rank_ago if rank_ago > 0 else False,
        })

    return results
