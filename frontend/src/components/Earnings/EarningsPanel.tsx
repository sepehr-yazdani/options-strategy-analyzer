import type { EarningsResponse } from "../../types/earnings";

interface Props {
  earnings: EarningsResponse;
}

export function EarningsPanel({ earnings }: Props) {
  const { nextEarningsDate, dteToEarnings, epsEstimate, recentEarnings } =
    earnings;

  return (
    <div className="earnings-panel">
      {nextEarningsDate && (
        <div className="earnings-next">
          <span className="earnings-badge">
            Earnings in {dteToEarnings}d
          </span>
          <span className="earnings-date">{nextEarningsDate}</span>
          {epsEstimate != null && (
            <span className="earnings-est">
              Est EPS: ${epsEstimate.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {recentEarnings.length > 0 && (
        <div className="earnings-history">
          <h4>Recent Earnings</h4>
          <table className="earnings-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Est</th>
                <th>Actual</th>
                <th>Surprise</th>
              </tr>
            </thead>
            <tbody>
              {recentEarnings.map((e) => {
                const beat =
                  e.surprisePct != null ? e.surprisePct > 0 : null;
                return (
                  <tr key={e.date}>
                    <td>{e.date}</td>
                    <td>
                      {e.epsEstimate != null
                        ? `$${e.epsEstimate.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>
                      {e.epsActual != null
                        ? `$${e.epsActual.toFixed(2)}`
                        : "-"}
                    </td>
                    <td
                      className={
                        beat === true
                          ? "surprise-beat"
                          : beat === false
                          ? "surprise-miss"
                          : ""
                      }
                    >
                      {e.surprisePct != null
                        ? `${e.surprisePct > 0 ? "+" : ""}${e.surprisePct.toFixed(1)}%`
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!nextEarningsDate && recentEarnings.length === 0 && (
        <div className="earnings-empty">No earnings data available</div>
      )}
    </div>
  );
}
