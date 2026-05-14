import type { OptionLeg } from "./option";

export interface SuggestedStrategy {
  name: string;
  legs: OptionLeg[];
  pnlAtTarget: number;
  maxProfit: number | null;
  maxLoss: number | null;
  breakevens: number[];
  rewardRiskRatio: number | null;
  probabilityOfProfit: number | null;
  score: number;
}

export interface IvRankData {
  symbol: string;
  currentIv: number;
  ivHigh: number;
  ivLow: number;
  ivRank: number;
  ivPercentile: number;
  classification: string;
}

export type Objective = "reward_risk" | "max_prob_profit" | "min_cost";
