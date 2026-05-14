import { useMemo } from "react";
import Plot from "./PlotlyPlot";
import { useComparisonStore } from "../../stores/comparisonStore";
import type { ContractPoint, GridMetric } from "../../types/analysis";

const METRIC_LABELS: Record<string, string> = {
  iv: "Implied Volatility",
  delta: "Delta",
  gamma: "Gamma",
  theta: "Theta",
  vega: "Vega",
  price: "Last Price",
  volume: "Volume",
  openInterest: "Open Interest",
};

function getMetricValue(c: ContractPoint, metric: GridMetric): number {
  switch (metric) {
    case "iv": return c.iv;
    case "delta": return Math.abs(c.delta);
    case "gamma": return c.gamma;
    case "theta": return Math.abs(c.theta);
    case "vega": return c.vega;
    case "price": return c.last;
    case "volume": return c.volume;
    case "openInterest": return c.openInterest;
  }
}

export function GalaxyChart() {
  const scatterData = useComparisonStore((s) => s.scatterData);
  const metric = useComparisonStore((s) => s.metric);

  const plotData = useMemo(() => {
    if (!scatterData || scatterData.contracts.length === 0) return null;

    const contracts = scatterData.contracts.filter(
      (c) => c.iv > 0 || c.last > 0
    );
    if (contracts.length === 0) return null;

    const x = contracts.map((c) => c.strike);
    const y = contracts.map((c) => c.dte);
    const z = contracts.map((c) => getMetricValue(c, metric));

    // Size: log scale of volume, clamped
    const sizes = contracts.map((c) => {
      const vol = Math.max(c.volume + c.openInterest, 1);
      return Math.min(Math.max(Math.log10(vol) * 4, 3), 20);
    });

    // Color: IV for the "temperature" of each star
    const colors = contracts.map((c) => c.iv);

    const siLine =
      scatterData.shortPercentOfFloat != null
        ? `<br>SI: ${(scatterData.shortPercentOfFloat * 100).toFixed(1)}% of float` +
          (scatterData.shortRatio != null ? ` (${scatterData.shortRatio.toFixed(1)}d to cover)` : "")
        : "";

    const hoverText = contracts.map(
      (c) =>
        `<b>$${c.strike} · ${c.expiration}</b> (${c.dte}d)<br>` +
        `Bid: $${c.bid.toFixed(2)} · Ask: $${c.ask.toFixed(2)}<br>` +
        `IV: ${(c.iv * 100).toFixed(1)}% · Vol: ${c.volume.toLocaleString()}<br>` +
        `Δ ${c.delta.toFixed(3)} · Γ ${c.gamma.toFixed(4)}<br>` +
        `Θ ${c.theta.toFixed(4)} · V ${c.vega.toFixed(4)}` +
        `${c.inTheMoney ? "<br><b>ITM</b>" : ""}` +
        siLine
    );

    return { x, y, z, sizes, colors, hoverText };
  }, [scatterData, metric]);

  if (!plotData) return null;

  return (
    <Plot
      data={[
        {
          type: "scatter3d" as const,
          mode: "markers" as const,
          x: plotData.x,
          y: plotData.y,
          z: plotData.z,
          text: plotData.hoverText,
          hovertemplate: "%{text}<extra></extra>",
          marker: {
            size: plotData.sizes,
            color: plotData.colors,
            colorscale: [
              [0, "#1e3a5f"],
              [0.2, "#3b82f6"],
              [0.4, "#a78bfa"],
              [0.6, "#f9fafb"],
              [0.8, "#fbbf24"],
              [1, "#ef4444"],
            ],
            colorbar: {
              title: { text: "IV", font: { color: "#9ca3af", size: 11 } },
              tickfont: { color: "#6b7280", size: 10 },
              tickformat: ".0%",
              bgcolor: "rgba(0,0,0,0)",
              outlinewidth: 0,
            },
            opacity: 0.9,
            line: { width: 0.5, color: "rgba(255,255,255,0.15)" },
          },
        },
      ]}
      layout={{
        paper_bgcolor: "#08080f",
        plot_bgcolor: "#08080f",
        font: { color: "#9ca3af", size: 11 },
        margin: { l: 10, r: 10, t: 30, b: 10 },
        scene: {
          xaxis: {
            title: { text: "Strike", font: { size: 12, color: "#6b7280" } },
            gridcolor: "rgba(99,102,241,0.08)",
            zerolinecolor: "rgba(99,102,241,0.15)",
            backgroundcolor: "#08080f",
            showspikes: false,
          },
          yaxis: {
            title: { text: "DTE", font: { size: 12, color: "#6b7280" } },
            gridcolor: "rgba(99,102,241,0.08)",
            zerolinecolor: "rgba(99,102,241,0.15)",
            backgroundcolor: "#08080f",
            showspikes: false,
          },
          zaxis: {
            title: {
              text: METRIC_LABELS[metric] || metric,
              font: { size: 12, color: "#6b7280" },
            },
            gridcolor: "rgba(99,102,241,0.08)",
            zerolinecolor: "rgba(99,102,241,0.15)",
            backgroundcolor: "#08080f",
            showspikes: false,
          },
          camera: { eye: { x: 1.8, y: -1.4, z: 0.8 } },
          aspectmode: "manual" as const,
          aspectratio: { x: 1.4, y: 1, z: 0.8 },
        },
      }}
      config={{ responsive: true, displayModeBar: true }}
      style={{ width: "100%", height: "550px" }}
    />
  );
}
