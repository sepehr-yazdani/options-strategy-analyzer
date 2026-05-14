import { describe, it, expect, beforeEach } from "vitest";
import { useStrategyStore } from "./strategyStore";
import type { OptionLeg, PayoffResponse } from "../types/option";

function makeLeg(overrides: Partial<OptionLeg> = {}): OptionLeg {
  return {
    id: "test-1",
    optionType: "call",
    action: "buy",
    strike: 3.5,
    expiration: "2026-04-17",
    quantity: 1,
    premium: 0.1,
    iv: null,
    ...overrides,
  };
}

describe("strategyStore", () => {
  beforeEach(() => {
    useStrategyStore.setState({
      symbol: "",
      currentPrice: 0,
      legs: [],
      chain: null,
      payoffData: null,
      isLoadingPayoff: false,
      isLoadingChain: false,
      dataSource: "",
    });
  });

  it("adds and removes legs", () => {
    const { addLeg, removeLeg } = useStrategyStore.getState();

    addLeg(makeLeg({ id: "a" }));
    addLeg(makeLeg({ id: "b" }));
    expect(useStrategyStore.getState().legs).toHaveLength(2);

    removeLeg("a");
    expect(useStrategyStore.getState().legs).toHaveLength(1);
    expect(useStrategyStore.getState().legs[0].id).toBe("b");
  });

  it("updates a leg", () => {
    const { addLeg, updateLeg } = useStrategyStore.getState();

    addLeg(makeLeg({ id: "a", strike: 3.5 }));
    updateLeg("a", { strike: 4.0 });
    expect(useStrategyStore.getState().legs[0].strike).toBe(4.0);
  });

  it("clears all legs and payoff data", () => {
    const { addLeg, setPayoffData, clearLegs } = useStrategyStore.getState();

    addLeg(makeLeg({ id: "a" }));
    setPayoffData({ curves: [], breakevens: [], maxProfit: 100, maxLoss: -50, aggregateGreeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 } } as PayoffResponse);

    clearLegs();
    expect(useStrategyStore.getState().legs).toHaveLength(0);
    expect(useStrategyStore.getState().payoffData).toBeNull();
  });

  it("sets symbol and price", () => {
    const { setSymbol, setCurrentPrice } = useStrategyStore.getState();

    setSymbol("DNN");
    setCurrentPrice(3.41);

    const state = useStrategyStore.getState();
    expect(state.symbol).toBe("DNN");
    expect(state.currentPrice).toBe(3.41);
  });

  it("tracks data source from backend response", () => {
    const { setDataSource } = useStrategyStore.getState();

    setDataSource("schwab");
    expect(useStrategyStore.getState().dataSource).toBe("schwab");

    setDataSource("yahoo");
    expect(useStrategyStore.getState().dataSource).toBe("yahoo");
  });
});
