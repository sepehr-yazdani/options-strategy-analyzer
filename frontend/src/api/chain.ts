import type { OptionChainResponse, QuoteResponse } from "../types/option";
import { apiFetch } from "./client";

interface ChainWithSource extends OptionChainResponse {
  source: string;
}

interface QuoteWithSource extends QuoteResponse {
  source: string;
}

export function fetchChain(symbol: string): Promise<ChainWithSource> {
  return apiFetch<ChainWithSource>(
    `/chain/${encodeURIComponent(symbol)}`
  );
}

export function fetchQuote(symbol: string): Promise<QuoteWithSource> {
  return apiFetch<QuoteWithSource>(
    `/quote/${encodeURIComponent(symbol)}`
  );
}
