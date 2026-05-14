import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useGreeksStore } from "../../stores/greeksStore";
import { useStrategyStore } from "../../stores/strategyStore";
import type { GreekKey } from "../../types/greeks";

const GREEK_COLORS: Record<GreekKey, string> = {
  delta: "#6366f1",
  gamma: "#8b5cf6",
  theta: "#ef4444",
  vega: "#f59e0b",
  rho: "#38bdf8",
};

export function GreeksSurfaceChart() {
  const data = useGreeksStore((s) => s.surfaceData);
  const selectedGreek = useGreeksStore((s) => s.selectedGreek);
  const currentPrice = useStrategyStore((s) => s.currentPrice);

  if (!data || data.points.length === 0) return null;

  const color = GREEK_COLORS[selectedGreek] || "#6366f1";

  const chartData = data.points.map((p) => ({
    price: p.underlyingPrice,
    value: p[selectedGreek as keyof typeof p] as number,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 5, right: 15, bottom: 25, left: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3040" />
        <XAxis
          dataKey="price"
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(v: number) => `$${v.toFixed(1)}`}
          label={{ value: "Underlying Price", position: "insideBottom", offset: -15, fill: "#9ca3af", fontSize: 11 }}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(v: number) => v.toFixed(3)}
        />
        <Tooltip
          contentStyle={{ background: "#1a1d27", border: "1px solid #3d4054", borderRadius: 6, fontSize: 11 }}
          labelFormatter={(v) => `$${Number(v).toFixed(2)}`}
          formatter={(value: number) => [value.toFixed(4), selectedGreek]}
        />
        {selectedGreek === "theta" && (
          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} />
        )}
        {currentPrice > 0 && (
          <ReferenceLine x={currentPrice} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.1}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
