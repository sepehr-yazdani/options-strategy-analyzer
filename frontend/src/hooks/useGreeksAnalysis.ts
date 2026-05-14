import { useCallback, useEffect, useRef } from "react";
import { useStrategyStore } from "../stores/strategyStore";
import { useGreeksStore } from "../stores/greeksStore";
import {
  fetchGreeksSurface,
  fetchTimeDecay,
  fetchIvImpact,
} from "../api/greeks";
import type { OptionLeg } from "../types/option";

function findAnalysisLeg(legs: OptionLeg[]): OptionLeg | null {
  return (
    legs.find(
      (l) =>
        l.optionType !== "stock" &&
        l.strike != null &&
        l.expiration != null &&
        l.iv != null &&
        l.iv > 0
    ) ?? null
  );
}

function computeDte(expiration: string): number {
  const exp = new Date(expiration + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((exp.getTime() - now.getTime()) / 86400000));
}

export function useGreeksAnalysis() {
  const legs = useStrategyStore((s) => s.legs);
  const currentPrice = useStrategyStore((s) => s.currentPrice);
  const setSurfaceData = useGreeksStore((s) => s.setSurfaceData);
  const setTimeDecayData = useGreeksStore((s) => s.setTimeDecayData);
  const setIvImpactData = useGreeksStore((s) => s.setIvImpactData);
  const setLoading = useGreeksStore((s) => s.setLoading);
  const clear = useGreeksStore((s) => s.clear);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchAll = useCallback(
    async (leg: OptionLeg, price: number) => {
      const dte = computeDte(leg.expiration!);
      if (dte <= 0 || !leg.iv || leg.iv <= 0) return;

      setLoading(true);
      try {
        const [surface, decay, impact] = await Promise.all([
          fetchGreeksSurface({
            option_type: leg.optionType,
            strike: leg.strike!,
            expiration: leg.expiration!,
            iv: leg.iv,
            underlying_price: price,
          }),
          fetchTimeDecay({
            option_type: leg.optionType,
            strike: leg.strike!,
            dte,
            iv: leg.iv,
            underlying_price: price,
          }),
          fetchIvImpact({
            option_type: leg.optionType,
            strike: leg.strike!,
            dte,
            underlying_price: price,
          }),
        ]);
        setSurfaceData(surface);
        setTimeDecayData(decay);
        setIvImpactData(impact);
      } catch (err) {
        console.error("Greeks analysis failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [setSurfaceData, setTimeDecayData, setIvImpactData, setLoading]
  );

  useEffect(() => {
    clearTimeout(timerRef.current);

    const leg = findAnalysisLeg(legs);
    if (!leg || currentPrice <= 0) {
      clear();
      return;
    }

    timerRef.current = setTimeout(() => {
      fetchAll(leg, currentPrice);
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [legs, currentPrice, fetchAll, clear]);
}
