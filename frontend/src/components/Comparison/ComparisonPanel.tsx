import { lazy, Suspense, useEffect } from "react";
import { useComparisonStore } from "../../stores/comparisonStore";
import { useComparison } from "../../hooks/useComparison";
import { HeatmapChart } from "./HeatmapChart";
import type { GridMetric } from "../../types/analysis";

const GalaxyChart = lazy(() =>
  import("./GalaxyChart").then((m) => ({ default: m.GalaxyChart }))
);

const METRICS: { value: GridMetric; label: string }[] = [
  { value: "iv", label: "IV" },
  { value: "delta", label: "Delta" },
  { value: "gamma", label: "Gamma" },
  { value: "theta", label: "Theta" },
  { value: "vega", label: "Vega" },
  { value: "price", label: "Price" },
  { value: "volume", label: "Volume" },
  { value: "openInterest", label: "Open Int" },
];

export function ComparisonPanel() {
  const optionType = useComparisonStore((s) => s.optionType);
  const metric = useComparisonStore((s) => s.metric);
  const view = useComparisonStore((s) => s.view);
  const isLoading = useComparisonStore((s) => s.isLoading);
  const gridData = useComparisonStore((s) => s.gridData);
  const scatterData = useComparisonStore((s) => s.scatterData);
  const setOptionType = useComparisonStore((s) => s.setOptionType);
  const setMetric = useComparisonStore((s) => s.setMetric);
  const setView = useComparisonStore((s) => s.setView);
  const { loadGrid } = useComparison();

  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  const hasData = view === "heatmap" ? !!gridData : !!scatterData;

  return (
    <div className="comparison-panel">
      <div className="comparison-controls">
        <div className="control-group">
          <button
            className={`toggle-btn ${optionType === "call" ? "active" : ""}`}
            onClick={() => setOptionType("call")}
          >
            Calls
          </button>
          <button
            className={`toggle-btn ${optionType === "put" ? "active" : ""}`}
            onClick={() => setOptionType("put")}
          >
            Puts
          </button>
        </div>

        <select
          className="metric-select"
          value={metric}
          onChange={(e) => setMetric(e.target.value as GridMetric)}
        >
          {METRICS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <div className="control-group">
          <button
            className={`toggle-btn ${view === "heatmap" ? "active" : ""}`}
            onClick={() => setView("heatmap")}
          >
            Heatmap
          </button>
          <button
            className={`toggle-btn ${view === "galaxy" ? "active" : ""}`}
            onClick={() => setView("galaxy")}
          >
            Galaxy
          </button>
        </div>
      </div>

      {isLoading && <div className="comparison-loading">Loading...</div>}

      {!isLoading && !hasData && (
        <div className="comparison-empty">
          Load a ticker to see the strike/expiration comparison
        </div>
      )}

      {!isLoading && hasData && (
        <>
          {view === "heatmap" ? (
            <HeatmapChart />
          ) : (
            <Suspense
              fallback={
                <div className="comparison-loading">Loading galaxy...</div>
              }
            >
              <GalaxyChart />
            </Suspense>
          )}
        </>
      )}

      {view === "galaxy" && !isLoading && hasData && (
        <div className="galaxy-legend">
          Star size = volume + open interest. Color = IV (blue cool, red hot).
          Z-axis = selected metric. Hover for full contract details.
        </div>
      )}
    </div>
  );
}
