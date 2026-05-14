import { describe, it, expect } from "vitest";
import { fmt, fmtDollar, fmtPct } from "./formatting";

describe("fmt", () => {
  it("formats numbers with default 2 decimals", () => {
    expect(fmt(3.41)).toBe("3.41");
    expect(fmt(100)).toBe("100.00");
  });

  it("formats with custom decimals", () => {
    expect(fmt(0.12345, 4)).toBe("0.1235");
  });

  it("returns dash for null/undefined/NaN", () => {
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
    expect(fmt(NaN)).toBe("—");
  });
});

describe("fmtDollar", () => {
  it("formats with dollar sign", () => {
    expect(fmtDollar(3.41)).toBe("$3.41");
    expect(fmtDollar(0.5)).toBe("$0.50");
  });

  it("returns dash for null/undefined/NaN", () => {
    expect(fmtDollar(null)).toBe("—");
    expect(fmtDollar(undefined)).toBe("—");
    expect(fmtDollar(NaN)).toBe("—");
  });
});

describe("fmtPct", () => {
  it("formats decimal as percentage", () => {
    expect(fmtPct(0.205)).toBe("20.5%");
    expect(fmtPct(1.5)).toBe("150.0%");
  });

  it("returns dash for null/undefined/NaN", () => {
    expect(fmtPct(null)).toBe("—");
    expect(fmtPct(undefined)).toBe("—");
    expect(fmtPct(NaN)).toBe("—");
  });
});
