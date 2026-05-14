import { useEffect, useState } from "react";
import { useStrategyStore } from "../stores/strategyStore";
import { fetchEarnings } from "../api/earnings";
import type { EarningsResponse } from "../types/earnings";

export function useEarnings() {
  const symbol = useStrategyStore((s) => s.symbol);
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);

  useEffect(() => {
    if (!symbol) {
      setEarnings(null);
      return;
    }
    let cancelled = false;
    fetchEarnings(symbol)
      .then((data) => {
        if (!cancelled) setEarnings(data);
      })
      .catch(() => {
        if (!cancelled) setEarnings(null);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return earnings;
}
