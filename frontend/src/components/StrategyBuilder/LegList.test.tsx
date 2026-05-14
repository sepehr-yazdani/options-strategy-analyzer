import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LegList } from "./LegList";
import { useStrategyStore } from "../../stores/strategyStore";
import type { OptionLeg } from "../../types/option";

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

describe("LegList", () => {
  beforeEach(() => {
    useStrategyStore.setState({ legs: [], payoffData: null });
  });

  it("shows empty message when no legs", () => {
    render(<LegList />);
    expect(screen.getByText("No legs added yet")).toBeInTheDocument();
  });

  it("renders legs correctly", () => {
    useStrategyStore.setState({
      legs: [
        makeLeg({ id: "a", optionType: "call", action: "buy", strike: 3.5, premium: 0.1 }),
        makeLeg({ id: "b", optionType: "put", action: "sell", strike: 4.0, premium: 0.25 }),
      ],
    });
    render(<LegList />);
    expect(screen.getByText("Strategy Legs (2)")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("SELL")).toBeInTheDocument();
    expect(screen.getByText("$3.50")).toBeInTheDocument();
    expect(screen.getByText("$4.00")).toBeInTheDocument();
  });

  it("handles null strike gracefully", () => {
    useStrategyStore.setState({
      legs: [makeLeg({ id: "a", optionType: "stock", strike: null, premium: 3.41 })],
    });
    render(<LegList />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("$3.41")).toBeInTheDocument();
  });

  it("removes a leg when X is clicked", () => {
    useStrategyStore.setState({
      legs: [
        makeLeg({ id: "a" }),
        makeLeg({ id: "b" }),
      ],
    });
    render(<LegList />);
    const removeButtons = screen.getAllByText("×");
    fireEvent.click(removeButtons[0]);
    expect(useStrategyStore.getState().legs).toHaveLength(1);
    expect(useStrategyStore.getState().legs[0].id).toBe("b");
  });

  it("clears all legs when Clear All is clicked", () => {
    useStrategyStore.setState({
      legs: [makeLeg({ id: "a" }), makeLeg({ id: "b" })],
    });
    render(<LegList />);
    fireEvent.click(screen.getByText("Clear All"));
    expect(useStrategyStore.getState().legs).toHaveLength(0);
  });
});
