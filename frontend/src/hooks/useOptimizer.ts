import { useCallback, useEffect } from "react";
import { useStrategyStore } from "../stores/strategyStore";
import { useOptimizerStore } from "../stores/optimizerStore";
import { fetchOptimalStrategies, fetchIvRank } from "../api/optimize";

export function useOptimizer() {
  const symbol = useStrategyStore((s) => s.symbol);
  const setIvRank = useOptimizerStore((s) => s.setIvRank);

  useEffect(() => {
    if (!symbol) {
      setIvRank(null);
      return;
    }
    let cancelled = false;
    fetchIvRank(symbol)
      .then((data) => {
        if (!cancelled) setIvRank(data);
      })
      .catch(() => {
        if (!cancelled) setIvRank(null);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, setIvRank]);

  const targetPrice = useOptimizerStore((s) => s.targetPrice);
  const maxLoss = useOptimizerStore((s) => s.maxLoss);
  const maxDte = useOptimizerStore((s) => s.maxDte);
  const objective = useOptimizerStore((s) => s.objective);
  const setSuggestions = useOptimizerStore((s) => s.setSuggestions);
  const setLoading = useOptimizerStore((s) => s.setLoading);

  const runOptimizer = useCallback(async () => {
    if (!symbol || !targetPrice) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        symbol,
        target_price: parseFloat(targetPrice),
        objective,
      };
      if (maxLoss) params.max_loss = parseFloat(maxLoss);
      if (maxDte) params.max_dte = parseInt(maxDte);

      const results = await fetchOptimalStrategies(
        params as Parameters<typeof fetchOptimalStrategies>[0]
      );
      setSuggestions(results);
    } catch (err) {
      console.error("Optimizer failed:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, targetPrice, maxLoss, maxDte, objective, setSuggestions, setLoading]);

  return { runOptimizer };
}
