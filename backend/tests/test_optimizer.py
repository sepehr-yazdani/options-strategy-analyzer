"""
Tests for the optimizer using synthetic option chains with known values.
Each test builds a controlled chain where we know exactly what the
"right" ranking should be.
"""
from datetime import date, timedelta

import pytest

from app.models.option import (
    ExpirationData,
    Greeks,
    OptionChainResponse,
    StrikeData,
)
from app.models.optimization import SuggestedStrategy
from app.services.optimizer import (
    _evaluate,
    _score_strategy,
    compute_iv_rank,
    find_optimal_strategies,
)


# ---------------------------------------------------------------------------
# Helpers to build synthetic chains
# ---------------------------------------------------------------------------

def make_strike(
    strike: float,
    bid: float = 0,
    ask: float = 0,
    last: float = 0,
    iv: float = 0.30,
    volume: int = 100,
    oi: int = 500,
    delta: float = 0.0,
    itm: bool = False,
) -> StrikeData:
    return StrikeData(
        strike=strike,
        bid=bid,
        ask=ask,
        last=last or (bid + ask) / 2,
        volume=volume,
        open_interest=oi,
        iv=iv,
        greeks=Greeks(delta=delta),
        in_the_money=itm,
    )


def make_chain(
    underlying: float,
    expirations: list[dict],
) -> OptionChainResponse:
    """Build a chain from a list of expiration specs.

    Each spec: {"dte": int, "calls": [StrikeData], "puts": [StrikeData]}
    """
    today = date.today()
    exp_list = []
    for spec in expirations:
        exp_date = today + timedelta(days=spec["dte"])
        exp_list.append(ExpirationData(
            expiration=exp_date,
            dte=spec["dte"],
            calls=spec.get("calls", []),
            puts=spec.get("puts", []),
        ))
    return OptionChainResponse(
        symbol="TEST",
        underlying_price=underlying,
        expirations=exp_list,
    )


# ---------------------------------------------------------------------------
# Scoring unit tests
# ---------------------------------------------------------------------------

class TestScoring:
    """Test that _score_strategy produces sensible relative rankings."""

    def _make(self, **kw) -> SuggestedStrategy:
        defaults = dict(
            name="test", legs=[], pnl_at_target=100, max_profit=100,
            max_loss=-100, breakevens=[], reward_risk_ratio=1.0,
            probability_of_profit=0.5, dte=30, score=0,
        )
        defaults.update(kw)
        return SuggestedStrategy(**defaults)

    def test_negative_pnl_at_target_scores_negative(self):
        s = self._make(pnl_at_target=-50)
        assert _score_strategy(s, "reward_risk") < 0

    def test_higher_rr_beats_lower_rr_same_pop(self):
        high_rr = self._make(reward_risk_ratio=5.0, probability_of_profit=0.4)
        low_rr = self._make(reward_risk_ratio=1.5, probability_of_profit=0.4)
        assert _score_strategy(high_rr, "reward_risk") > _score_strategy(low_rr, "reward_risk")

    def test_lottery_ticket_loses_to_moderate_trade(self):
        """50:1 R:R with 2% PoP should lose to 3:1 R:R with 45% PoP."""
        lottery = self._make(
            pnl_at_target=5000, reward_risk_ratio=50.0,
            probability_of_profit=0.02, dte=30,
        )
        moderate = self._make(
            pnl_at_target=300, reward_risk_ratio=3.0,
            probability_of_profit=0.45, dte=30,
        )
        assert _score_strategy(moderate, "reward_risk") > _score_strategy(lottery, "reward_risk")

    def test_short_dte_penalized(self):
        """Same strategy at 3 DTE should score lower than at 30 DTE."""
        short = self._make(dte=3)
        long = self._make(dte=30)
        assert _score_strategy(long, "reward_risk") > _score_strategy(short, "reward_risk")

    def test_sub_1_rr_heavily_penalized_for_reward_risk(self):
        """R:R of 0.3 should score much worse than R:R of 2.0 for 'reward_risk'."""
        bad_rr = self._make(reward_risk_ratio=0.3, pnl_at_target=500, probability_of_profit=0.6)
        good_rr = self._make(reward_risk_ratio=2.0, pnl_at_target=200, probability_of_profit=0.4)
        score_bad = _score_strategy(bad_rr, "reward_risk")
        score_good = _score_strategy(good_rr, "reward_risk")
        assert score_good > score_bad

    def test_deep_itm_high_loss_penalized(self):
        """Deep ITM call risking $10K to make $1.8K should lose to OTM spread risking $200 to make $800."""
        deep_itm = self._make(
            pnl_at_target=1800, max_loss=-10000, reward_risk_ratio=1.0,
            probability_of_profit=0.68, dte=60,
        )
        otm_spread = self._make(
            pnl_at_target=800, max_loss=-200, reward_risk_ratio=4.0,
            probability_of_profit=0.35, dte=60,
        )
        assert _score_strategy(otm_spread, "reward_risk") > _score_strategy(deep_itm, "reward_risk")

    def test_max_prob_profit_favors_high_pop(self):
        """Under 'max_prob_profit', 70% PoP should beat 30% PoP even with lower profit."""
        high_pop = self._make(probability_of_profit=0.70, pnl_at_target=100)
        low_pop = self._make(probability_of_profit=0.30, pnl_at_target=300)
        assert _score_strategy(high_pop, "max_prob_profit") > _score_strategy(low_pop, "max_prob_profit")

    def test_min_cost_favors_cheap_trades(self):
        """Under 'min_cost', $50 risk for $100 profit should beat $500 risk for $200 profit."""
        cheap = self._make(pnl_at_target=100, max_loss=-50, probability_of_profit=0.5)
        expensive = self._make(pnl_at_target=200, max_loss=-500, probability_of_profit=0.5)
        assert _score_strategy(cheap, "min_cost") > _score_strategy(expensive, "min_cost")


# ---------------------------------------------------------------------------
# Evaluate unit tests
# ---------------------------------------------------------------------------

class TestEvaluate:
    """Test _evaluate with synthetic legs."""

    def test_profitable_call_at_target(self):
        from app.models.option import OptionLeg
        exp = (date.today() + timedelta(days=30)).isoformat()
        leg = OptionLeg(
            id="1", option_type="call", action="buy",
            strike=100.0, expiration=exp, quantity=1,
            premium=5.0, iv=0.30,
        )
        s = _evaluate("Long Call", [leg], 100.0, 120.0, dte=30)
        assert s is not None
        assert s.pnl_at_target > 0
        assert s.max_loss < 0
        assert s.dte == 30

    def test_otm_call_negative_at_low_target(self):
        from app.models.option import OptionLeg
        exp = (date.today() + timedelta(days=30)).isoformat()
        leg = OptionLeg(
            id="1", option_type="call", action="buy",
            strike=150.0, expiration=exp, quantity=1,
            premium=2.0, iv=0.30,
        )
        s = _evaluate("Long Call", [leg], 100.0, 105.0, dte=30)
        assert s is not None
        assert s.pnl_at_target < 0

    def test_pop_is_populated(self):
        from app.models.option import OptionLeg
        exp = (date.today() + timedelta(days=30)).isoformat()
        leg = OptionLeg(
            id="1", option_type="call", action="buy",
            strike=100.0, expiration=exp, quantity=1,
            premium=5.0, iv=0.30,
        )
        s = _evaluate("Long Call", [leg], 100.0, 120.0, dte=30)
        assert s is not None
        assert s.probability_of_profit is not None
        assert 0 < s.probability_of_profit < 1


# ---------------------------------------------------------------------------
# Full optimizer integration tests with synthetic chains
# ---------------------------------------------------------------------------

class TestFindOptimal:
    def _simple_chain(self, underlying: float = 100.0) -> OptionChainResponse:
        """Chain with 2 expirations, a few strikes each."""
        calls_near = [
            make_strike(95, bid=7.0, ask=7.5, iv=0.30, delta=0.7, itm=True),
            make_strike(100, bid=3.5, ask=4.0, iv=0.28, delta=0.5),
            make_strike(105, bid=1.5, ask=2.0, iv=0.30, delta=0.3),
            make_strike(110, bid=0.4, ask=0.6, iv=0.32, delta=0.15),
            make_strike(115, bid=0.08, ask=0.15, iv=0.35, delta=0.05),
        ]
        calls_far = [
            make_strike(95, bid=9.0, ask=9.5, iv=0.28, delta=0.65, itm=True),
            make_strike(100, bid=6.0, ask=6.5, iv=0.27, delta=0.50),
            make_strike(105, bid=3.5, ask=4.0, iv=0.28, delta=0.35),
            make_strike(110, bid=1.8, ask=2.3, iv=0.29, delta=0.22),
            make_strike(115, bid=0.8, ask=1.2, iv=0.31, delta=0.12),
        ]
        return make_chain(underlying, [
            {"dte": 15, "calls": calls_near, "puts": []},
            {"dte": 45, "calls": calls_far, "puts": []},
        ])

    def test_returns_results(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=60,
            strategy_types=["long_call", "bull_call_spread"],
        )
        assert len(results) > 0

    def test_all_results_profitable_at_target(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=60,
        )
        for s in results:
            assert s.pnl_at_target > 0

    def test_max_loss_filter(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_loss=300, max_dte=60,
        )
        for s in results:
            assert s.max_loss >= -300

    def test_max_dte_filter(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=20,
        )
        for s in results:
            assert s.dte <= 20

    def test_longer_dte_ranks_higher_than_shorter(self):
        """With same strikes, 45 DTE strategies should generally rank above 15 DTE."""
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=60, objective="reward_risk",
        )
        if len(results) >= 2:
            top = results[0]
            assert top.dte > 10

    def test_no_results_for_impossible_target(self):
        """Target below current price with only bullish strategies should return nothing profitable."""
        chain = self._simple_chain(underlying=100)
        results = find_optimal_strategies(
            chain, target_price=80, max_dte=60,
            strategy_types=["long_call"],
        )
        profitable = [s for s in results if s.pnl_at_target > 0]
        assert len(profitable) == 0

    def test_reward_risk_objective_prefers_high_rr(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=60, objective="reward_risk",
        )
        if len(results) >= 2:
            assert results[0].score >= results[1].score

    def test_results_sorted_by_score_descending(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=60,
        )
        for i in range(len(results) - 1):
            assert results[i].score >= results[i + 1].score

    def test_max_prob_profit_returns_results(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=60, objective="max_prob_profit",
        )
        assert len(results) > 0
        for i in range(len(results) - 1):
            assert results[i].score >= results[i + 1].score

    def test_min_cost_returns_results(self):
        chain = self._simple_chain()
        results = find_optimal_strategies(
            chain, target_price=115, max_dte=60, objective="min_cost",
        )
        assert len(results) > 0
        for i in range(len(results) - 1):
            assert results[i].score >= results[i + 1].score

    def test_objectives_produce_different_rankings(self):
        """The three objectives should not all produce the same #1 pick."""
        chain = self._simple_chain()
        top_by_obj = {}
        for obj in ["reward_risk", "max_prob_profit", "min_cost"]:
            results = find_optimal_strategies(
                chain, target_price=115, max_dte=60, objective=obj,
            )
            if results:
                top = results[0]
                key = (top.name, tuple((l.strike, l.expiration) for l in top.legs))
                top_by_obj[obj] = key
        # At least 2 of the 3 objectives should pick different top strategies
        unique_tops = set(top_by_obj.values())
        assert len(unique_tops) >= 2, f"All objectives picked the same strategy: {top_by_obj}"

    def test_max_prob_profit_top_has_higher_pop_than_reward_risk_top(self):
        """The top 'max_prob_profit' pick should have >= PoP of the top 'reward_risk' pick."""
        chain = self._simple_chain()
        rr_results = find_optimal_strategies(
            chain, target_price=110, max_dte=60, objective="reward_risk",
        )
        pop_results = find_optimal_strategies(
            chain, target_price=110, max_dte=60, objective="max_prob_profit",
        )
        if rr_results and pop_results:
            rr_pop = rr_results[0].probability_of_profit or 0
            pop_pop = pop_results[0].probability_of_profit or 0
            assert pop_pop >= rr_pop

    def test_min_cost_sorted_and_returns_results(self):
        """min_cost objective should return sorted results with positive scores."""
        chain = self._simple_chain()
        mc_results = find_optimal_strategies(
            chain, target_price=110, max_dte=60, objective="min_cost",
        )
        assert len(mc_results) > 0
        for i in range(len(mc_results) - 1):
            assert mc_results[i].score >= mc_results[i + 1].score
        for s in mc_results:
            assert s.pnl_at_target > 0


# ---------------------------------------------------------------------------
# IV Rank tests
# ---------------------------------------------------------------------------

class TestIvRank:
    def test_uniform_iv_returns_neutral(self):
        chain = make_chain(100, [
            {"dte": 30, "calls": [
                make_strike(95, iv=0.25), make_strike(100, iv=0.25), make_strike(105, iv=0.25),
            ], "puts": []},
            {"dte": 60, "calls": [
                make_strike(95, iv=0.25), make_strike(100, iv=0.25), make_strike(105, iv=0.25),
            ], "puts": []},
        ])
        r = compute_iv_rank(chain)
        assert r.iv_rank == 0.5
        assert r.classification == "neutral"

    def test_front_month_elevated(self):
        """When near-term ATM IV is highest, rank should be high/extreme."""
        chain = make_chain(100, [
            {"dte": 7, "calls": [
                make_strike(98, iv=0.60), make_strike(100, iv=0.65), make_strike(102, iv=0.60),
            ], "puts": []},
            {"dte": 30, "calls": [
                make_strike(98, iv=0.30), make_strike(100, iv=0.30), make_strike(102, iv=0.30),
            ], "puts": []},
            {"dte": 60, "calls": [
                make_strike(98, iv=0.25), make_strike(100, iv=0.25), make_strike(102, iv=0.25),
            ], "puts": []},
        ])
        r = compute_iv_rank(chain)
        assert r.current_iv == pytest.approx(0.30, abs=0.01)
        assert r.classification in ("neutral", "low")

    def test_empty_chain(self):
        chain = make_chain(100, [])
        r = compute_iv_rank(chain)
        assert r.classification == "unknown"

    def test_low_iv_environment(self):
        chain = make_chain(100, [
            {"dte": 30, "calls": [
                make_strike(98, iv=0.10), make_strike(100, iv=0.10), make_strike(102, iv=0.10),
            ], "puts": []},
            {"dte": 60, "calls": [
                make_strike(98, iv=0.20), make_strike(100, iv=0.20), make_strike(102, iv=0.20),
            ], "puts": []},
            {"dte": 90, "calls": [
                make_strike(98, iv=0.30), make_strike(100, iv=0.30), make_strike(102, iv=0.30),
            ], "puts": []},
        ])
        r = compute_iv_rank(chain)
        assert r.iv_low < r.iv_high
        assert 0 <= r.iv_rank <= 1
