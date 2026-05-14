export function fmt(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return "—";
  return value.toFixed(decimals);
}

export function fmtDollar(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return "—";
  return `$${value.toFixed(decimals)}`;
}

export function fmtPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}
