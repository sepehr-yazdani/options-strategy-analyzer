import type { IvRankData } from "../../types/optimization";

const CLASS_COLORS: Record<string, string> = {
  low: "#34d399",
  neutral: "#fbbf24",
  high: "#f97316",
  extreme: "#ef4444",
};

interface Props {
  data: IvRankData;
}

export function IvRankBadge({ data }: Props) {
  const color = CLASS_COLORS[data.classification] || "#9ca3af";
  const pct = Math.round(data.ivRank * 100);

  return (
    <span className="iv-rank-badge" style={{ borderColor: color, color }}>
      IV Rank: {pct}%
      <span className="iv-rank-label">{data.classification}</span>
    </span>
  );
}
