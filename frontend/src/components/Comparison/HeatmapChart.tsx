import Plot from "./PlotlyPlot";
import { useComparisonStore } from "../../stores/comparisonStore";

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

export function HeatmapChart() {
  const data = useComparisonStore((s) => s.gridData);

  if (!data || data.grid.length === 0) return null;

  const zText = data.grid.map((row) =>
    row.map((v) => (v != null ? v.toFixed(4) : "N/A"))
  );

  const yLabels = data.expirations.map(
    (exp, i) => `${exp} (${data.dtes[i]}d)`
  );

  return (
    <Plot
      data={[
        {
          type: "heatmap",
          z: data.grid,
          x: data.strikes,
          y: yLabels,
          text: zText,
          hovertemplate:
            "Strike: %{x}<br>Exp: %{y}<br>Value: %{text}<extra></extra>",
          colorscale: "Viridis",
          colorbar: {
            title: { text: METRIC_LABELS[data.metric] || data.metric, font: { color: "#e5e7eb", size: 11 } },
            tickfont: { color: "#9ca3af", size: 10 },
          },
        },
      ]}
      layout={{
        paper_bgcolor: "#1a1d27",
        plot_bgcolor: "#1a1d27",
        font: { color: "#e5e7eb", size: 11 },
        margin: { l: 120, r: 60, t: 30, b: 60 },
        xaxis: {
          title: { text: "Strike Price", font: { size: 12 } },
          gridcolor: "#2d3040",
          tickfont: { size: 10 },
        },
        yaxis: {
          title: { text: "Expiration", font: { size: 12 } },
          gridcolor: "#2d3040",
          tickfont: { size: 10 },
        },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", height: "450px" }}
    />
  );
}
