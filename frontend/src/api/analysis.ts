import type { GridResponse, ContractScatterResponse } from "../types/analysis";
import { apiFetch } from "./client";

export function fetchStrikeExpiryGrid(params: {
  symbol: string;
  option_type: string;
  metric: string;
  target_price?: number;
}): Promise<GridResponse> {
  return apiFetch<GridResponse>("/analysis/strike-expiry-grid", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchContractScatter(params: {
  symbol: string;
  option_type: string;
}): Promise<ContractScatterResponse> {
  return apiFetch<ContractScatterResponse>("/analysis/contract-scatter", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
