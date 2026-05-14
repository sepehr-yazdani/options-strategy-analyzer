# Options Strategy Analyzer

Interactive options trading platform with real-time Greeks computation, multi-contract comparison, strategy optimization, earnings analysis, and market discovery.

## Features

### Payoff Analysis
- Multi-leg strategy builder with 7 preset templates (straddles, spreads, condors, etc.)
- Real-time payoff charts with multiple time horizon curves (T+7d, T+15d, T+30d)
- Black-Scholes-Merton Greeks computation (delta, gamma, theta, vega, rho)
- Auto-detected strategy names (long call, iron condor, butterfly, etc.)

### Greeks Visualization
- **Greeks vs Price** — how delta/gamma/theta/vega change as the underlying moves
- **Time Decay** — option price and theta erosion as expiration approaches
- **IV Impact** — how changes in implied volatility affect pricing

### Multi-Contract Comparison
- **Heatmap** — strike x expiration grid for any metric (IV, delta, gamma, theta, vega, price, volume, open interest)
- **Galaxy View** — 3D scatter plot where each contract is a "star." Size = liquidity, color = IV temperature. Hover for full contract details including Greeks and bid/ask

### Strategy Optimizer
- Set a target price, max loss, and max DTE
- Three objectives: Best Risk/Reward, Highest Probability of Profit, Best Value
- Generates and ranks long calls, long puts, bull call spreads, and bear put spreads
- PoP calculated via BSM delta at breakeven. Scoring penalizes lottery tickets, short DTE, and poor return-on-risk
- Click "Apply" to load any suggestion into the payoff chart

### Earnings Analysis
- Next earnings date countdown and EPS estimates
- Historical earnings table with beat/miss tracking
- **Earnings Move Analysis** — bar chart of historical stock moves on earnings vs current implied move from the ATM straddle. Shows whether options are cheap, expensive, or fairly priced relative to the stock's own history
- Expiration selector annotates pre/post earnings dates

### Market Discovery
- **Market Movers** — most active, day gainers, day losers, most shorted (via Yahoo Finance screener)
- **WSB Sentiment** — Reddit trading sub mention counts, upvotes, and 24h momentum (via ApeWisdom)
- **Earnings Calendar** — search by date range with quick buttons for today/this week/next week
- Click any row to load the ticker's options chain

### Context at a Glance
- **IV Rank** badge — where current ATM IV sits relative to the term structure (low/neutral/high/extreme)
- **Short Interest** badge — SI % of float and days to cover
- **Data source** indicator — shows whether data came from Schwab or Yahoo

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**

## Quick Start

```bash
./start.sh
```

This will:
1. Create a Python virtual environment and install backend dependencies (first run only)
2. Install frontend npm packages (first run only)
3. Start the backend API server on **http://localhost:8000**
4. Start the frontend dev server on **http://localhost:5173**

Open **http://localhost:5173** in your browser.

## Stopping

```bash
./stop.sh
```

Or press `Ctrl+C` in the terminal running `start.sh`.

## Configuration

Copy `backend/.env.example` to `backend/.env` and add your Schwab API credentials:

```
SCHWAB_CLIENT_ID=your_app_key_here
SCHWAB_CLIENT_SECRET=your_secret_here
```

Schwab is used as the primary data source. If credentials are missing or the API fails, Yahoo Finance is used automatically as a fallback (no API key needed).

## Manual Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at **http://localhost:8000/docs**.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on **http://localhost:5173** with API requests proxied to the backend.

## Project Structure

```
backend/              Python FastAPI server
  app/
    models/           Pydantic data models (options, greeks, earnings, optimization)
    services/         Business logic
      greeks_engine   Black-Scholes-Merton computation (py_vollib)
      schwab_client   Schwab market data API
      yahoo_client    Yahoo Finance fallback
      data_provider   Auto-fallback provider with short interest enrichment
      payoff          Multi-leg P&L and Greeks aggregation
      optimizer       Strategy search and scoring engine
      earnings        Earnings dates and move analysis
      sentiment       WSB mention tracking (ApeWisdom)
      discovery       Market screeners (Yahoo Finance)
      analysis        Strike/expiry grid and contract scatter
    routers/          API endpoints
  tests/              pytest suite (Greeks engine + optimizer)
frontend/             React + TypeScript (Vite)
  src/
    components/
      Chart/          Payoff chart (Recharts)
      Greeks/         Greeks panel with surface, time decay, IV impact charts
      OptionsChain/   Chain table with earnings date annotations
      StrategyBuilder/ Leg editor, quick picker, strategy detection
      Comparison/     Heatmap + Galaxy 3D view (Plotly.js)
      Optimizer/      Strategy finder, suggestion cards, IV rank badge
      Earnings/       Earnings panel, move analysis chart
      Discovery/      Market movers, WSB sentiment, earnings calendar
    stores/           Zustand state management
    hooks/            Custom React hooks
    api/              API client functions
    types/            TypeScript type definitions
start.sh              Start both servers
stop.sh               Stop both servers
```

## Testing

```bash
# Backend (51 tests)
cd backend && source .venv/bin/activate && python -m pytest tests/ -v

# Frontend (51 tests)
cd frontend && npx vitest run
```
