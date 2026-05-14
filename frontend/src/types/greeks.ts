export interface GreeksSurfacePoint {
  underlyingPrice: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  theoreticalPrice: number;
}

export interface GreeksSurfaceResponse {
  points: GreeksSurfacePoint[];
  optionType: string;
  strike: number;
  dte: number;
  iv: number;
}

export interface TimeDecayPoint {
  dte: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  theoreticalPrice: number;
}

export interface TimeDecayResponse {
  points: TimeDecayPoint[];
  optionType: string;
  strike: number;
  underlyingPrice: number;
  iv: number;
}

export interface IvImpactPoint {
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  theoreticalPrice: number;
}

export interface IvImpactResponse {
  points: IvImpactPoint[];
  optionType: string;
  strike: number;
  dte: number;
  underlyingPrice: number;
}

export type GreekKey = "delta" | "gamma" | "theta" | "vega" | "rho";
