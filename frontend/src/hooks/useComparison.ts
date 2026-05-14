import { useCallback } from "react";
import { useStrategyStore } from "../stores/strategyStore";
import { useComparisonStore } from "../stores/comparisonStore";
import { fetchStrikeExpiryGrid, fetchContractScatter } from "../api/analysis";

export function useComparison() {
  const symbol = useStrategyStore((s) => s.symbol);
  const optionType = useComparisonStore((s) => s.optionType);
  const metric = useComparisonStore((s) => s.metric);
  const setGridData = useComparisonStore((s) => s.setGridData);
  const setScatterData = useComparisonStore((s) => s.setScatterData);
  const setLoading = useComparisonStore((s) => s.setLoading);

  const loadGrid = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const [grid, scatter] = await Promise.all([
        fetchStrikeExpiryGrid({ symbol, option_type: optionType, metric }),
        fetchContractScatter({ symbol, option_type: optionType }),
      ]);
      setGridData(grid);
      setScatterData(scatter);
    } catch (err) {
      console.error("Comparison fetch failed:", err);
      setGridData(null);
      setScatterData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, optionType, metric, setGridData, setScatterData, setLoading]);

  return { loadGrid };
}
