import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptionsChainViewer } from "./OptionsChainViewer";
import { useStrategyStore } from "../../stores/strategyStore";
import type { OptionChainResponse } from "../../types/option";

function makeChain(overrides: Partial<OptionChainResponse> = {}): OptionChainResponse {
  return {
    symbol: "DNN",
    underlyingPrice: 3.41,
    expirations: [
      {
        expiration: "2026-04-17",
        dte: 20,
        calls: [
          {
            strike: 3.0,
            bid: 0.5,
            ask: 0.55,
            last: 0.52,
            volume: 100,
            openInterest: 500,
            iv: 0.85,
            greeks: { delta: 0.6, gamma: 0.1, theta: -0.02, vega: 0.05, rho: 0.01 },
            inTheMoney: true,
          },
          {
            strike: 3.5,
            bid: 0.1,
            ask: 0.15,
            last: 0.12,
            volume: 200,
            openInterest: 1000,
            iv: 0.9,
            greeks: { delta: 0.4, gamma: 0.12, theta: -0.03, vega: 0.06, rho: 0.01 },
            inTheMoney: false,
          },
        ],
        puts: [
          {
            strike: 3.0,
            bid: 0.05,
            ask: 0.1,
            last: 0.07,
            volume: 50,
            openInterest: 300,
            iv: 0.8,
            greeks: { delta: -0.3, gamma: 0.08, theta: -0.01, vega: 0.04, rho: -0.005 },
            inTheMoney: false,
          },
          {
            strike: 3.5,
            bid: 0.15,
            ask: 0.2,
            last: 0.18,
            volume: 75,
            openInterest: 400,
            iv: 0.95,
            greeks: { delta: -0.55, gamma: 0.11, theta: -0.025, vega: 0.055, rho: -0.008 },
            inTheMoney: true,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("OptionsChainViewer", () => {
  beforeEach(() => {
    useStrategyStore.setState({
      chain: null,
      legs: [],
      isLoadingChain: false,
    });
  });

  it("renders nothing when no chain loaded", () => {
    const { container } = render(<OptionsChainViewer />);
    expect(container.innerHTML).toBe("");
  });

  it("shows loading state", () => {
    useStrategyStore.setState({ isLoadingChain: true });
    render(<OptionsChainViewer />);
    expect(screen.getByText("Loading chain...")).toBeInTheDocument();
  });

  it("shows expiration selector when chain loaded", () => {
    useStrategyStore.setState({ chain: makeChain() });
    render(<OptionsChainViewer />);
    expect(screen.getByText("Select expiration...")).toBeInTheDocument();
  });

  it("shows chain table when expiration is selected", () => {
    useStrategyStore.setState({ chain: makeChain() });
    render(<OptionsChainViewer />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2026-04-17" } });

    expect(screen.getByText("CALLS")).toBeInTheDocument();
    expect(screen.getByText("PUTS")).toBeInTheDocument();
    expect(screen.getByText("$3.00")).toBeInTheDocument();
    expect(screen.getByText("$3.50")).toBeInTheDocument();
  });

  it("adds a call leg when bid is clicked (buy call)", () => {
    useStrategyStore.setState({ chain: makeChain() });
    render(<OptionsChainViewer />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2026-04-17" } });

    // Click the first call bid (0.50 = buy call at strike 3.0)
    const bidCells = screen.getAllByTitle("Buy call");
    fireEvent.click(bidCells[0]);

    const legs = useStrategyStore.getState().legs;
    expect(legs).toHaveLength(1);
    expect(legs[0].optionType).toBe("call");
    expect(legs[0].action).toBe("buy");
    expect(legs[0].strike).toBe(3.0);
    expect(legs[0].premium).toBe(0.55); // ask price for buy
    expect(legs[0].expiration).toBe("2026-04-17");
  });

  it("adds a put leg when put bid is clicked", () => {
    useStrategyStore.setState({ chain: makeChain() });
    render(<OptionsChainViewer />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2026-04-17" } });

    const putBids = screen.getAllByTitle("Buy put");
    fireEvent.click(putBids[0]);

    const legs = useStrategyStore.getState().legs;
    expect(legs).toHaveLength(1);
    expect(legs[0].optionType).toBe("put");
    expect(legs[0].action).toBe("buy");
    expect(legs[0].premium).toBe(0.1); // ask for buy
  });

  it("handles chain with NaN/undefined values without crashing", () => {
    const chain = makeChain();
    chain.expirations[0].calls[0].volume = undefined as unknown as number;
    chain.expirations[0].calls[0].iv = NaN;
    useStrategyStore.setState({ chain });
    render(<OptionsChainViewer />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2026-04-17" } });

    // Should not crash — NaN IV shows as "—", undefined volume shows as 0
    expect(screen.getByText("CALLS")).toBeInTheDocument();
  });
});
