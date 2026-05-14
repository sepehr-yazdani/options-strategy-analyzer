import { create } from "zustand";
import type { GridResponse, GridMetric, ContractScatterResponse } from "../types/analysis";

interface ComparisonState {
  gridData: GridResponse | null;
  scatterData: ContractScatterResponse | null;
  optionType: "call" | "put";
  metric: GridMetric;
  view: "heatmap" | "galaxy";
  isLoading: boolean;

  setGridData: (data: GridResponse | null) => void;
  setScatterData: (data: ContractScatterResponse | null) => void;
  setOptionType: (type: "call" | "put") => void;
  setMetric: (metric: GridMetric) => void;
  setView: (view: "heatmap" | "galaxy") => void;
  setLoading: (loading: boolean) => void;
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  gridData: null,
  scatterData: null,
  optionType: "call",
  metric: "iv",
  view: "heatmap",
  isLoading: false,

  setGridData: (data) => set({ gridData: data }),
  setScatterData: (data) => set({ scatterData: data }),
  setOptionType: (type) => set({ optionType: type }),
  setMetric: (metric) => set({ metric }),
  setView: (view) => set({ view }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
