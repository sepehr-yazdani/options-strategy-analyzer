import { LegEditor } from "./LegEditor";
import { LegList } from "./LegList";
import { QuickStrategyPicker } from "./QuickStrategyPicker";
import { useStrategyStore } from "../../stores/strategyStore";
import { detectStrategy } from "../../utils/strategyDetector";

export function StrategyBuilder() {
  const legs = useStrategyStore((s) => s.legs);
  const detected = detectStrategy(legs);

  return (
    <div className="strategy-builder">
      {detected && (
        <div className="detected-strategy">
          <span className="detected-name">{detected.name}</span>
          <span className="detected-desc">{detected.description}</span>
        </div>
      )}
      <QuickStrategyPicker />
      <LegEditor />
      <LegList />
    </div>
  );
}
