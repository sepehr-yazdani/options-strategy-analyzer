import { useEffect, useRef } from "react";
import { useStrategyStore } from "../stores/strategyStore";
import { fetchPayoff } from "../api/strategy";

export function usePayoff() {
  const legs = useStrategyStore((s) => s.legs);
  const currentPrice = useStrategyStore((s) => s.currentPrice);
  const setPayoffData = useStrategyStore((s) => s.setPayoffData);
  const setLoadingPayoff = useStrategyStore((s) => s.setLoadingPayoff);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (legs.length === 0 || currentPrice <= 0) {
      setPayoffData(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoadingPayoff(true);
      try {
        const data = await fetchPayoff(legs, currentPrice);
        setPayoffData(data);
      } catch (err) {
        console.error("Payoff calculation failed:", err);
      } finally {
        setLoadingPayoff(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [legs, currentPrice, setPayoffData, setLoadingPayoff]);
}
