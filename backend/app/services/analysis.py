from __future__ import annotations

from datetime import date

from app.models.analysis import ContractPoint
from app.models.option import ExpirationData, OptionChainResponse, StrikeData
from app.services.greeks_engine import (
    DIVIDEND_YIELD,
    RISK_FREE_RATE,
    compute_greeks,
    compute_theoretical_price,
)


def _get_metric(
    strike_data: StrikeData,
    option_type: str,
    underlying_price: float,
    dte: int,
    metric: str,
    target_price: float | None,
) -> float | None:
    if metric == "iv":
        return strike_data.iv if strike_data.iv > 0 else None
    if metric == "price":
        return strike_data.last if strike_data.last > 0 else None
    if metric == "volume":
        return float(strike_data.volume)
    if metric == "openInterest":
        return float(strike_data.open_interest)

    if strike_data.greeks and strike_data.greeks.delta != 0:
        g = strike_data.greeks
    else:
        sigma = strike_data.iv if strike_data.iv > 0 else None
        if not sigma or dte <= 0:
            return None
        g = compute_greeks(
            option_type, underlying_price, strike_data.strike,
            dte / 365.0, RISK_FREE_RATE, sigma, DIVIDEND_YIELD,
        )

    return getattr(g, metric, None)


def build_strike_expiry_grid(
    chain: OptionChainResponse,
    option_type: str = "call",
    metric: str = "iv",
    target_price: float | None = None,
) -> dict:
    today = date.today()

    all_strikes: set[float] = set()
    for exp in chain.expirations:
        side = exp.calls if option_type == "call" else exp.puts
        for s in side:
            all_strikes.add(s.strike)

    strikes = sorted(all_strikes)
    expirations: list[str] = []
    dtes: list[int] = []
    grid: list[list[float | None]] = []

    for exp in sorted(chain.expirations, key=lambda e: e.expiration):
        side = exp.calls if option_type == "call" else exp.puts
        strike_map = {s.strike: s for s in side}
        dte = (exp.expiration - today).days
        if dte <= 0:
            continue

        row: list[float | None] = []
        for strike in strikes:
            sd = strike_map.get(strike)
            if sd:
                row.append(_get_metric(
                    sd, option_type, chain.underlying_price, dte, metric, target_price,
                ))
            else:
                row.append(None)

        expirations.append(exp.expiration.isoformat())
        dtes.append(dte)
        grid.append(row)

    return {
        "strikes": strikes,
        "expirations": expirations,
        "dtes": dtes,
        "grid": grid,
        "metric": metric,
        "underlying_price": chain.underlying_price,
    }


def build_contract_scatter(
    chain: OptionChainResponse,
    option_type: str = "call",
) -> list[ContractPoint]:
    today = date.today()
    contracts: list[ContractPoint] = []

    for exp in chain.expirations:
        dte = (exp.expiration - today).days
        if dte <= 0:
            continue

        side = exp.calls if option_type == "call" else exp.puts
        for sd in side:
            if sd.iv <= 0 and sd.last <= 0:
                continue

            g = sd.greeks
            if (not g or g.delta == 0) and sd.iv > 0:
                g = compute_greeks(
                    option_type, chain.underlying_price, sd.strike,
                    dte / 365.0, RISK_FREE_RATE, sd.iv, DIVIDEND_YIELD,
                )

            contracts.append(ContractPoint(
                strike=sd.strike,
                expiration=exp.expiration.isoformat(),
                dte=dte,
                bid=sd.bid,
                ask=sd.ask,
                last=sd.last,
                volume=sd.volume,
                open_interest=sd.open_interest,
                iv=sd.iv,
                delta=g.delta if g else 0,
                gamma=g.gamma if g else 0,
                theta=g.theta if g else 0,
                vega=g.vega if g else 0,
                in_the_money=sd.in_the_money,
            ))

    return contracts
