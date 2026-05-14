from __future__ import annotations

from py_vollib.ref_python.black_scholes_merton import black_scholes_merton as bsm
from py_vollib.ref_python.black_scholes_merton.greeks import analytical as bsm_greeks

from app.models.option import Greeks

RISK_FREE_RATE = 0.05
DIVIDEND_YIELD = 0.0


def _flag(option_type: str) -> str:
    return "c" if option_type == "call" else "p"


def compute_greeks(
    option_type: str,
    S: float,
    K: float,
    t_years: float,
    r: float = RISK_FREE_RATE,
    sigma: float = 0.0,
    q: float = DIVIDEND_YIELD,
) -> Greeks:
    if sigma <= 0 or t_years <= 0 or S <= 0 or K <= 0:
        return _intrinsic_greeks(option_type, S, K, t_years)

    f = _flag(option_type)
    try:
        return Greeks(
            delta=round(bsm_greeks.delta(f, S, K, t_years, r, sigma, q), 6),
            gamma=round(bsm_greeks.gamma(f, S, K, t_years, r, sigma, q), 6),
            theta=round(bsm_greeks.theta(f, S, K, t_years, r, sigma, q), 6),
            vega=round(bsm_greeks.vega(f, S, K, t_years, r, sigma, q), 6),
            rho=round(bsm_greeks.rho(f, S, K, t_years, r, sigma, q), 6),
        )
    except Exception:
        return _intrinsic_greeks(option_type, S, K, t_years)


def compute_theoretical_price(
    option_type: str,
    S: float,
    K: float,
    t_years: float,
    r: float = RISK_FREE_RATE,
    sigma: float = 0.0,
    q: float = DIVIDEND_YIELD,
) -> float:
    if sigma <= 0 or t_years <= 0 or S <= 0 or K <= 0:
        if option_type == "call":
            return max(0.0, S - K)
        return max(0.0, K - S)

    try:
        return bsm(_flag(option_type), S, K, t_years, r, sigma, q)
    except Exception:
        if option_type == "call":
            return max(0.0, S - K)
        return max(0.0, K - S)


def compute_greeks_surface(
    option_type: str,
    K: float,
    t_years: float,
    sigma: float,
    spot_range: tuple[float, float],
    r: float = RISK_FREE_RATE,
    q: float = DIVIDEND_YIELD,
    num_points: int = 200,
) -> list[dict]:
    import numpy as np

    points = []
    for S in np.linspace(spot_range[0], spot_range[1], num_points):
        S = float(S)
        g = compute_greeks(option_type, S, K, t_years, r, sigma, q)
        p = compute_theoretical_price(option_type, S, K, t_years, r, sigma, q)
        points.append({
            "underlying_price": round(S, 2),
            "delta": g.delta,
            "gamma": g.gamma,
            "theta": g.theta,
            "vega": g.vega,
            "rho": g.rho,
            "theoretical_price": round(p, 4),
        })
    return points


def compute_greeks_over_time(
    option_type: str,
    S: float,
    K: float,
    sigma: float,
    max_dte: int,
    r: float = RISK_FREE_RATE,
    q: float = DIVIDEND_YIELD,
) -> list[dict]:
    points = []
    for dte in range(max_dte, -1, -1):
        t_years = dte / 365.0
        g = compute_greeks(option_type, S, K, t_years, r, sigma, q)
        p = compute_theoretical_price(option_type, S, K, t_years, r, sigma, q)
        points.append({
            "dte": dte,
            "delta": g.delta,
            "gamma": g.gamma,
            "theta": g.theta,
            "vega": g.vega,
            "theoretical_price": round(p, 4),
        })
    return points


def _intrinsic_greeks(option_type: str, S: float, K: float, t_years: float) -> Greeks:
    if t_years > 0 or S <= 0 or K <= 0:
        return Greeks()
    if option_type == "call":
        itm = S > K
        return Greeks(delta=1.0 if itm else 0.0)
    else:
        itm = S < K
        return Greeks(delta=-1.0 if itm else 0.0)
