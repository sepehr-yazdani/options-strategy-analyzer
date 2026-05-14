export interface GridResponse {
  strikes: number[];
  expirations: string[];
  dtes: number[];
  grid: (number | null)[][];
  metric: string;
  underlyingPrice: number;
}

export type GridMetric =
  | "iv"
  | "delta"
  | "gamma"
  | "theta"
  | "vega"
  | "price"
  | "volume"
  | "openInterest";

export interface ContractPoint {
  strike: number;
  expiration: string;
  dte: number;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  inTheMoney: boolean;
}

export interface ContractScatterResponse {
  contracts: ContractPoint[];
  underlyingPrice: number;
  symbol: string;
  optionType: string;
  shortPercentOfFloat: number | null;
  shortRatio: number | null;
}
