import type { OptionLeg } from "../types/option";

interface DetectedStrategy {
  name: string;
  description: string;
}

export function detectStrategy(legs: OptionLeg[]): DetectedStrategy | null {
  if (legs.length === 0) return null;

  const options = legs.filter((l) => l.optionType !== "stock");
  const stocks = legs.filter((l) => l.optionType === "stock");
  const calls = options.filter((l) => l.optionType === "call");
  const puts = options.filter((l) => l.optionType === "put");
  const longCalls = calls.filter((l) => l.action === "buy");
  const shortCalls = calls.filter((l) => l.action === "sell");
  const longPuts = puts.filter((l) => l.action === "buy");
  const shortPuts = puts.filter((l) => l.action === "sell");

  const sameExpiry = options.length > 0 && options.every((l) => l.expiration === options[0].expiration);
  const allStrikes = options.map((l) => l.strike ?? 0).sort((a, b) => a - b);
  const uniqueStrikes = [...new Set(allStrikes)];

  // Single leg
  if (options.length === 1 && stocks.length === 0) {
    const leg = options[0];
    if (leg.optionType === "call" && leg.action === "buy") return { name: "Long Call", description: "Bullish bet with limited downside" };
    if (leg.optionType === "call" && leg.action === "sell") return { name: "Naked Call", description: "Bearish/neutral, unlimited risk" };
    if (leg.optionType === "put" && leg.action === "buy") return { name: "Long Put", description: "Bearish bet with limited downside" };
    if (leg.optionType === "put" && leg.action === "sell") return { name: "Naked Put", description: "Bullish/neutral, risk to zero" };
  }

  // Covered Call: long stock + short call
  if (stocks.length === 1 && stocks[0].action === "buy" && shortCalls.length === 1 && options.length === 1) {
    return { name: "Covered Call", description: "Income on stock position, caps upside" };
  }

  // Protective Put: long stock + long put
  if (stocks.length === 1 && stocks[0].action === "buy" && longPuts.length === 1 && options.length === 1) {
    return { name: "Protective Put", description: "Downside protection on stock position" };
  }

  // Collar: long stock + long put + short call
  if (stocks.length === 1 && stocks[0].action === "buy" && longPuts.length === 1 && shortCalls.length === 1 && options.length === 2) {
    return { name: "Collar", description: "Capped upside and downside on stock" };
  }

  if (!sameExpiry) {
    // Calendar spread: same strike, different expirations
    if (options.length === 2 && uniqueStrikes.length === 1) {
      const types = new Set(options.map((l) => l.optionType));
      if (types.size === 1) {
        return { name: "Calendar Spread", description: "Profit from time decay difference between expirations" };
      }
    }
    return { name: "Custom Strategy", description: `${legs.length} legs, mixed expirations` };
  }

  // Straddle: long call + long put, same strike
  if (longCalls.length === 1 && longPuts.length === 1 && options.length === 2 && uniqueStrikes.length === 1) {
    return { name: "Long Straddle", description: "Profit from large move in either direction" };
  }
  if (shortCalls.length === 1 && shortPuts.length === 1 && options.length === 2 && uniqueStrikes.length === 1) {
    return { name: "Short Straddle", description: "Profit if price stays near strike" };
  }

  // Strangle: long call + long put, different strikes
  if (longCalls.length === 1 && longPuts.length === 1 && options.length === 2 && uniqueStrikes.length === 2) {
    return { name: "Long Strangle", description: "Profit from large move, cheaper than straddle" };
  }
  if (shortCalls.length === 1 && shortPuts.length === 1 && options.length === 2 && uniqueStrikes.length === 2) {
    return { name: "Short Strangle", description: "Profit if price stays between strikes" };
  }

  // Vertical Spreads (2 legs, same type, different strikes)
  if (options.length === 2 && uniqueStrikes.length === 2) {
    if (longCalls.length === 1 && shortCalls.length === 1) {
      const buyStrike = longCalls[0].strike ?? 0;
      const sellStrike = shortCalls[0].strike ?? 0;
      if (buyStrike < sellStrike) return { name: "Bull Call Spread", description: "Bullish, limited risk and reward" };
      return { name: "Bear Call Spread", description: "Bearish/neutral credit spread" };
    }
    if (longPuts.length === 1 && shortPuts.length === 1) {
      const buyStrike = longPuts[0].strike ?? 0;
      const sellStrike = shortPuts[0].strike ?? 0;
      if (buyStrike > sellStrike) return { name: "Bear Put Spread", description: "Bearish, limited risk and reward" };
      return { name: "Bull Put Spread", description: "Bullish/neutral credit spread" };
    }
  }

  // Butterfly (3 strikes, 4 contracts: buy 1 low, sell 2 mid, buy 1 high)
  if (options.length === 3 && uniqueStrikes.length === 3) {
    const allCalls = calls.length === 3;
    const allPuts = puts.length === 3;
    if (allCalls || allPuts) {
      const sorted = [...options].sort((a, b) => (a.strike ?? 0) - (b.strike ?? 0));
      const low = sorted[0];
      const mid = sorted[1];
      const high = sorted[2];
      if (low.action === "buy" && mid.action === "sell" && high.action === "buy" && mid.quantity === 2) {
        return { name: `${allCalls ? "Call" : "Put"} Butterfly`, description: "Profit if price is near middle strike at expiry" };
      }
    }
  }

  // Iron Butterfly / Iron Condor (4 legs: long put, short put, short call, long call)
  if (options.length === 4 && shortPuts.length === 1 && longPuts.length === 1 && shortCalls.length === 1 && longCalls.length === 1) {
    // Iron Butterfly: short put and short call at same strike (check first — it's a special case of condor)
    if (shortPuts[0].strike === shortCalls[0].strike) {
      return { name: "Iron Butterfly", description: "Profit if price stays at short strike" };
    }
    const putStrikes = puts.map((l) => l.strike ?? 0).sort((a, b) => a - b);
    const callStrikes = calls.map((l) => l.strike ?? 0).sort((a, b) => a - b);
    if (putStrikes[1] <= callStrikes[0]) {
      return { name: "Iron Condor", description: "Profit if price stays between short strikes" };
    }
  }

  if (legs.length > 1) {
    return { name: "Custom Strategy", description: `${legs.length} legs` };
  }

  return null;
}
