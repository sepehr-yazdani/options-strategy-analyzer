import { v4 as uuidv4 } from "uuid";
import { useStrategyStore } from "../../stores/strategyStore";
import type { OptionLeg, ExpirationData } from "../../types/option";

interface StrategyTemplate {
  name: string;
  description: string;
  buildLegs: (atm: number, expiration: string, chainExp: ExpirationData | null) => OptionLeg[];
}

function findClosestStrike(strikes: number[], target: number): number {
  return strikes.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

function findStrikeData(chainExp: ExpirationData | null, strike: number, type: "call" | "put") {
  if (!chainExp) return null;
  const list = type === "call" ? chainExp.calls : chainExp.puts;
  return list.find((s) => s.strike === strike) ?? null;
}

function getAvailableStrikes(chainExp: ExpirationData | null): number[] {
  if (!chainExp) return [];
  return chainExp.calls.map((c) => c.strike);
}

const TEMPLATES: StrategyTemplate[] = [
  {
    name: "Long Straddle",
    description: "Buy ATM call + put. Profit from big moves.",
    buildLegs: (atm, exp, chainExp) => {
      const strikes = getAvailableStrikes(chainExp);
      const strike = strikes.length ? findClosestStrike(strikes, atm) : atm;
      const callData = findStrikeData(chainExp, strike, "call");
      const putData = findStrikeData(chainExp, strike, "put");
      return [
        { id: uuidv4(), optionType: "call", action: "buy", strike, expiration: exp, quantity: 1, premium: callData?.ask ?? 0, iv: callData?.iv ?? null },
        { id: uuidv4(), optionType: "put", action: "buy", strike, expiration: exp, quantity: 1, premium: putData?.ask ?? 0, iv: putData?.iv ?? null },
      ];
    },
  },
  {
    name: "Short Straddle",
    description: "Sell ATM call + put. Profit if price stays flat.",
    buildLegs: (atm, exp, chainExp) => {
      const strikes = getAvailableStrikes(chainExp);
      const strike = strikes.length ? findClosestStrike(strikes, atm) : atm;
      const callData = findStrikeData(chainExp, strike, "call");
      const putData = findStrikeData(chainExp, strike, "put");
      return [
        { id: uuidv4(), optionType: "call", action: "sell", strike, expiration: exp, quantity: 1, premium: callData?.bid ?? 0, iv: callData?.iv ?? null },
        { id: uuidv4(), optionType: "put", action: "sell", strike, expiration: exp, quantity: 1, premium: putData?.bid ?? 0, iv: putData?.iv ?? null },
      ];
    },
  },
  {
    name: "Long Strangle",
    description: "Buy OTM call + put. Cheaper than straddle.",
    buildLegs: (atm, exp, chainExp) => {
      const strikes = getAvailableStrikes(chainExp);
      if (strikes.length < 2) {
        return [
          { id: uuidv4(), optionType: "call", action: "buy", strike: atm * 1.05, expiration: exp, quantity: 1, premium: 0, iv: null },
          { id: uuidv4(), optionType: "put", action: "buy", strike: atm * 0.95, expiration: exp, quantity: 1, premium: 0, iv: null },
        ];
      }
      const atmStrike = findClosestStrike(strikes, atm);
      const otmCallStrike = strikes.find((s) => s > atmStrike) ?? atmStrike;
      const otmPutStrike = [...strikes].reverse().find((s) => s < atmStrike) ?? atmStrike;
      const callData = findStrikeData(chainExp, otmCallStrike, "call");
      const putData = findStrikeData(chainExp, otmPutStrike, "put");
      return [
        { id: uuidv4(), optionType: "call", action: "buy", strike: otmCallStrike, expiration: exp, quantity: 1, premium: callData?.ask ?? 0, iv: callData?.iv ?? null },
        { id: uuidv4(), optionType: "put", action: "buy", strike: otmPutStrike, expiration: exp, quantity: 1, premium: putData?.ask ?? 0, iv: putData?.iv ?? null },
      ];
    },
  },
  {
    name: "Bull Call Spread",
    description: "Buy lower call, sell higher call. Bullish.",
    buildLegs: (atm, exp, chainExp) => {
      const strikes = getAvailableStrikes(chainExp);
      if (strikes.length < 2) {
        return [
          { id: uuidv4(), optionType: "call", action: "buy", strike: atm, expiration: exp, quantity: 1, premium: 0, iv: null },
          { id: uuidv4(), optionType: "call", action: "sell", strike: atm * 1.05, expiration: exp, quantity: 1, premium: 0, iv: null },
        ];
      }
      const buyStrike = findClosestStrike(strikes, atm);
      const sellStrike = strikes.find((s) => s > buyStrike) ?? buyStrike;
      const buyData = findStrikeData(chainExp, buyStrike, "call");
      const sellData = findStrikeData(chainExp, sellStrike, "call");
      return [
        { id: uuidv4(), optionType: "call", action: "buy", strike: buyStrike, expiration: exp, quantity: 1, premium: buyData?.ask ?? 0, iv: buyData?.iv ?? null },
        { id: uuidv4(), optionType: "call", action: "sell", strike: sellStrike, expiration: exp, quantity: 1, premium: sellData?.bid ?? 0, iv: sellData?.iv ?? null },
      ];
    },
  },
  {
    name: "Bear Put Spread",
    description: "Buy higher put, sell lower put. Bearish.",
    buildLegs: (atm, exp, chainExp) => {
      const strikes = getAvailableStrikes(chainExp);
      if (strikes.length < 2) {
        return [
          { id: uuidv4(), optionType: "put", action: "buy", strike: atm, expiration: exp, quantity: 1, premium: 0, iv: null },
          { id: uuidv4(), optionType: "put", action: "sell", strike: atm * 0.95, expiration: exp, quantity: 1, premium: 0, iv: null },
        ];
      }
      const buyStrike = findClosestStrike(strikes, atm);
      const sellStrike = [...strikes].reverse().find((s) => s < buyStrike) ?? buyStrike;
      const buyData = findStrikeData(chainExp, buyStrike, "put");
      const sellData = findStrikeData(chainExp, sellStrike, "put");
      return [
        { id: uuidv4(), optionType: "put", action: "buy", strike: buyStrike, expiration: exp, quantity: 1, premium: buyData?.ask ?? 0, iv: buyData?.iv ?? null },
        { id: uuidv4(), optionType: "put", action: "sell", strike: sellStrike, expiration: exp, quantity: 1, premium: sellData?.bid ?? 0, iv: sellData?.iv ?? null },
      ];
    },
  },
  {
    name: "Iron Condor",
    description: "Sell OTM put spread + call spread. Neutral.",
    buildLegs: (atm, exp, chainExp) => {
      const strikes = getAvailableStrikes(chainExp);
      if (strikes.length < 4) {
        const w = atm * 0.05;
        return [
          { id: uuidv4(), optionType: "put", action: "buy", strike: atm - 2 * w, expiration: exp, quantity: 1, premium: 0, iv: null },
          { id: uuidv4(), optionType: "put", action: "sell", strike: atm - w, expiration: exp, quantity: 1, premium: 0, iv: null },
          { id: uuidv4(), optionType: "call", action: "sell", strike: atm + w, expiration: exp, quantity: 1, premium: 0, iv: null },
          { id: uuidv4(), optionType: "call", action: "buy", strike: atm + 2 * w, expiration: exp, quantity: 1, premium: 0, iv: null },
        ];
      }
      const atmIdx = strikes.indexOf(findClosestStrike(strikes, atm));
      const shortPutIdx = Math.max(0, atmIdx - 1);
      const longPutIdx = Math.max(0, shortPutIdx - 1);
      const shortCallIdx = Math.min(strikes.length - 1, atmIdx + 1);
      const longCallIdx = Math.min(strikes.length - 1, shortCallIdx + 1);
      return [
        { id: uuidv4(), optionType: "put", action: "buy", strike: strikes[longPutIdx], expiration: exp, quantity: 1, premium: findStrikeData(chainExp, strikes[longPutIdx], "put")?.ask ?? 0, iv: null },
        { id: uuidv4(), optionType: "put", action: "sell", strike: strikes[shortPutIdx], expiration: exp, quantity: 1, premium: findStrikeData(chainExp, strikes[shortPutIdx], "put")?.bid ?? 0, iv: null },
        { id: uuidv4(), optionType: "call", action: "sell", strike: strikes[shortCallIdx], expiration: exp, quantity: 1, premium: findStrikeData(chainExp, strikes[shortCallIdx], "call")?.bid ?? 0, iv: null },
        { id: uuidv4(), optionType: "call", action: "buy", strike: strikes[longCallIdx], expiration: exp, quantity: 1, premium: findStrikeData(chainExp, strikes[longCallIdx], "call")?.ask ?? 0, iv: null },
      ];
    },
  },
  {
    name: "Covered Call",
    description: "Buy stock + sell OTM call. Income strategy.",
    buildLegs: (atm, exp, chainExp) => {
      const strikes = getAvailableStrikes(chainExp);
      const atmStrike = strikes.length ? findClosestStrike(strikes, atm) : atm;
      const otmStrike = strikes.find((s) => s > atmStrike) ?? atmStrike;
      const callData = findStrikeData(chainExp, otmStrike, "call");
      return [
        { id: uuidv4(), optionType: "stock", action: "buy", strike: null, expiration: null, quantity: 100, premium: atm, iv: null },
        { id: uuidv4(), optionType: "call", action: "sell", strike: otmStrike, expiration: exp, quantity: 1, premium: callData?.bid ?? 0, iv: callData?.iv ?? null },
      ];
    },
  },
];

export function QuickStrategyPicker() {
  const chain = useStrategyStore((s) => s.chain);
  const currentPrice = useStrategyStore((s) => s.currentPrice);
  const clearLegs = useStrategyStore((s) => s.clearLegs);
  const addLeg = useStrategyStore((s) => s.addLeg);

  const handleSelect = (template: StrategyTemplate) => {
    if (currentPrice <= 0) return;

    // Use first expiration from chain if available
    const firstExp = chain?.expirations[0] ?? null;
    const expStr = firstExp?.expiration ?? "";
    const legs = template.buildLegs(currentPrice, expStr, firstExp);

    clearLegs();
    legs.forEach((leg) => addLeg(leg));
  };

  if (currentPrice <= 0) return null;

  return (
    <div className="quick-picker">
      <h3>Quick Strategies</h3>
      <div className="strategy-buttons">
        {TEMPLATES.map((t) => (
          <button
            key={t.name}
            className="strategy-btn"
            onClick={() => handleSelect(t)}
            title={t.description}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
