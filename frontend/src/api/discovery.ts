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

export interface UnusualContract {
  symbol: string;
  strike: number;
  expiration: string;
  dte: number;
  option_type: string;
  volume: number;
  open_interest: number;
  vol_oi_ratio: number;
  iv: number;
  bid: number;
  ask: number;
  underlying_price: number;
}

export interface UnusualResponse {
  results: UnusualContract[];
}

export function fetchUnusualActivity(symbol: string): Promise<UnusualResponse> {
  return apiFetch<UnusualResponse>(
    `/discovery/unusual-activity/${encodeURIComponent(symbol)}`
  );
}

export function fetchUnusualScan(symbols: string[]): Promise<UnusualResponse> {
  return apiFetch<UnusualResponse>("/discovery/unusual-activity/scan", {
    method: "POST",
    body: JSON.stringify({ symbols }),
  });
}

export function fetchUnusualTopMovers(): Promise<UnusualResponse> {
  return apiFetch<UnusualResponse>("/discovery/unusual-activity/top-movers");
}

export interface GexStrike {
  strike: number;
  expiration: string;
  dte: number;
  type: string;
  gex: number;
  oi: number;
  volume: number;
}

export interface SqueezeData {
  symbol: string;
  underlying_price: number;
  float_shares: number;
  low_float: boolean;
  shares_short: number;
  short_percent_of_float: number;
  high_si: boolean;
  days_to_cover: number;
  high_days_to_cover: boolean;
  call_gex: number;
  put_gex: number;
  net_gex: number;
  gex_direction: string;
  positive_gex: boolean;
  squeeze_rating: string;
  squeeze_flags: number;
  top_gex_strikes: GexStrike[];
  put_call: {
    call_volume: number;
    put_volume: number;
    volume_ratio: number;
    volume_sentiment: string;
    call_oi: number;
    put_oi: number;
    oi_ratio: number;
    oi_sentiment: string;
  };
}

export function fetchSqueezeData(symbol: string): Promise<SqueezeData> {
  return apiFetch<SqueezeData>(
    `/discovery/squeeze/${encodeURIComponent(symbol)}`
  );
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
