import { apiFetch } from "./client";

export interface MoverQuote {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  volume: number;
  avg_volume: number;
  market_cap: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  earnings_date: string | null;
}

export interface MoversResponse {
  screen: string;
  results: MoverQuote[];
}

export function fetchMovers(
  screen: string = "most_actives",
  count: number = 15
): Promise<MoversResponse> {
  return apiFetch<MoversResponse>(
    `/discovery/movers?screen=${screen}&count=${count}`
  );
}

export interface WsbTicker {
  rank: number;
  ticker: string;
  name: string;
  mentions: number;
  upvotes: number;
  rank_24h_ago: number;
  mentions_24h_ago: number;
  momentum_pct: number;
  trending_up: boolean;
}

export interface WsbResponse {
  results: WsbTicker[];
}

export function fetchWsbSentiment(count: number = 25): Promise<WsbResponse> {
  return apiFetch<WsbResponse>(`/discovery/wsb-sentiment?count=${count}`);
}

export interface CalendarEntry {
  symbol: string;
  company: string;
  date: string | null;
  timing: string;
  market_cap: number;
  eps_estimate: number | null;
}

export interface CalendarResponse {
  start: string;
  end: string;
  results: CalendarEntry[];
}

export function fetchEarningsCalendar(
  start: string,
  end: string,
  count: number = 50
): Promise<CalendarResponse> {
  return apiFetch<CalendarResponse>(
    `/discovery/earnings-calendar?start=${start}&end=${end}&count=${count}`
  );
}
