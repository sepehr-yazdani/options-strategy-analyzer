import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PayoffChart } from "./PayoffChart";
import { useStrategyStore } from "../../stores/strategyStore";
import type { PayoffResponse } from "../../types/option";

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Area: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
  ReferenceDot: () => null,
  Legend: () => null,
}));

function makePayoff(overrides: Partial<PayoffResponse> = {}): PayoffResponse {
  return {
    curves: [
      {
        label: "At Expiration",
        daysToExpiry: 0,
        points: [
          { underlyingPrice: 2.0, pnl: -10 },
          { underlyingPrice: 3.0, pnl: -10 },
          { underlyingPrice: 4.0, pnl: 90 },
        ],
      },
    ],
    breakevens: [3.1],
    maxProfit: 90,
    maxLoss: -10,
    aggregateGreeks: { delta: 0.5, gamma: 0.1, theta: -0.02, vega: 0.15, rho: 0.01 },
    ...overrides,
  };
}

describe("PayoffChart", () => {
  beforeEach(() => {
    useStrategyStore.setState({
      payoffData: null,
      currentPrice: 0,
      isLoadingPayoff: false,
    });
  });

  it("shows placeholder when no payoff data", () => {
    render(<PayoffChart />);
    expect(screen.getByText("Add legs to see the payoff diagram")).toBeInTheDocument();
  });

  it("shows loading text when calculating", () => {
    useStrategyStore.setState({ isLoadingPayoff: true });
    render(<PayoffChart />);
    expect(screen.getByText("Calculating...")).toBeInTheDocument();
  });

  it("renders chart with payoff data", () => {
    useStrategyStore.setState({ payoffData: makePayoff(), currentPrice: 3.41 });
    render(<PayoffChart />);
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(screen.getByText("Max Profit: $90.00")).toBeInTheDocument();
    expect(screen.getByText("Max Loss: $-10.00")).toBeInTheDocument();
    expect(screen.getByText("Breakeven: $3.10")).toBeInTheDocument();
  });

  it("handles null maxProfit/maxLoss gracefully", () => {
    useStrategyStore.setState({
      payoffData: makePayoff({ maxProfit: null, maxLoss: null }),
      currentPrice: 3.41,
    });
    render(<PayoffChart />);
    expect(screen.getByText(/Max Profit:/).textContent).toContain("—");
    expect(screen.getByText(/Max Loss:/).textContent).toContain("—");
  });

  it("handles undefined maxProfit/maxLoss gracefully", () => {
    useStrategyStore.setState({
      payoffData: makePayoff({ maxProfit: undefined as unknown as null, maxLoss: undefined as unknown as null }),
      currentPrice: 3.41,
    });
    render(<PayoffChart />);
    expect(screen.getByText(/Max Profit:/).textContent).toContain("—");
    expect(screen.getByText(/Max Loss:/).textContent).toContain("—");
  });

  it("handles empty breakevens", () => {
    useStrategyStore.setState({
      payoffData: makePayoff({ breakevens: [] }),
      currentPrice: 3.41,
    });
    render(<PayoffChart />);
    expect(screen.queryByText(/Breakeven/)).not.toBeInTheDocument();
  });

  it("handles zero currentPrice without crashing", () => {
    useStrategyStore.setState({ payoffData: makePayoff(), currentPrice: 0 });
    render(<PayoffChart />);
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });
});
