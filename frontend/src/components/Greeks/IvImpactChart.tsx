import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useGreeksStore } from "../../stores/greeksStore";

export function IvImpactChart() {
  const data = useGreeksStore((s) => s.ivImpactData);

  if (!data || data.points.length === 0) return null;

  const chartData = data.points.map((p) => ({
    iv: p.iv,
    price: p.theoreticalPrice,
    vega: p.vega,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 15, bottom: 25, left: 15 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3040" />
        <XAxis
          dataKey="iv"
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          label={{ value: "Implied Volatility", position: "insideBottom", offset: -15, fill: "#9ca3af", fontSize: 11 }}
        />
        <YAxis
          yAxisId="price"
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(v: number) => `$${v.toFixed(2)}`}
        />
        <YAxis
          yAxisId="vega"
          orientation="right"
          stroke="#6b7280"
          fontSize={10}
          tickFormatter={(v: number) => v.toFixed(3)}
        />
        <Tooltip
          contentStyle={{ background: "#1a1d27", border: "1px solid #3d4054", borderRadius: 6, fontSize: 11 }}
          labelFormatter={(v) => `IV: ${(Number(v) * 100).toFixed(1)}%`}
          formatter={(value: number, name: string) => [
            name === "price" ? `$${value.toFixed(4)}` : value.toFixed(4),
            name === "price" ? "Option Price" : "Vega",
          ]}
        />
        {data.dte > 0 && (
          <ReferenceLine yAxisId="price" y={0} stroke="#6b7280" strokeWidth={1} />
        )}
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
          yAxisId="vega"
          type="monotone"
          dataKey="vega"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          name="vega"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
