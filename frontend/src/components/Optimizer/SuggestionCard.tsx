import { useStrategyStore } from "../../stores/strategyStore";
import type { SuggestedStrategy } from "../../types/optimization";
import { fmtDollar } from "../../utils/formatting";

interface Props {
  strategy: SuggestedStrategy;
}

export function SuggestionCard({ strategy }: Props) {
  const clearLegs = useStrategyStore((s) => s.clearLegs);
  const addLeg = useStrategyStore((s) => s.addLeg);

  const handleApply = () => {
    clearLegs();
    for (const leg of strategy.legs) {
      addLeg(leg);
    }
  };

  return (
    <div className="suggestion-card">
      <div className="suggestion-header">
        <span className="suggestion-name">{strategy.name}</span>
        <button className="btn-apply" onClick={handleApply}>
          Apply
        </button>
      </div>
      <div className="suggestion-legs">
        {strategy.legs.map((leg, i) => (
          <span key={i} className="suggestion-leg">
            {leg.action.toUpperCase()} {leg.optionType} ${leg.strike}{" "}
            {leg.expiration}
          </span>
        ))}
      </div>
      <div className="suggestion-stats">
        <span className="sstat">
          P&L @ Target: <b>{fmtDollar(strategy.pnlAtTarget)}</b>
        </span>
        <span className="sstat">
          Max Loss: <b>{fmtDollar(strategy.maxLoss)}</b>
        </span>
        {strategy.rewardRiskRatio != null && (
          <span className="sstat">
            R:R <b>{strategy.rewardRiskRatio.toFixed(2)}</b>
          </span>
        )}
        {strategy.probabilityOfProfit != null && (
          <span className="sstat">
            PoP <b>{(strategy.probabilityOfProfit * 100).toFixed(0)}%</b>
          </span>
        )}
      </div>
    </div>
  );
}
