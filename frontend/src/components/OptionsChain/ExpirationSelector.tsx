import type { ExpirationData } from "../../types/option";

interface Props {
  expirations: ExpirationData[];
  selected: string | null;
  onSelect: (exp: string) => void;
  earningsDate?: string | null;
}

export function ExpirationSelector({
  expirations,
  selected,
  onSelect,
  earningsDate,
}: Props) {
  return (
    <div className="expiration-selector">
      <label>Expiration</label>
      <select
        value={selected || ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Select expiration...</option>
        {expirations.map((exp) => {
          let tag = "";
          if (earningsDate) {
            if (exp.expiration < earningsDate) tag = " [pre-E]";
            else if (exp.expiration === earningsDate) tag = " [EARNINGS]";
            else tag = " [post-E]";
          }
          return (
            <option key={exp.expiration} value={exp.expiration}>
              {exp.expiration} ({exp.dte} DTE){tag}
            </option>
          );
        })}
      </select>
    </div>
  );
}
