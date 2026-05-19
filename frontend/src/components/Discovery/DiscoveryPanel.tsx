import { useCallback, useEffect, useState } from "react";
import {
  fetchMovers,
  fetchWsbSentiment,
  fetchEarningsCalendar,
  fetchUnusualScan,
  fetchUnusualTopMovers,
  type MoverQuote,
  type MoversResponse,
  type WsbTicker,
  type WsbResponse,
  type CalendarEntry,
  type CalendarResponse,
  type UnusualContract,
  type UnusualResponse,
} from "../../api/discovery";
import { useOptionsChain } from "../../hooks/useOptionsChain";

const SCREENS = [
  { id: "most_actives", label: "Most Active" },
  { id: "day_gainers", label: "Gainers" },
  { id: "day_losers", label: "Losers" },
  { id: "most_shorted_stocks", label: "Most Shorted" },
];

function fmtVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function fmtMcap(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v > 0) return `$${(v / 1e3).toFixed(0)}K`;
  return "-";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TIMING_LABELS: Record<string, string> = {
  BMO: "Before Open",
  AMC: "After Close",
  TNS: "Time N/S",
};


type DiscoveryView = "movers" | "wsb" | "calendar" | "unusual";

export function DiscoveryPanel() {
  const [view, setView] = useState<DiscoveryView>("movers");
  const [screen, setScreen] = useState("most_actives");
  const [moversData, setMoversData] = useState<MoversResponse | null>(null);
  const [wsbData, setWsbData] = useState<WsbResponse | null>(null);
  const [calData, setCalData] = useState<CalendarResponse | null>(null);
  const [calStart, setCalStart] = useState(todayStr());
  const [calEnd, setCalEnd] = useState(addDays(todayStr(), 5));
  const [unusualData, setUnusualData] = useState<UnusualResponse | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { loadChain } = useOptionsChain();

  const loadMovers = useCallback(async () => {
    setLoading(true);
    try {
      setMoversData(await fetchMovers(screen, 30));
    } catch {
      setMoversData(null);
    } finally {
      setLoading(false);
    }
  }, [screen]);

  const loadWsb = useCallback(async () => {
    setLoading(true);
    try {
      setWsbData(await fetchWsbSentiment(50));
    } catch {
      setWsbData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnusual = useCallback(async () => {
    setLoading(true);
    try {
      if (scanInput.trim()) {
        const symbols = scanInput
          .split(/[,\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        setUnusualData(await fetchUnusualScan(symbols));
      } else {
        setUnusualData(await fetchUnusualTopMovers());
      }
    } catch {
      setUnusualData(null);
    } finally {
      setLoading(false);
    }
  }, [scanInput]);

  const loadCal = useCallback(async () => {
    setLoading(true);
    try {
      setCalData(await fetchEarningsCalendar(calStart, calEnd));
    } catch {
      setCalData(null);
    } finally {
      setLoading(false);
    }
  }, [calStart, calEnd]);

  useEffect(() => {
    if (view === "movers") loadMovers();
    else if (view === "wsb") loadWsb();
    else if (view === "calendar") loadCal();
    else if (view === "unusual") loadUnusual();
  }, [view, loadMovers, loadWsb, loadCal, loadUnusual]);

  const handleClick = (sym: string) => {
    loadChain(sym);
  };

  return (
    <div className="discovery-panel">
      <div className="discovery-view-tabs">
        <button
          className={`toggle-btn ${view === "movers" ? "active" : ""}`}
          onClick={() => setView("movers")}
        >
          Market Movers
        </button>
        <button
          className={`toggle-btn ${view === "wsb" ? "active" : ""}`}
          onClick={() => setView("wsb")}
        >
          WSB Sentiment
        </button>
        <button
          className={`toggle-btn ${view === "calendar" ? "active" : ""}`}
          onClick={() => setView("calendar")}
        >
          Earnings Calendar
        </button>
        <button
          className={`toggle-btn ${view === "unusual" ? "active" : ""}`}
          onClick={() => setView("unusual")}
        >
          Unusual Activity
        </button>
      </div>

      {/* MOVERS */}
      {view === "movers" && (
        <>
          <div className="discovery-controls">
            {SCREENS.map((s) => (
              <button
                key={s.id}
                className={`toggle-btn ${screen === s.id ? "active" : ""}`}
                onClick={() => setScreen(s.id)}
              >
                {s.label}
              </button>
            ))}
            <button
              className="btn-refresh"
              onClick={loadMovers}
              disabled={loading}
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>

          {!loading && moversData && moversData.results.length > 0 && (
            <table className="discovery-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Volume</th>
                  <th>Vs Avg</th>
                  <th>Mkt Cap</th>
                  <th>52w Range</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {moversData.results.map((q: MoverQuote) => {
                  const volRatio =
                    q.avg_volume > 0
                      ? (q.volume / q.avg_volume).toFixed(1)
                      : "-";
                  const range52 =
                    q.fifty_two_week_high > 0
                      ? `$${q.fifty_two_week_low.toFixed(0)}-$${q.fifty_two_week_high.toFixed(0)}`
                      : "-";
                  return (
                    <tr
                      key={q.symbol}
                      className="discovery-row"
                      onClick={() => handleClick(q.symbol)}
                    >
                      <td className="disc-symbol">
                        <span className="disc-ticker">{q.symbol}</span>
                        <span className="disc-name">{q.name}</span>
                      </td>
                      <td>${q.price.toFixed(2)}</td>
                      <td
                        className={
                          q.change_pct >= 0
                            ? "disc-change-up"
                            : "disc-change-down"
                        }
                      >
                        {q.change_pct >= 0 ? "+" : ""}
                        {q.change_pct.toFixed(1)}%
                      </td>
                      <td>{fmtVolume(q.volume)}</td>
                      <td>{volRatio}x</td>
                      <td>{fmtMcap(q.market_cap)}</td>
                      <td className="disc-range">{range52}</td>
                      <td>{q.earnings_date || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* WSB */}
      {view === "wsb" && (
        <>
          <div className="discovery-controls">
            <span className="wsb-note">
              Ticker mentions across Reddit trading subs (24h)
            </span>
            <button
              className="btn-refresh"
              onClick={loadWsb}
              disabled={loading}
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>

          {!loading && wsbData && wsbData.results.length > 0 && (
            <table className="discovery-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Symbol</th>
                  <th>Mentions</th>
                  <th>Upvotes</th>
                  <th>24h Ago</th>
                  <th>Momentum</th>
                </tr>
              </thead>
              <tbody>
                {wsbData.results.map((t: WsbTicker) => (
                  <tr
                    key={t.ticker}
                    className="discovery-row"
                    onClick={() => handleClick(t.ticker)}
                  >
                    <td>
                      <span className="wsb-rank">
                        {t.rank}
                        {t.trending_up && (
                          <span className="wsb-trending-up"> ^</span>
                        )}
                      </span>
                    </td>
                    <td className="disc-symbol">
                      <span className="disc-ticker">{t.ticker}</span>
                      <span className="disc-name">{t.name}</span>
                    </td>
                    <td>
                      <b>{t.mentions.toLocaleString()}</b>
                    </td>
                    <td>{t.upvotes.toLocaleString()}</td>
                    <td className="disc-range">
                      {t.mentions_24h_ago.toLocaleString()}
                    </td>
                    <td
                      className={
                        t.momentum_pct > 0
                          ? "disc-change-up"
                          : t.momentum_pct < 0
                          ? "disc-change-down"
                          : ""
                      }
                    >
                      {t.momentum_pct > 0 ? "+" : ""}
                      {t.momentum_pct.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* EARNINGS CALENDAR */}
      {view === "calendar" && (
        <>
          <div className="discovery-controls cal-controls">
            <div className="cal-dates">
              <label>
                From
                <input
                  type="date"
                  value={calStart}
                  onChange={(e) => setCalStart(e.target.value)}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={calEnd}
                  onChange={(e) => setCalEnd(e.target.value)}
                />
              </label>
            </div>
            <div className="cal-quick">
              <button
                className="toggle-btn"
                onClick={() => {
                  setCalStart(todayStr());
                  setCalEnd(addDays(todayStr(), 0));
                }}
              >
                Today
              </button>
              <button
                className="toggle-btn"
                onClick={() => {
                  setCalStart(todayStr());
                  setCalEnd(addDays(todayStr(), 4));
                }}
              >
                This Week
              </button>
              <button
                className="toggle-btn"
                onClick={() => {
                  const nextMon = addDays(todayStr(), 7 - new Date().getDay() + 1);
                  setCalStart(nextMon);
                  setCalEnd(addDays(nextMon, 4));
                }}
              >
                Next Week
              </button>
              <button
                className="toggle-btn"
                onClick={() => {
                  setCalStart(todayStr());
                  setCalEnd(addDays(todayStr(), 30));
                }}
              >
                1 Month
              </button>
              <button
                className="toggle-btn"
                onClick={() => {
                  setCalStart(todayStr());
                  setCalEnd(addDays(todayStr(), 90));
                }}
              >
                3 Months
              </button>
              <button
                className="toggle-btn"
                onClick={() => {
                  setCalStart(todayStr());
                  setCalEnd(addDays(todayStr(), 180));
                }}
              >
                6 Months
              </button>
            </div>
            <button
              className="btn-refresh"
              onClick={loadCal}
              disabled={loading}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>

          {!loading && calData && calData.results.length > 0 && (
            <table className="discovery-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Date</th>
                  <th>Timing</th>
                  <th>Mkt Cap</th>
                  <th>EPS Est</th>
                </tr>
              </thead>
              <tbody>
                {calData.results.map((e: CalendarEntry) => (
                  <tr
                    key={e.symbol}
                    className="discovery-row"
                    onClick={() => handleClick(e.symbol)}
                  >
                    <td className="disc-symbol">
                      <span className="disc-ticker">{e.symbol}</span>
                      <span className="disc-name">{e.company}</span>
                    </td>
                    <td>{e.date || "-"}</td>
                    <td className="cal-timing">
                      {TIMING_LABELS[e.timing] || e.timing}
                    </td>
                    <td>{fmtMcap(e.market_cap)}</td>
                    <td>
                      {e.eps_estimate != null
                        ? `$${e.eps_estimate.toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && calData && calData.results.length === 0 && (
            <div className="discovery-empty">
              No earnings found for {calStart} to {calEnd}
            </div>
          )}
        </>
      )}

      {/* UNUSUAL ACTIVITY */}
      {view === "unusual" && (
        <>
          <div className="discovery-controls unusual-controls">
            <div className="unusual-input-wrap">
              <label>Custom symbols (leave empty for today's most active):</label>
              <input
                type="text"
                className="unusual-input"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                placeholder="Leave empty for top movers, or enter: NVDA, AAPL, TSLA..."
              />
            </div>
            <button
              className="btn-refresh"
              onClick={loadUnusual}
              disabled={loading}
            >
              {loading ? "Scanning..." : "Scan"}
            </button>
          </div>

          {!loading &&
            unusualData &&
            unusualData.results.length > 0 && (
              <table className="discovery-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Strike</th>
                    <th>Exp</th>
                    <th>Volume</th>
                    <th>OI</th>
                    <th>Vol/OI</th>
                    <th>IV</th>
                    <th>Bid/Ask</th>
                  </tr>
                </thead>
                <tbody>
                  {unusualData.results.map(
                    (u: UnusualContract, i: number) => (
                      <tr
                        key={`${u.symbol}-${u.strike}-${u.expiration}-${u.option_type}-${i}`}
                        className="discovery-row"
                        onClick={() => handleClick(u.symbol)}
                      >
                        <td className="disc-ticker">{u.symbol}</td>
                        <td
                          className={
                            u.option_type === "call"
                              ? "disc-change-up"
                              : "disc-change-down"
                          }
                        >
                          {u.option_type.toUpperCase()}
                        </td>
                        <td>${u.strike.toFixed(2)}</td>
                        <td>
                          {u.expiration} ({u.dte}d)
                        </td>
                        <td>
                          <b>{u.volume.toLocaleString()}</b>
                        </td>
                        <td>{u.open_interest.toLocaleString()}</td>
                        <td className="unusual-ratio">
                          {u.vol_oi_ratio.toFixed(1)}x
                        </td>
                        <td>{(u.iv * 100).toFixed(1)}%</td>
                        <td className="disc-range">
                          ${u.bid.toFixed(2)}/${u.ask.toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}

          {!loading &&
            unusualData &&
            unusualData.results.length === 0 && (
              <div className="discovery-empty">
                No unusual activity found
              </div>
            )}
        </>
      )}

      {loading && <div className="discovery-loading">Loading...</div>}
    </div>
  );
}
