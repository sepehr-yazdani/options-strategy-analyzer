export interface EarningsEvent {
  date: string;
  epsEstimate: number | null;
  epsActual: number | null;
  surprisePct: number | null;
}

export interface EarningsResponse {
  symbol: string;
  nextEarningsDate: string | null;
  dteToEarnings: number | null;
  epsEstimate: number | null;
  recentEarnings: EarningsEvent[];
}

export interface EarningsMove {
  date: string;
  preClose: number;
  postClose: number;
  movePct: number;
  absMovePct: number;
  direction: string;
}

export interface EarningsMoveAnalysis {
  symbol: string;
  historicalMoves: EarningsMove[];
  avgAbsMove: number;
  medianAbsMove: number;
  maxAbsMove: number;
  impliedMove: number | null;
  impliedVsAvg: number | null;
  currentAtmIv: number | null;
  nextEarningsDate: string | null;
  dteToEarnings: number | null;
}
