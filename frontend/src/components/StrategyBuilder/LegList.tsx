import { useStrategyStore } from "../../stores/strategyStore";
import { fmtDollar } from "../../utils/formatting";

export function LegList() {
  const legs = useStrategyStore((s) => s.legs);
  const removeLeg = useStrategyStore((s) => s.removeLeg);
  const clearLegs = useStrategyStore((s) => s.clearLegs);

  if (legs.length === 0) {
    return <div className="leg-list-empty">No legs added yet</div>;
  }

  return (
    <div className="leg-list">
      <div className="leg-list-header">
        <h3>Strategy Legs ({legs.length})</h3>
        <button className="btn-clear" onClick={clearLegs}>
          Clear All
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Type</th>
            <th>Strike</th>
            <th>Exp</th>
            <th>Qty</th>
            <th>Premium</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {legs.map((leg) => (
            <tr key={leg.id} className={leg.action === "buy" ? "leg-buy" : "leg-sell"}>
              <td className={`action-${leg.action}`}>
                {leg.action.toUpperCase()}
              </td>
              <td>{leg.optionType.toUpperCase()}</td>
              <td>{fmtDollar(leg.strike)}</td>
              <td>{leg.expiration || "—"}</td>
              <td>{leg.quantity}</td>
              <td>{fmtDollar(leg.premium)}</td>
              <td>
                <button className="btn-remove" onClick={() => removeLeg(leg.id)}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
