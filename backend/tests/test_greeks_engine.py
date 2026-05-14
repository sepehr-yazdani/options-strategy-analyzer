from datetime import date, timedelta
import pytest
from app.services.greeks_engine import (
    compute_greeks,
    compute_theoretical_price,
    compute_greeks_surface,
    compute_greeks_over_time,
)
from app.models.option import Greeks


class TestComputeGreeks:
    """Validate against Hull textbook: S=49, K=50, r=0.05, t=0.3846, sigma=0.2, q=0."""

    S, K, t, r, sigma, q = 49.0, 50.0, 0.3846, 0.05, 0.2, 0.0

    def test_call_delta(self):
        g = compute_greeks("call", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert abs(g.delta - 0.5216) < 0.001

    def test_call_gamma(self):
        g = compute_greeks("call", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert abs(g.gamma - 0.0655) < 0.001

    def test_call_theta(self):
        g = compute_greeks("call", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert abs(g.theta - (-0.0118)) < 0.001

    def test_call_vega(self):
        g = compute_greeks("call", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert abs(g.vega - 0.1211) < 0.001

    def test_call_rho(self):
        g = compute_greeks("call", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert abs(g.rho - 0.0891) < 0.001

    def test_put_delta_negative(self):
        g = compute_greeks("put", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert g.delta < 0

    def test_put_call_delta_parity(self):
        gc = compute_greeks("call", self.S, self.K, self.t, self.r, self.sigma, self.q)
        gp = compute_greeks("put", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert abs((gc.delta - gp.delta) - 1.0) < 0.01

    def test_call_put_same_gamma(self):
        gc = compute_greeks("call", self.S, self.K, self.t, self.r, self.sigma, self.q)
        gp = compute_greeks("put", self.S, self.K, self.t, self.r, self.sigma, self.q)
        assert abs(gc.gamma - gp.gamma) < 0.001


class TestTheoreticalPrice:
    def test_hull_call_price(self):
        p = compute_theoretical_price("call", 49.0, 50.0, 0.3846, 0.05, 0.2, 0.0)
        assert abs(p - 2.4005) < 0.01

    def test_deep_itm_call(self):
        p = compute_theoretical_price("call", 100.0, 50.0, 0.5, 0.05, 0.2)
        assert p > 49.0

    def test_deep_otm_call(self):
        p = compute_theoretical_price("call", 10.0, 100.0, 0.5, 0.05, 0.2)
        assert p < 0.01


class TestEdgeCases:
    def test_at_expiration_itm_call(self):
        g = compute_greeks("call", 55.0, 50.0, 0.0)
        assert g.delta == 1.0
        assert g.gamma == 0.0
        assert g.theta == 0.0

    def test_at_expiration_otm_call(self):
        g = compute_greeks("call", 45.0, 50.0, 0.0)
        assert g.delta == 0.0

    def test_at_expiration_itm_put(self):
        g = compute_greeks("put", 45.0, 50.0, 0.0)
        assert g.delta == -1.0

    def test_at_expiration_otm_put(self):
        g = compute_greeks("put", 55.0, 50.0, 0.0)
        assert g.delta == 0.0

    def test_zero_sigma_returns_zeros(self):
        g = compute_greeks("call", 49.0, 50.0, 0.5, sigma=0.0)
        assert g == Greeks()

    def test_zero_spot_returns_zeros(self):
        g = compute_greeks("call", 0.0, 50.0, 0.5, sigma=0.2)
        assert g == Greeks()

    def test_price_at_expiration_call_itm(self):
        p = compute_theoretical_price("call", 55.0, 50.0, 0.0, sigma=0.3)
        assert abs(p - 5.0) < 0.01

    def test_price_at_expiration_call_otm(self):
        p = compute_theoretical_price("call", 45.0, 50.0, 0.0, sigma=0.3)
        assert abs(p) < 0.01


class TestSurface:
    def test_returns_correct_count(self):
        pts = compute_greeks_surface("call", 50.0, 0.5, 0.2, (40.0, 60.0), num_points=50)
        assert len(pts) == 50

    def test_delta_monotonic_for_call(self):
        pts = compute_greeks_surface("call", 50.0, 0.5, 0.2, (30.0, 70.0), num_points=100)
        deltas = [p["delta"] for p in pts]
        for i in range(1, len(deltas)):
            assert deltas[i] >= deltas[i - 1] - 1e-9


class TestOverTime:
    def test_returns_decreasing_dte(self):
        pts = compute_greeks_over_time("call", 50.0, 50.0, 0.2, 30)
        dtes = [p["dte"] for p in pts]
        assert dtes == list(range(30, -1, -1))

    def test_price_decreases_for_atm_call(self):
        pts = compute_greeks_over_time("call", 50.0, 50.0, 0.2, 30)
        prices = [p["theoretical_price"] for p in pts]
        assert prices[0] > prices[-1]
