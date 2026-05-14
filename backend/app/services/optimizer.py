from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.models.option import OptionChainResponse, OptionLeg, StrikeData
from app.models.optimization import IvRankData, SuggestedStrategy
from app.services.payoff import compute_payoff


def _make_leg(
    option_type: str,
    action: str,
    strike_data: StrikeData,
    expiration: str,
    quantity: int = 1,
) -> OptionLeg:
    premium = strike_data.ask if action == "buy" else strike_data.bid
    return OptionLeg(
        id=str(uuid4()),
        option_type=option_type,
        action=action,
        strike=strike_data.strike,
        expiration=expiration,
        quantity=quantity,
        premium=premium,
        iv=strike_data.iv,
    )


def _score_strategy(
    strat: SuggestedStrategy,
    objective: str,
) -> float:
    import math

    if strat.pnl_at_target <= 0:
        return -1.0

    rr = strat.reward_risk_ratio or 0.0
    pop = strat.probability_of_profit or 0.0
    profit = strat.pnl_at_target

    dte_factor = math.sqrt(max(strat.dte, 1) / 30.0)

    # Square PoP so low-probability trades are heavily penalized:
    # 2% PoP → 0.0004 weight, 45% → 0.2025, 70% → 0.49
    ev = profit * max(pop, 0.01) * max(pop, 0.01)

    if objective == "reward_risk":
        max_loss_abs = abs(strat.max_loss or 0)
        ror = profit / max(max_loss_abs, 1.0)

        if rr < 0.5:
            return ev * rr * dte_factor
        # Double rr_factor weight so high R:R strategies rank above
        # deep ITM calls with high PoP but poor R:R
        rr_factor = math.log2(min(rr, 20.0) + 1)
        ror_factor = min(ror, 5.0)
        return ev * rr_factor * rr_factor * ror_factor * dte_factor
    if objective == "max_prob_profit":
        return pop * pop * profit * dte_factor
    if objective == "min_cost":
        cost = abs(strat.max_loss or 0)
        return ev / max(cost, 1.0) * dte_factor
    return ev * min(rr, 20.0) * dte_factor


def _evaluate(
    name: str,
    legs: list[OptionLeg],
    underlying_price: float,
    target_price: float,
    dte: int = 0,
) -> SuggestedStrategy | None:
    if not legs:
        return None

    result = compute_payoff(legs, underlying_price, time_horizons=[0])
    if not result.curves:
        return None

    curve = result.curves[0]
    pnls = [p.pnl for p in curve.points]
    max_profit = max(pnls)
    max_loss = min(pnls)

    target_pnl = 0.0
    closest_dist = float("inf")
    for p in curve.points:
        dist = abs(p.underlying_price - target_price)
        if dist < closest_dist:
            closest_dist = dist
            target_pnl = p.pnl

    # For single long options, max loss = premium paid (not chart-derived).
    # The chart's finite range artificially caps max_profit, making R:R = 1.0.
    total_premium = sum(
        leg.premium * leg.quantity * 100
        for leg in legs
        if leg.option_type != "stock"
    )
    is_single_long = (
        len(legs) == 1
        and legs[0].action == "buy"
        and legs[0].option_type != "stock"
    )
    if is_single_long:
        max_loss = -total_premium

    if max_loss >= 0:
        rr = None
    else:
        rr = round(target_pnl / abs(max_loss), 3) if target_pnl > 0 else round(max_profit / abs(max_loss), 3)

    # Compute PoP using delta from the greeks engine
    pop = None
    from app.services.greeks_engine import compute_greeks, RISK_FREE_RATE, DIVIDEND_YIELD
    if dte > 0 and result.breakevens:
        be = result.breakevens[0]
        t_years = dte / 365.0
        avg_iv = 0.0
        iv_count = 0
        for leg in legs:
            if leg.iv and leg.iv > 0:
                avg_iv += leg.iv
                iv_count += 1
        if iv_count > 0:
            avg_iv /= iv_count
            g = compute_greeks("call", underlying_price, be, t_years, RISK_FREE_RATE, avg_iv, DIVIDEND_YIELD)
            pop = round(g.delta, 3)

    return SuggestedStrategy(
        name=name,
        legs=legs,
        pnl_at_target=round(target_pnl, 2),
        max_profit=round(max_profit, 2),
        max_loss=round(max_loss, 2),
        breakevens=result.breakevens,
        reward_risk_ratio=rr,
        probability_of_profit=pop,
        dte=dte,
    )


def _generate_long_calls(
    calls: list[StrikeData],
    expiration: str,
    underlying_price: float,
    target_price: float,
    dte: int = 0,
) -> list[SuggestedStrategy]:
    results = []
    for sd in calls:
        if sd.ask < 0.05 or sd.iv <= 0:
            continue
        leg = _make_leg("call", "buy", sd, expiration)
        s = _evaluate("Long Call", [leg], underlying_price, target_price, dte)
        if s:
            results.append(s)
    return results


def _generate_long_puts(
    puts: list[StrikeData],
    expiration: str,
    underlying_price: float,
    target_price: float,
    dte: int = 0,
) -> list[SuggestedStrategy]:
    results = []
    for sd in puts:
        if sd.ask < 0.05 or sd.iv <= 0:
            continue
        leg = _make_leg("put", "buy", sd, expiration)
        s = _evaluate("Long Put", [leg], underlying_price, target_price, dte)
        if s:
            results.append(s)
    return results


def _generate_bull_call_spreads(
    calls: list[StrikeData],
    expiration: str,
    underlying_price: float,
    target_price: float,
    dte: int = 0,
) -> list[SuggestedStrategy]:
    results = []
    for i, lower in enumerate(calls):
        if lower.ask <= 0:
            continue
        for upper in calls[i + 1:]:
            if upper.bid <= 0:
                continue
            if upper.strike - lower.strike > underlying_price * 0.15:
                break
            legs = [
                _make_leg("call", "buy", lower, expiration),
                _make_leg("call", "sell", upper, expiration),
            ]
            s = _evaluate("Bull Call Spread", legs, underlying_price, target_price, dte)
            if s:
                results.append(s)
    return results


def _generate_bear_put_spreads(
    puts: list[StrikeData],
    expiration: str,
    underlying_price: float,
    target_price: float,
    dte: int = 0,
) -> list[SuggestedStrategy]:
    results = []
    sorted_puts = sorted(puts, key=lambda p: p.strike, reverse=True)
    for i, upper in enumerate(sorted_puts):
        if upper.ask <= 0:
            continue
        for lower in sorted_puts[i + 1:]:
            if lower.bid <= 0:
                continue
            if upper.strike - lower.strike > underlying_price * 0.15:
                break
            legs = [
                _make_leg("put", "buy", upper, expiration),
                _make_leg("put", "sell", lower, expiration),
            ]
            s = _evaluate("Bear Put Spread", legs, underlying_price, target_price, dte)
            if s:
                results.append(s)
    return results


GENERATORS = {
    "long_call": _generate_long_calls,
    "long_put": _generate_long_puts,
    "bull_call_spread": _generate_bull_call_spreads,
    "bear_put_spread": _generate_bear_put_spreads,
}


def find_optimal_strategies(
    chain: OptionChainResponse,
    target_price: float,
    max_loss: float | None = None,
    max_dte: int | None = None,
    strategy_types: list[str] | None = None,
    objective: str = "reward_risk",
    top_n: int = 10,
) -> list[SuggestedStrategy]:
    today = date.today()
    bullish = target_price >= chain.underlying_price

    if strategy_types is None:
        if bullish:
            strategy_types = ["long_call", "bull_call_spread"]
        else:
            strategy_types = ["long_put", "bear_put_spread"]

    all_candidates: list[SuggestedStrategy] = []

    for exp in chain.expirations:
        dte = (exp.expiration - today).days
        if dte <= 0:
            continue
        if max_dte and dte > max_dte:
            continue

        exp_str = exp.expiration.isoformat()

        for stype in strategy_types:
            gen = GENERATORS.get(stype)
            if not gen:
                continue

            data = exp.calls if "call" in stype else exp.puts
            candidates = gen(data, exp_str, chain.underlying_price, target_price, dte)
            all_candidates.extend(candidates)

    if max_loss is not None:
        all_candidates = [
            s for s in all_candidates
            if s.max_loss is not None and s.max_loss >= -abs(max_loss)
        ]

    for s in all_candidates:
        s.score = _score_strategy(s, objective)

    all_candidates.sort(key=lambda s: s.score, reverse=True)
    return all_candidates[:top_n]


def compute_iv_rank(chain: OptionChainResponse) -> IvRankData:
    atm_threshold = 0.05
    per_exp_atm: list[float] = []

    for exp in chain.expirations:
        exp_atm: list[float] = []
        for sd in exp.calls + exp.puts:
            if sd.iv > 0 and abs(sd.strike - chain.underlying_price) / chain.underlying_price < atm_threshold:
                exp_atm.append(sd.iv)
        if exp_atm:
            per_exp_atm.append(sum(exp_atm) / len(exp_atm))

    if not per_exp_atm:
        return IvRankData(
            symbol="", current_iv=0, iv_high=0, iv_low=0,
            iv_rank=0, iv_percentile=0, classification="unknown",
        )

    sorted_ivs = sorted(per_exp_atm)
    current = sorted_ivs[len(sorted_ivs) // 2]
    iv_high = sorted_ivs[-1]
    iv_low = sorted_ivs[0]

    if iv_high == iv_low:
        rank = 0.5
    else:
        rank = (current - iv_low) / (iv_high - iv_low)

    below = sum(1 for iv in per_exp_atm if iv <= current)
    percentile = below / len(per_exp_atm)

    if rank < 0.25:
        classification = "low"
    elif rank <= 0.50:
        classification = "neutral"
    elif rank <= 0.75:
        classification = "high"
    else:
        classification = "extreme"

    return IvRankData(
        symbol="",
        current_iv=round(current, 4),
        iv_high=round(iv_high, 4),
        iv_low=round(iv_low, 4),
        iv_rank=round(rank, 4),
        iv_percentile=round(percentile, 4),
        classification=classification,
    )
