import { useEffect, useState } from "react";
import { useStrategyStore } from "../../stores/strategyStore";
import { fetchSqueezeData, type SqueezeData, type GexStrike } from "../../api/discovery";

const RATING_COLORS: Record<string, string> = {
  high: "#ef4444",
  moderate: "#f59e0b",
  low: "#6b7280",
  none: "#3d4054",
};

function fmtGex(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

function fmtShares(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

export function SqueezePanel() {
  const symbol = useStrategyStore((s) => s.symbol);
  const [data, setData] = useState<SqueezeData | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      return;
    }
    let cancelled = false;
    fetchSqueezeData(symbol)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (!data) return null;

  const ratingColor = RATING_COLORS[data.squeeze_rating] || "#6b7280";

  return (
    <div className="squeeze-panel">
      <div className="squeeze-header">
        <h4>Squeeze Analysis</h4>
        <span className="squeeze-badge" style={{ borderColor: ratingColor, color: ratingColor }}>
          {data.squeeze_rating.toUpperCase()} ({data.squeeze_flags}/4)
        </span>
      </div>

      <div className="squeeze-indicators">
        <div className={`squeeze-flag ${data.low_float ? "active" : ""}`}>
          <span className="flag-label">Float</span>
          <span className="flag-value">{fmtShares(data.float_shares)}</span>
          <span className="flag-status">{data.low_float ? "LOW" : "Normal"}</span>
        </div>
        <div className={`squeeze-flag ${data.high_si ? "active" : ""}`}>
          <span className="flag-label">Short Interest</span>
          <span className="flag-value">{(data.short_percent_of_float * 100).toFixed(1)}%</span>
          <span className="flag-status">{data.high_si ? "HIGH" : "Normal"}</span>
        </div>
        <div className={`squeeze-flag ${data.high_days_to_cover ? "active" : ""}`}>
          <span className="flag-label">Days to Cover</span>
          <span className="flag-value">{data.days_to_cover.toFixed(1)}d</span>
          <span className="flag-status">{data.high_days_to_cover ? "HIGH" : "Normal"}</span>
        </div>
        <div className={`squeeze-flag ${data.positive_gex ? "active" : ""}`}>
          <span className="flag-label">Net GEX</span>
          <span className="flag-value">{fmtGex(data.net_gex)}</span>
          <span className="flag-status">{data.gex_direction.toUpperCase()}</span>
        </div>
      </div>

      <div className="gex-summary">
        <span>Call GEX: <b className="gex-call">{fmtGex(data.call_gex)}</b></span>
        <span>Put GEX: <b className="gex-put">{fmtGex(data.put_gex)}</b></span>
      </div>

      <div className="pcr-section">
        <h5>Put/Call Ratio (10 nearest strikes)</h5>
        <div className="pcr-row">
          <span>
            Volume C/P: <b className={data.put_call.volume_sentiment === "bullish" ? "gex-call" : data.put_call.volume_sentiment === "bearish" ? "gex-put" : ""}>{data.put_call.volume_ratio}x</b>
            <span className="pcr-sentiment"> {data.put_call.volume_sentiment}</span>
          </span>
          <span>
            OI C/P: <b className={data.put_call.oi_sentiment === "bullish" ? "gex-call" : data.put_call.oi_sentiment === "bearish" ? "gex-put" : ""}>{data.put_call.oi_ratio}x</b>
            <span className="pcr-sentiment"> {data.put_call.oi_sentiment}</span>
          </span>
        </div>
      </div>

      {data.top_gex_strikes.length > 0 && (
        <div className="gex-strikes">
          <h5>Top GEX Strikes</h5>
          <table className="gex-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Strike</th>
                <th>Exp</th>
                <th>GEX</th>
                <th>OI</th>
              </tr>
            </thead>
            <tbody>
              {data.top_gex_strikes.slice(0, 6).map((s: GexStrike, i: number) => (
                <tr key={i}>
                  <td className={s.type === "call" ? "disc-change-up" : "disc-change-down"}>
                    {s.type.toUpperCase()}
                  </td>
                  <td>${s.strike.toFixed(2)}</td>
                  <td>{s.expiration} ({s.dte}d)</td>
                  <td className={s.gex > 0 ? "gex-call" : "gex-put"}>
                    {fmtGex(s.gex)}
                  </td>
                  <td>{s.oi.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
