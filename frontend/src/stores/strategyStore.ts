import { create } from "zustand";
import type {
  OptionLeg,
  PayoffResponse,
  OptionChainResponse,
} from "../types/option";

interface StrategyState {
  symbol: string;
  currentPrice: number;
  legs: OptionLeg[];
  chain: OptionChainResponse | null;
  payoffData: PayoffResponse | null;
  isLoadingPayoff: boolean;
  isLoadingChain: boolean;
  dataSource: string;

  setSymbol: (symbol: string) => void;
  setCurrentPrice: (price: number) => void;
  addLeg: (leg: OptionLeg) => void;
  removeLeg: (id: string) => void;
  updateLeg: (id: string, updates: Partial<OptionLeg>) => void;
  clearLegs: () => void;
  setChain: (chain: OptionChainResponse | null) => void;
  setPayoffData: (data: PayoffResponse | null) => void;
  setLoadingPayoff: (loading: boolean) => void;
  setLoadingChain: (loading: boolean) => void;
  setDataSource: (source: string) => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  symbol: "",
  currentPrice: 0,
  legs: [],
  chain: null,
  payoffData: null,
  isLoadingPayoff: false,
  isLoadingChain: false,
  dataSource: "",

  setSymbol: (symbol) => set({ symbol }),
  setCurrentPrice: (price) => set({ currentPrice: price }),
  addLeg: (leg) => set((s) => ({ legs: [...s.legs, leg] })),
  removeLeg: (id) => set((s) => ({ legs: s.legs.filter((l) => l.id !== id) })),
  updateLeg: (id, updates) =>
    set((s) => ({
      legs: s.legs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  clearLegs: () => set({ legs: [], payoffData: null }),
  setChain: (chain) => set({ chain }),
  setPayoffData: (data) => set({ payoffData: data }),
  setLoadingPayoff: (loading) => set({ isLoadingPayoff: loading }),
  setLoadingChain: (loading) => set({ isLoadingChain: loading }),
  setDataSource: (source) => set({ dataSource: source }),
}));
