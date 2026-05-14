import { useCallback } from "react";
import { useStrategyStore } from "../stores/strategyStore";
import { fetchChain } from "../api/chain";

export function useOptionsChain() {
  const setChain = useStrategyStore((s) => s.setChain);
  const setCurrentPrice = useStrategyStore((s) => s.setCurrentPrice);
  const setSymbol = useStrategyStore((s) => s.setSymbol);
  const setLoadingChain = useStrategyStore((s) => s.setLoadingChain);
  const setDataSource = useStrategyStore((s) => s.setDataSource);

  const loadChain = useCallback(
    async (symbol: string) => {
      setLoadingChain(true);
      setSymbol(symbol.toUpperCase());
      try {
        const result = await fetchChain(symbol);
        setChain(result);
        setCurrentPrice(result.underlyingPrice);
        setDataSource(result.source);
      } catch (err) {
        console.error("Failed to load chain:", err);
        setChain(null);
      } finally {
        setLoadingChain(false);
      }
    },
    [setChain, setCurrentPrice, setSymbol, setLoadingChain, setDataSource]
  );

  return { loadChain };
}
