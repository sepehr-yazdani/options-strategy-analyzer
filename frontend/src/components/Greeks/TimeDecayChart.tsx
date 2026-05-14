import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useGreeksStore } from "../../stores/greeksStore";

export function TimeDecayChart() {
  const data = useGreeksStore((s) => s.timeDecayData);

  if (!data || data.points.length === 0) return null;

  const chartData = data.points.map((p) => ({
    dte: p.dte,
    price: p.theoreticalPrice,
    theta: p.theta,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 15, bottom: 25, left: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3040" />
        <XAxis
          dataKey="dte"
          stroke="#6b7280"
          fontSize={10}
          reversed
          label={{ value: "Days to Expiration", position: "insideBottom", offset: -15, fill: "#9ca3af", fontSize: 11 }}
        />
        <YAxis
          yAxisId="price"
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(v: number) => `$${v.toFixed(2)}`}
        />
        <YAxis
          yAxisId="theta"
          orientation="right"
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(v: number) => v.toFixed(4)}
        />
        <Tooltip
          contentStyle={{ background: "#1a1d27", border: "1px solid #3d4054", borderRadius: 6, fontSize: 11 }}
          labelFormatter={(v) => `${v} DTE`}
          formatter={(value: number, name: string) => [
            name === "price" ? `$${value.toFixed(4)}` : value.toFixed(4),
            name === "price" ? "Option Price" : "Theta",
          ]}
        />
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="price"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          name="price"
          isAnimationActive={false}
        />
        <Line
          yAxisId="theta"
          type="monotone"
          dataKey="theta"
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          name="theta"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
