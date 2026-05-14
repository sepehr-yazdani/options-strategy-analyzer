import { describe, it, expect } from "vitest";
import { detectStrategy } from "./strategyDetector";
import type { OptionLeg } from "../types/option";

function leg(overrides: Partial<OptionLeg>): OptionLeg {
  return {
    id: "1",
    optionType: "call",
    action: "buy",
    strike: 100,
    expiration: "2026-04-17",
    quantity: 1,
    premium: 1,
    iv: null,
    ...overrides,
  };
}

describe("detectStrategy", () => {
  it("returns null for empty legs", () => {
    expect(detectStrategy([])).toBeNull();
  });

  it("detects Long Call", () => {
    const result = detectStrategy([leg({ optionType: "call", action: "buy" })]);
    expect(result?.name).toBe("Long Call");
  });

  it("detects Long Put", () => {
    const result = detectStrategy([leg({ optionType: "put", action: "buy" })]);
    expect(result?.name).toBe("Long Put");
  });

  it("detects Naked Call", () => {
    const result = detectStrategy([leg({ optionType: "call", action: "sell" })]);
    expect(result?.name).toBe("Naked Call");
  });

  it("detects Covered Call", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "stock", action: "buy", strike: null, premium: 100, quantity: 100 }),
      leg({ id: "2", optionType: "call", action: "sell", strike: 105 }),
    ]);
    expect(result?.name).toBe("Covered Call");
  });

  it("detects Protective Put", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "stock", action: "buy", strike: null, premium: 100, quantity: 100 }),
      leg({ id: "2", optionType: "put", action: "buy", strike: 95 }),
    ]);
    expect(result?.name).toBe("Protective Put");
  });

  it("detects Collar", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "stock", action: "buy", strike: null, premium: 100, quantity: 100 }),
      leg({ id: "2", optionType: "put", action: "buy", strike: 95 }),
      leg({ id: "3", optionType: "call", action: "sell", strike: 105 }),
    ]);
    expect(result?.name).toBe("Collar");
  });

  it("detects Long Straddle", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "buy", strike: 100 }),
      leg({ id: "2", optionType: "put", action: "buy", strike: 100 }),
    ]);
    expect(result?.name).toBe("Long Straddle");
  });

  it("detects Short Straddle", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "sell", strike: 100 }),
      leg({ id: "2", optionType: "put", action: "sell", strike: 100 }),
    ]);
    expect(result?.name).toBe("Short Straddle");
  });

  it("detects Long Strangle", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "buy", strike: 105 }),
      leg({ id: "2", optionType: "put", action: "buy", strike: 95 }),
    ]);
    expect(result?.name).toBe("Long Strangle");
  });

  it("detects Short Strangle", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "sell", strike: 105 }),
      leg({ id: "2", optionType: "put", action: "sell", strike: 95 }),
    ]);
    expect(result?.name).toBe("Short Strangle");
  });

  it("detects Bull Call Spread", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "buy", strike: 100 }),
      leg({ id: "2", optionType: "call", action: "sell", strike: 110 }),
    ]);
    expect(result?.name).toBe("Bull Call Spread");
  });

  it("detects Bear Call Spread", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "buy", strike: 110 }),
      leg({ id: "2", optionType: "call", action: "sell", strike: 100 }),
    ]);
    expect(result?.name).toBe("Bear Call Spread");
  });

  it("detects Bear Put Spread", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "put", action: "buy", strike: 110 }),
      leg({ id: "2", optionType: "put", action: "sell", strike: 100 }),
    ]);
    expect(result?.name).toBe("Bear Put Spread");
  });

  it("detects Bull Put Spread", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "put", action: "buy", strike: 100 }),
      leg({ id: "2", optionType: "put", action: "sell", strike: 110 }),
    ]);
    expect(result?.name).toBe("Bull Put Spread");
  });

  it("detects Iron Condor", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "put", action: "buy", strike: 90 }),
      leg({ id: "2", optionType: "put", action: "sell", strike: 95 }),
      leg({ id: "3", optionType: "call", action: "sell", strike: 105 }),
      leg({ id: "4", optionType: "call", action: "buy", strike: 110 }),
    ]);
    expect(result?.name).toBe("Iron Condor");
  });

  it("detects Iron Butterfly", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "put", action: "buy", strike: 90 }),
      leg({ id: "2", optionType: "put", action: "sell", strike: 100 }),
      leg({ id: "3", optionType: "call", action: "sell", strike: 100 }),
      leg({ id: "4", optionType: "call", action: "buy", strike: 110 }),
    ]);
    expect(result?.name).toBe("Iron Butterfly");
  });

  it("detects Call Butterfly", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "buy", strike: 95 }),
      leg({ id: "2", optionType: "call", action: "sell", strike: 100, quantity: 2 }),
      leg({ id: "3", optionType: "call", action: "buy", strike: 105 }),
    ]);
    expect(result?.name).toBe("Call Butterfly");
  });

  it("returns Custom Strategy for unrecognized combos", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "buy", strike: 100 }),
      leg({ id: "2", optionType: "call", action: "buy", strike: 105 }),
    ]);
    expect(result?.name).toBe("Custom Strategy");
  });

  it("detects Calendar Spread", () => {
    const result = detectStrategy([
      leg({ id: "1", optionType: "call", action: "sell", strike: 100, expiration: "2026-04-17" }),
      leg({ id: "2", optionType: "call", action: "buy", strike: 100, expiration: "2026-05-15" }),
    ]);
    expect(result?.name).toBe("Calendar Spread");
  });
});
