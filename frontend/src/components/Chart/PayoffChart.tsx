import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  Legend,
} from "recharts";
import { useStrategyStore } from "../../stores/strategyStore";
import { fmtDollar } from "../../utils/formatting";

const CURVE_COLORS = ["#a78bfa", "#34d399", "#f59e0b", "#f87171", "#38bdf8", "#fb923c"];

export function PayoffChart() {
  const payoffData = useStrategyStore((s) => s.payoffData);
  const currentPrice = useStrategyStore((s) => s.currentPrice);
  const isLoading = useStrategyStore((s) => s.isLoadingPayoff);

  if (!payoffData || payoffData.curves.length === 0) {
    return (
      <div className="chart-placeholder">
        {isLoading ? "Calculating..." : "Add legs to see the payoff diagram"}
      </div>
    );
  }

  const atExpiry = payoffData.curves[0];

  // Build chart data: array of { price, atExpiry, curve1, curve2, ... }
  const chartData = atExpiry.points.map((p, i) => {
    const row: Record<string, number> = {
      price: p.underlyingPrice,
      atExpiry: p.pnl,
    };
    payoffData.curves.slice(1).forEach((curve, j) => {
      row[`curve${j}`] = curve.points[i]?.pnl ?? 0;
    });
    return row;
  });

  return (
    <div className="chart-container">
      <div className="chart-stats">
        <span className="stat profit">
          Max Profit: {fmtDollar(payoffData.maxProfit)}
        </span>
        <span className="stat loss">
          Max Loss: {fmtDollar(payoffData.maxLoss)}
        </span>
        {payoffData.breakevens.map((be, i) => (
          <span key={i} className="stat breakeven">
            Breakeven: {fmtDollar(be)}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3040" />
          <XAxis
            dataKey="price"
            stroke="#6b7280"
            fontSize={11}
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            label={{ value: "Underlying Price ($)", position: "insideBottom", offset: -18, fill: "#9ca3af", fontSize: 12 }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={11}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            label={{ value: "P&L ($)", angle: -90, position: "insideLeft", offset: 10, fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ background: "#1a1d27", border: "1px solid #3d4054", borderRadius: 6, fontSize: 12 }}
            labelFormatter={(v) => `Price: $${Number(v).toFixed(2)}`}
            formatter={(value, name) => [
              `$${Number(value).toFixed(2)}`,
              name === "atExpiry" ? "At Expiration" : String(name),
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: 11, color: "#9ca3af", paddingBottom: 8 }}
            formatter={(value: string) => (value === "atExpiry" ? "At Expiration" : value)}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} />
          {currentPrice > 0 && (
            <ReferenceLine
              x={currentPrice}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `Current: $${currentPrice.toFixed(2)}`, fill: "#ef4444", fontSize: 11, position: "insideTopRight" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="atExpiry"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#pnlGradient)"
            isAnimationActive={false}
          />
          {payoffData.curves.slice(1).map((curve, j) => (
            <Line
              key={j}
              type="monotone"
              dataKey={`curve${j}`}
              stroke={CURVE_COLORS[j % CURVE_COLORS.length]}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              name={curve.label}
              isAnimationActive={false}
            />
          ))}
          {payoffData.breakevens.map((be, i) => (
            <ReferenceDot
              key={i}
              x={be}
              y={0}
              r={6}
              fill="#f59e0b"
              stroke="#f59e0b"
            />
          ))}
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="50%" stopColor="#6366f1" stopOpacity={0.02} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15} />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
