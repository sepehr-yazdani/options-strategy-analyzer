import type { EarningsResponse, EarningsMoveAnalysis } from "../types/earnings";
import { apiFetch } from "./client";

export function fetchEarnings(symbol: string): Promise<EarningsResponse> {
  return apiFetch<EarningsResponse>(
    `/earnings/${encodeURIComponent(symbol)}`
  );
}

export function fetchEarningsMoveAnalysis(
  symbol: string
): Promise<EarningsMoveAnalysis> {
  return apiFetch<EarningsMoveAnalysis>(
    `/earnings/${encodeURIComponent(symbol)}/move-analysis`
  );
}
