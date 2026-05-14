import type { SuggestedStrategy, IvRankData } from "../types/optimization";
import { apiFetch } from "./client";

export function fetchOptimalStrategies(params: {
  symbol: string;
  target_price: number;
  max_loss?: number;
  max_dte?: number;
  strategy_types?: string[];
  objective?: string;
}): Promise<SuggestedStrategy[]> {
  return apiFetch<SuggestedStrategy[]>("/optimize/find-strategy", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchIvRank(symbol: string): Promise<IvRankData> {
  return apiFetch<IvRankData>(`/optimize/iv-rank/${encodeURIComponent(symbol)}`);
}
