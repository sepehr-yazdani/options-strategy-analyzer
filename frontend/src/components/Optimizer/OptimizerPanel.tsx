import { useOptimizerStore } from "../../stores/optimizerStore";
import { useOptimizer } from "../../hooks/useOptimizer";
import { SuggestionCard } from "./SuggestionCard";
import type { Objective } from "../../types/optimization";

const OBJECTIVES: { value: Objective; label: string; description: string }[] = [
  {
    value: "reward_risk",
    label: "Best Risk/Reward",
    description:
      "Ranks by expected value weighted by reward/risk ratio. Favors strategies where potential profit is high relative to what you risk, with a realistic chance of hitting the target.",
  },
  {
    value: "max_prob_profit",
    label: "Highest Prob of Profit",
    description:
      "Ranks by probability of profit above all else. Favors safer trades like ITM spreads that are likely to profit, even if the payout is modest.",
  },
  {
    value: "min_cost",
    label: "Best Value",
    description:
      "Ranks by expected profit per dollar risked. Favors strategies where you get the most bang for your buck, balancing cost against likely return.",
  },
];

export function OptimizerPanel() {
  const targetPrice = useOptimizerStore((s) => s.targetPrice);
  const maxLoss = useOptimizerStore((s) => s.maxLoss);
  const maxDte = useOptimizerStore((s) => s.maxDte);
  const objective = useOptimizerStore((s) => s.objective);
  const suggestions = useOptimizerStore((s) => s.suggestions);
  const isLoading = useOptimizerStore((s) => s.isLoading);
  const setTargetPrice = useOptimizerStore((s) => s.setTargetPrice);
  const setMaxLoss = useOptimizerStore((s) => s.setMaxLoss);
  const setMaxDte = useOptimizerStore((s) => s.setMaxDte);
  const setObjective = useOptimizerStore((s) => s.setObjective);
  const { runOptimizer } = useOptimizer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runOptimizer();
  };

  return (
    <div className="optimizer-panel">
      <form className="optimizer-form" onSubmit={handleSubmit}>
        <div className="opt-row">
          <div className="opt-field">
            <label>Target Price</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 160"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
            />
          </div>
          <div className="opt-field">
            <label>Max Loss ($)</label>
            <input
              type="number"
              step="1"
              placeholder="optional"
              value={maxLoss}
              onChange={(e) => setMaxLoss(e.target.value)}
            />
          </div>
          <div className="opt-field">
            <label>Max DTE</label>
            <input
              type="number"
              step="1"
              placeholder="optional"
              value={maxDte}
              onChange={(e) => setMaxDte(e.target.value)}
            />
          </div>
        </div>
        <div className="opt-row">
          <div className="opt-field">
            <label>Objective</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as Objective)}
            >
              {OBJECTIVES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-optimize" disabled={isLoading}>
            {isLoading ? "Searching..." : "Find Strategies"}
          </button>
        </div>
      </form>

      <div className="objective-description">
        {OBJECTIVES.find((o) => o.value === objective)?.description}
      </div>

      {suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} strategy={s} />
          ))}
        </div>
      )}

      {!isLoading && suggestions.length === 0 && targetPrice && (
        <div className="optimizer-empty">
          Enter a target price and click Find Strategies
        </div>
      )}
    </div>
  );
}
