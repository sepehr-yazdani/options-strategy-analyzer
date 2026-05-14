import { create } from "zustand";
import type {
  GreeksSurfaceResponse,
  TimeDecayResponse,
  IvImpactResponse,
  GreekKey,
} from "../types/greeks";

interface GreeksAnalysisState {
  surfaceData: GreeksSurfaceResponse | null;
  timeDecayData: TimeDecayResponse | null;
  ivImpactData: IvImpactResponse | null;
  selectedGreek: GreekKey;
  isLoading: boolean;

  setSurfaceData: (data: GreeksSurfaceResponse | null) => void;
  setTimeDecayData: (data: TimeDecayResponse | null) => void;
  setIvImpactData: (data: IvImpactResponse | null) => void;
  setSelectedGreek: (greek: GreekKey) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useGreeksStore = create<GreeksAnalysisState>((set) => ({
  surfaceData: null,
  timeDecayData: null,
  ivImpactData: null,
  selectedGreek: "delta",
  isLoading: false,

  setSurfaceData: (data) => set({ surfaceData: data }),
  setTimeDecayData: (data) => set({ timeDecayData: data }),
  setIvImpactData: (data) => set({ ivImpactData: data }),
  setSelectedGreek: (greek) => set({ selectedGreek: greek }),
  setLoading: (loading) => set({ isLoading: loading }),
  clear: () =>
    set({ surfaceData: null, timeDecayData: null, ivImpactData: null }),
}));
