from __future__ import annotations

from datetime import date

import numpy as np

from app.models.option import (
    Greeks,
    OptionLeg,
    PayoffCurve,
    PayoffPoint,
    PayoffResponse,
)
from app.services.greeks_engine import (
    DIVIDEND_YIELD,
    RISK_FREE_RATE,
    compute_greeks,
    compute_theoretical_price,
)


def _leg_pnl_at_expiry(leg: OptionLeg, price: float) -> float:
    sign = 1 if leg.action == "buy" else -1
    multiplier = leg.quantity * 100

    if leg.option_type == "stock":
        return sign * leg.quantity * (price - leg.premium)

    if leg.option_type == "call":
        intrinsic = max(0.0, price - leg.strike)
    else:
        intrinsic = max(0.0, leg.strike - price)

    return sign * multiplier * (intrinsic - leg.premium)


def _leg_pnl_at_dte(leg: OptionLeg, price: float, dte: int) -> float:
    if dte <= 0 or leg.option_type == "stock":
        return _leg_pnl_at_expiry(leg, price)

    sign = 1 if leg.action == "buy" else -1
    multiplier = leg.quantity * 100
    sigma = leg.iv if leg.iv and leg.iv > 0 else 0.0

    if sigma <= 0:
        return _leg_pnl_at_expiry(leg, price)

    t_years = dte / 365.0
    theo = compute_theoretical_price(
        leg.option_type, price, leg.strike, t_years, RISK_FREE_RATE, sigma, DIVIDEND_YIELD
    )
    return sign * multiplier * (theo - leg.premium)


def compute_payoff_at_expiry(
    legs: list[OptionLeg],
    price_range: tuple[float, float],
    num_points: int = 300,
) -> PayoffCurve:
    prices = np.linspace(price_range[0], price_range[1], num_points)
    points = []

    for p in prices:
        total_pnl = sum(_leg_pnl_at_expiry(leg, p) for leg in legs)
        points.append(PayoffPoint(underlying_price=round(float(p), 2), pnl=round(total_pnl, 2)))

    return PayoffCurve(label="At Expiration", days_to_expiry=0, points=points)


def _compute_payoff_at_dte(
    legs: list[OptionLeg],
    price_range: tuple[float, float],
    dte: int,
    num_points: int = 300,
) -> PayoffCurve:
    prices = np.linspace(price_range[0], price_range[1], num_points)
    points = []

    for p in prices:
        total_pnl = sum(_leg_pnl_at_dte(leg, float(p), dte) for leg in legs)
        points.append(PayoffPoint(underlying_price=round(float(p), 2), pnl=round(total_pnl, 2)))

    return PayoffCurve(label=f"T+{dte}d", days_to_expiry=dte, points=points)


def find_breakevens(curve: PayoffCurve) -> list[float]:
    breakevens = []
    points = curve.points
    for i in range(len(points) - 1):
        if points[i].pnl * points[i + 1].pnl < 0:
            p1, pnl1 = points[i].underlying_price, points[i].pnl
            p2, pnl2 = points[i + 1].underlying_price, points[i + 1].pnl
            breakeven = p1 - pnl1 * (p2 - p1) / (pnl2 - pnl1)
            breakevens.append(round(breakeven, 2))
    return breakevens


def _compute_leg_greeks(leg: OptionLeg, underlying_price: float) -> Greeks:
    if leg.option_type == "stock":
        return Greeks(delta=1.0)

    sigma = leg.iv if leg.iv and leg.iv > 0 else 0.0
    if sigma <= 0 or leg.strike is None or leg.expiration is None:
        return Greeks()

    dte = (leg.expiration - date.today()).days
    if dte <= 0:
        return Greeks()

    t_years = dte / 365.0
    return compute_greeks(
        leg.option_type, underlying_price, leg.strike, t_years,
        RISK_FREE_RATE, sigma, DIVIDEND_YIELD,
    )


def compute_aggregate_greeks(legs: list[OptionLeg], per_leg_greeks: list[Greeks]) -> Greeks:
    agg = Greeks()
    for leg, g in zip(legs, per_leg_greeks):
        sign = 1 if leg.action == "buy" else -1
        mult = leg.quantity * (100 if leg.option_type != "stock" else 1)
        agg.delta += sign * mult * g.delta
        agg.gamma += sign * mult * g.gamma
        agg.theta += sign * mult * g.theta
        agg.vega += sign * mult * g.vega
        agg.rho += sign * mult * g.rho
    return Greeks(
        delta=round(agg.delta, 4),
        gamma=round(agg.gamma, 4),
        theta=round(agg.theta, 4),
        vega=round(agg.vega, 4),
        rho=round(agg.rho, 4),
    )


def _default_time_horizons(legs: list[OptionLeg]) -> list[int]:
    """Auto-generate useful time horizons based on leg expirations."""
    dtes = []
    today = date.today()
    for leg in legs:
        if leg.expiration:
            dte = (leg.expiration - today).days
            if dte > 0:
                dtes.append(dte)
    if not dtes:
        return [0]
    max_dte = max(dtes)
    horizons = [0]
    for frac in [0.75, 0.5, 0.25]:
        d = int(max_dte * frac)
        if d > 0:
            horizons.append(d)
    return sorted(set(horizons))


def compute_payoff(
    legs: list[OptionLeg],
    underlying_price: float,
    price_range: tuple[float, float] | None = None,
    time_horizons: list[int] | None = None,
) -> PayoffResponse:
    if not legs:
        return PayoffResponse(curves=[], breakevens=[])

    if price_range is None:
        strikes = [leg.strike for leg in legs if leg.strike is not None]
        premiums = [leg.premium for leg in legs if leg.premium > 0]
        max_premium = max(premiums) if premiums else 0

        if strikes:
            center = (min(strikes) + max(strikes)) / 2
            strike_spread = max(strikes) - min(strikes)
            half_range = max(
                strike_spread * 1.5,
                underlying_price * 0.15,
                max_premium * 2,
            )
            low = center - half_range
            high = center + half_range
        else:
            low = underlying_price * 0.85
            high = underlying_price * 1.15
        low = max(0, low)
        price_range = (low, high)

    if time_horizons is None:
        time_horizons = _default_time_horizons(legs)

    curves: list[PayoffCurve] = []

    at_expiry = compute_payoff_at_expiry(legs, price_range)
    curves.append(at_expiry)

    for dte in sorted(time_horizons, reverse=True):
        if dte > 0:
            curves.append(_compute_payoff_at_dte(legs, price_range, dte))

    breakevens = find_breakevens(at_expiry)

    pnls = [p.pnl for p in at_expiry.points]
    max_profit = max(pnls)
    max_loss = min(pnls)

    per_leg_greeks = [_compute_leg_greeks(leg, underlying_price) for leg in legs]
    aggregate = compute_aggregate_greeks(legs, per_leg_greeks)

    return PayoffResponse(
        curves=curves,
        breakevens=breakevens,
        max_profit=max_profit,
        max_loss=max_loss,
        aggregate_greeks=aggregate,
    )
