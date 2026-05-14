import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { useStrategyStore } from "../../stores/strategyStore";
import { fetchEarningsMoveAnalysis } from "../../api/earnings";
import type { EarningsMoveAnalysis } from "../../types/earnings";

export function EarningsMoveChart() {
  const symbol = useStrategyStore((s) => s.symbol);
  const [data, setData] = useState<EarningsMoveAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchEarningsMoveAnalysis(symbol)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (loading) return <div className="move-loading">Loading move analysis...</div>;
  if (!data || data.historicalMoves.length === 0) return null;

  const chartData = data.historicalMoves
    .slice()
    .reverse()
    .map((m) => ({
      date: m.date.slice(2),
      move: m.movePct,
      abs: m.absMovePct,
    }));

  const relativeVerdict =
    data.impliedVsAvg != null
      ? data.impliedVsAvg > 1.2
        ? "expensive"
        : data.impliedVsAvg < 0.8
        ? "cheap"
        : "fair"
      : null;

  const ivPct =
    data.currentAtmIv != null ? data.currentAtmIv * 100 : null;
  const highAbsIv = ivPct != null && ivPct > 60;

  let verdictText: string | null = null;
  let verdictColor = "#fbbf24";
  if (relativeVerdict) {
    if (relativeVerdict === "cheap" && highAbsIv) {
      verdictText = `Cheap vs history, but IV is ${ivPct!.toFixed(0)}%`;
      verdictColor = "#fbbf24";
    } else if (relativeVerdict === "cheap") {
      verdictText = "Options look cheap vs history";
      verdictColor = "#34d399";
    } else if (relativeVerdict === "expensive") {
      verdictText = "Options look expensive vs history";
      verdictColor = "#ef4444";
    } else {
      verdictText = "Options fairly priced vs history";
      verdictColor = "#fbbf24";
    }
  }

  return (
    <div className="move-analysis">
      <div className="move-header">
        <h4>Earnings Move Analysis</h4>
        <div className="move-stats">
          <span>
            Avg move: <b>{data.avgAbsMove.toFixed(1)}%</b>
          </span>
          <span>
            Median: <b>{data.medianAbsMove.toFixed(1)}%</b>
          </span>
          <span>
            Max: <b>{data.maxAbsMove.toFixed(1)}%</b>
          </span>
          {data.impliedMove != null && (
            <span>
              Implied: <b>{data.impliedMove.toFixed(1)}%</b>
            </span>
          )}
          {verdictText && (
            <span className="move-verdict" style={{ color: verdictColor }}>
              {verdictText}
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 15, bottom: 25, left: 15 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3040" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={10}
            angle={-45}
            textAnchor="end"
            label={{
              value: "Earnings Date",
              position: "insideBottom",
              offset: -18,
              fill: "#9ca3af",
              fontSize: 11,
            }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={10}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1d27",
              border: "1px solid #3d4054",
              borderRadius: 6,
              fontSize: 11,
            }}
            formatter={(value: number) => [
              `${value > 0 ? "+" : ""}${value.toFixed(2)}%`,
              "Move",
            ]}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} />
          {data.impliedMove != null && (
            <>
              <ReferenceLine
                y={data.impliedMove}
                stroke="#6366f1"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `+${data.impliedMove.toFixed(1)}% implied`,
                  fill: "#6366f1",
                  fontSize: 10,
                  position: "right",
                }}
              />
              <ReferenceLine
                y={-data.impliedMove}
                stroke="#6366f1"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `-${data.impliedMove.toFixed(1)}% implied`,
                  fill: "#6366f1",
                  fontSize: 10,
                  position: "right",
                }}
              />
            </>
          )}
          <Bar dataKey="move" isAnimationActive={false} radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.move >= 0 ? "#34d399" : "#f87171"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
