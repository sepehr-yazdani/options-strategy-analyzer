import { useState, lazy, Suspense } from "react";
import { PayoffChart } from "./components/Chart/PayoffChart";
import { StrategyBuilder } from "./components/StrategyBuilder/StrategyBuilder";
import { OptionsChainViewer } from "./components/OptionsChain/OptionsChainViewer";
import { GreeksPanel } from "./components/Greeks/GreeksPanel";
import { EarningsPanel } from "./components/Earnings/EarningsPanel";
import { EarningsMoveChart } from "./components/Earnings/EarningsMoveChart";
import { OptimizerPanel } from "./components/Optimizer/OptimizerPanel";
import { DiscoveryPanel } from "./components/Discovery/DiscoveryPanel";
import { IvRankBadge } from "./components/Optimizer/IvRankBadge";
import { SqueezePanel } from "./components/Optimizer/SqueezePanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { usePayoff } from "./hooks/usePayoff";
import { useOptionsChain } from "./hooks/useOptionsChain";
import { useGreeksAnalysis } from "./hooks/useGreeksAnalysis";
import { useEarnings } from "./hooks/useEarnings";
import { useOptimizer } from "./hooks/useOptimizer";
import { useStrategyStore } from "./stores/strategyStore";
import { useOptimizerStore } from "./stores/optimizerStore";
import { fmtDollar } from "./utils/formatting";
import "./App.css";

const ComparisonPanel = lazy(() =>
  import("./components/Comparison/ComparisonPanel").then((m) => ({
    default: m.ComparisonPanel,
  }))
);

type CenterTab = "analysis" | "comparison" | "optimizer" | "discovery";

function App() {
  const [tickerInput, setTickerInput] = useState("");
  const [centerTab, setCenterTab] = useState<CenterTab>("analysis");
  const [showGuide, setShowGuide] = useState(false);
  const symbol = useStrategyStore((s) => s.symbol);
  const currentPrice = useStrategyStore((s) => s.currentPrice);
  const dataSource = useStrategyStore((s) => s.dataSource);
  const chain = useStrategyStore((s) => s.chain);
  const ivRank = useOptimizerStore((s) => s.ivRank);
  const { loadChain } = useOptionsChain();
  const earnings = useEarnings();

  usePayoff();
  useGreeksAnalysis();
  useOptimizer();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      loadChain(tickerInput.trim());
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title-row">
          <h1>Options Strategy Analyzer</h1>
          <button
            className="btn-guide"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? "Hide Guide" : "Signal Guide"}
          </button>
        </div>
        <div className="header-controls">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              placeholder="Enter ticker (e.g. SPY)"
              className="ticker-input"
            />
            <button type="submit" className="btn-search">
              Load Chain
            </button>
          </form>
        </div>
        {symbol && (
          <div className="ticker-info">
            <span className="ticker-symbol">{symbol}</span>
            <span className="ticker-price">{fmtDollar(currentPrice)}</span>
            {dataSource && (
              <span className="data-source-badge">via {dataSource}</span>
            )}
            {ivRank && <IvRankBadge data={ivRank} />}
            {chain?.shortInterest && chain.shortInterest.shortPercentOfFloat != null && (
              <span className="short-interest-badge">
                SI: {(chain.shortInterest.shortPercentOfFloat * 100).toFixed(1)}%
                {chain.shortInterest.shortRatio != null && (
                  <span className="si-ratio"> ({chain.shortInterest.shortRatio.toFixed(1)}d)</span>
                )}
              </span>
            )}
            {earnings?.dteToEarnings != null && (
              <span className="earnings-countdown">
                Earnings in {earnings.dteToEarnings}d
              </span>
            )}
          </div>
        )}
      </header>

      {showGuide && (
        <div className="signal-guide">
          <div className="guide-grid">
            <div className="guide-card">
              <h4>IV Rank</h4>
              <p><b className="signal-buy">Low</b> = options cheap, buy premium (calls, puts, straddles)</p>
              <p><b className="signal-sell">High</b> = options expensive, sell premium (spreads, condors)</p>
            </div>
            <div className="guide-card">
              <h4>Short Interest</h4>
              <p><b className="signal-buy">High SI + rising price</b> = squeeze potential, buy calls</p>
              <p><b>Low SI</b> = no squeeze pressure, normal price action</p>
            </div>
            <div className="guide-card">
              <h4>Earnings Moves</h4>
              <p><b className="signal-buy">Cheap vs history</b> = buy straddles before earnings</p>
              <p><b className="signal-sell">Expensive vs history</b> = sell iron condors, collect IV crush</p>
            </div>
            <div className="guide-card">
              <h4>WSB Sentiment</h4>
              <p><b className="signal-buy">Rising momentum + low IV</b> = hype not priced in yet</p>
              <p><b className="signal-sell">High mentions + extreme IV</b> = priced in, sell premium</p>
            </div>
            <div className="guide-card">
              <h4>Unusual Activity</h4>
              <p><b className="signal-buy">High vol/OI calls</b> = aggressive bullish positioning</p>
              <p><b className="signal-sell">High vol/OI puts</b> = hedging or bearish bets</p>
              <p><b>Near-term</b> = imminent catalyst. <b>Far-dated</b> = institutional conviction</p>
            </div>
            <div className="guide-card">
              <h4>Combining Signals</h4>
              <p>Strongest: WSB momentum + earnings soon + low IV + unusual calls at specific strikes</p>
              <p>Reverse: post-earnings + extreme IV + no activity = sell spreads for IV crush</p>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <div className="left-panel">
          <ErrorBoundary>
            <StrategyBuilder />
          </ErrorBoundary>
          {earnings && (
            <ErrorBoundary>
              <EarningsPanel earnings={earnings} />
            </ErrorBoundary>
          )}
          <ErrorBoundary>
            <SqueezePanel />
          </ErrorBoundary>
        </div>
        <div className="center-panel">
          <div className="center-tabs">
            <button
              className={`center-tab ${centerTab === "analysis" ? "active" : ""}`}
              onClick={() => setCenterTab("analysis")}
            >
              Payoff + Chain
            </button>
            <button
              className={`center-tab ${centerTab === "comparison" ? "active" : ""}`}
              onClick={() => setCenterTab("comparison")}
            >
              Comparison
            </button>
            <button
              className={`center-tab ${centerTab === "optimizer" ? "active" : ""}`}
              onClick={() => setCenterTab("optimizer")}
            >
              Optimizer
            </button>
            <button
              className={`center-tab ${centerTab === "discovery" ? "active" : ""}`}
              onClick={() => setCenterTab("discovery")}
            >
              Discovery
            </button>
          </div>

          {centerTab === "analysis" && (
            <>
              <ErrorBoundary>
                <PayoffChart />
              </ErrorBoundary>
              <ErrorBoundary>
                <GreeksPanel />
              </ErrorBoundary>
              <ErrorBoundary>
                <EarningsMoveChart />
              </ErrorBoundary>
              <ErrorBoundary>
                <OptionsChainViewer
                  earningsDate={earnings?.nextEarningsDate}
                />
              </ErrorBoundary>
            </>
          )}

          {centerTab === "comparison" && (
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="comparison-loading">
                    Loading comparison...
                  </div>
                }
              >
                <ComparisonPanel />
              </Suspense>
            </ErrorBoundary>
          )}

          {centerTab === "optimizer" && (
            <ErrorBoundary>
              <OptimizerPanel />
            </ErrorBoundary>
          )}

          {centerTab === "discovery" && (
            <ErrorBoundary>
              <DiscoveryPanel />
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
