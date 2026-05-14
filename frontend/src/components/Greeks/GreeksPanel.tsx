import { useState } from "react";
import { useStrategyStore } from "../../stores/strategyStore";
import { useGreeksStore } from "../../stores/greeksStore";
import { fmt } from "../../utils/formatting";
import { GreeksSurfaceChart } from "./GreeksSurfaceChart";
import { TimeDecayChart } from "./TimeDecayChart";
import { IvImpactChart } from "./IvImpactChart";
import type { GreekKey } from "../../types/greeks";

type Tab = "summary" | "surface" | "decay" | "iv";

const GREEKS: GreekKey[] = ["delta", "gamma", "theta", "vega", "rho"];

export function GreeksPanel() {
  const payoffData = useStrategyStore((s) => s.payoffData);
  const surfaceData = useGreeksStore((s) => s.surfaceData);
  const selectedGreek = useGreeksStore((s) => s.selectedGreek);
  const setSelectedGreek = useGreeksStore((s) => s.setSelectedGreek);
  const [tab, setTab] = useState<Tab>("summary");

  if (!payoffData) return null;

  const g = payoffData.aggregateGreeks;
  const hasCharts = !!surfaceData;

  return (
    <div className="greeks-panel">
      <div className="greeks-tabs">
        <button
          className={`greeks-tab ${tab === "summary" ? "active" : ""}`}
          onClick={() => setTab("summary")}
        >
          Summary
        </button>
        {hasCharts && (
          <>
            <button
              className={`greeks-tab ${tab === "surface" ? "active" : ""}`}
              onClick={() => setTab("surface")}
            >
              vs Price
            </button>
            <button
              className={`greeks-tab ${tab === "decay" ? "active" : ""}`}
              onClick={() => setTab("decay")}
            >
              Time Decay
            </button>
            <button
              className={`greeks-tab ${tab === "iv" ? "active" : ""}`}
              onClick={() => setTab("iv")}
            >
              IV Impact
            </button>
          </>
        )}
      </div>

      {tab === "summary" && (
        <div className="greeks-grid">
          {GREEKS.map((key) => (
            <div className="greek" key={key}>
              <span className="greek-label">{key}</span>
              <span className="greek-value">{fmt(g[key], 4)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "surface" && hasCharts && (
        <div className="greeks-chart-section">
          <div className="greek-selector">
            {GREEKS.map((key) => (
              <button
                key={key}
                className={`greek-sel-btn ${selectedGreek === key ? "active" : ""}`}
                onClick={() => setSelectedGreek(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <GreeksSurfaceChart />
        </div>
      )}

      {tab === "decay" && hasCharts && <TimeDecayChart />}

      {tab === "iv" && hasCharts && <IvImpactChart />}
    </div>
  );
}
