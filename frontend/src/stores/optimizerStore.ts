import { create } from "zustand";
import type { SuggestedStrategy, IvRankData, Objective } from "../types/optimization";

interface OptimizerState {
  suggestions: SuggestedStrategy[];
  ivRank: IvRankData | null;
  targetPrice: string;
  maxLoss: string;
  maxDte: string;
  objective: Objective;
  isLoading: boolean;

  setSuggestions: (data: SuggestedStrategy[]) => void;
  setIvRank: (data: IvRankData | null) => void;
  setTargetPrice: (v: string) => void;
  setMaxLoss: (v: string) => void;
  setMaxDte: (v: string) => void;
  setObjective: (o: Objective) => void;
  setLoading: (v: boolean) => void;
}

export const useOptimizerStore = create<OptimizerState>((set) => ({
  suggestions: [],
  ivRank: null,
  targetPrice: "",
  maxLoss: "",
  maxDte: "",
  objective: "reward_risk",
  isLoading: false,

  setSuggestions: (data) => set({ suggestions: data }),
  setIvRank: (data) => set({ ivRank: data }),
  setTargetPrice: (v) => set({ targetPrice: v }),
  setMaxLoss: (v) => set({ maxLoss: v }),
  setMaxDte: (v) => set({ maxDte: v }),
  setObjective: (o) => set({ objective: o }),
  setLoading: (v) => set({ isLoading: v }),
}));
