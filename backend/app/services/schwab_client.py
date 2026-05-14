from __future__ import annotations

from datetime import date, datetime, timedelta

import httpx

from app.models.option import (
    ExpirationData,
    Greeks,
    OptionChainResponse,
    QuoteResponse,
    StrikeData,
)
from app.services.schwab_auth import get_valid_token

MARKET_BASE = "https://api.schwabapi.com/marketdata/v1"


class SchwabProvider:
    async def _get(self, path: str, params: dict | None = None) -> dict:
        token = await get_valid_token()
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{MARKET_BASE}{path}",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            return resp.json()

    async def get_option_chain(
        self,
        symbol: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> OptionChainResponse:
        if not from_date:
            from_date = date.today().isoformat()
        if not to_date:
            to_date = (date.today() + timedelta(days=90)).isoformat()

        params: dict = {
            "symbol": symbol.upper(),
            "contractType": "ALL",
            "includeUnderlyingQuote": "TRUE",
            "fromDate": from_date,
            "toDate": to_date,
        }

        data = await self._get("/chains", params)

        underlying_price = float(
            data.get("underlyingPrice", 0)
            or data.get("underlying", {}).get("last", 0)
        )
        today = date.today()

        exp_map: dict[str, ExpirationData] = {}

        for side, option_type in [("callExpDateMap", "call"), ("putExpDateMap", "put")]:
            for exp_key, strikes_map in data.get(side, {}).items():
                exp_str = exp_key.split(":")[0]
                exp_date = datetime.strptime(exp_str, "%Y-%m-%d").date()

                if exp_str not in exp_map:
                    exp_map[exp_str] = ExpirationData(
                        expiration=exp_date,
                        dte=(exp_date - today).days,
                    )

                strike_list: list[StrikeData] = []
                for _strike_str, contracts in strikes_map.items():
                    c = contracts[0] if contracts else {}
                    strike = float(c.get("strikePrice", 0))
                    strike_list.append(
                        StrikeData(
                            strike=strike,
                            bid=float(c.get("bid", 0)),
                            ask=float(c.get("ask", 0)),
                            last=float(c.get("last", 0)),
                            volume=int(c.get("totalVolume", 0)),
                            open_interest=int(c.get("openInterest", 0)),
                            iv=round(float(c.get("volatility", 0)) / 100, 4),
                            greeks=Greeks(
                                delta=float(c.get("delta", 0)),
                                gamma=float(c.get("gamma", 0)),
                                theta=float(c.get("theta", 0)),
                                vega=float(c.get("vega", 0)),
                                rho=float(c.get("rho", 0)),
                            ),
                            in_the_money=bool(c.get("inTheMoney", False)),
                        )
                    )

                if option_type == "call":
                    exp_map[exp_str].calls = strike_list
                else:
                    exp_map[exp_str].puts = strike_list

        return OptionChainResponse(
            symbol=symbol.upper(),
            underlying_price=underlying_price,
            expirations=sorted(exp_map.values(), key=lambda e: e.expiration),
        )

    async def get_quote(self, symbol: str) -> QuoteResponse:
        data = await self._get(f"/{symbol.upper()}/quotes")
        q = data.get(symbol.upper(), {}).get("quote", data.get(symbol.upper(), {}))
        return QuoteResponse(
            symbol=symbol.upper(),
            last=float(q.get("lastPrice", q.get("last", 0))),
            bid=float(q.get("bidPrice", q.get("bid", 0))),
            ask=float(q.get("askPrice", q.get("ask", 0))),
            volume=int(q.get("totalVolume", q.get("volume", 0))),
        )
