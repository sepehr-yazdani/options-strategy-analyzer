export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionLeg {
  id: string;
  optionType: "call" | "put" | "stock";
  action: "buy" | "sell";
  strike: number | null;
  expiration: string | null;
  quantity: number;
  premium: number;
  iv: number | null;
}

export interface StrikeData {
  strike: number;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number;
  greeks: Greeks;
  inTheMoney: boolean;
}

export interface ExpirationData {
  expiration: string;
  dte: number;
  calls: StrikeData[];
  puts: StrikeData[];
}

export interface ShortInterest {
  sharesShort: number;
  shortPercentOfFloat: number | null;
  shortRatio: number | null;
  floatShares: number;
}

export interface OptionChainResponse {
  symbol: string;
  underlyingPrice: number;
  expirations: ExpirationData[];
  shortInterest: ShortInterest | null;
}

export interface QuoteResponse {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  volume: number;
}

export interface PayoffPoint {
  underlyingPrice: number;
  pnl: number;
}

export interface PayoffCurve {
  label: string;
  daysToExpiry: number;
  points: PayoffPoint[];
}

export interface PayoffResponse {
  curves: PayoffCurve[];
  breakevens: number[];
  maxProfit: number | null;
  maxLoss: number | null;
  aggregateGreeks: Greeks;
}
