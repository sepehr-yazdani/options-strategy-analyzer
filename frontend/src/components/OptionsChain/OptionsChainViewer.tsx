import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStrategyStore } from "../../stores/strategyStore";
import { ExpirationSelector } from "./ExpirationSelector";
import { fmt, fmtDollar, fmtPct } from "../../utils/formatting";
import type { StrikeData } from "../../types/option";

interface ViewerProps {
  earningsDate?: string | null;
}

export function OptionsChainViewer({ earningsDate }: ViewerProps = {}) {
  const chain = useStrategyStore((s) => s.chain);
  const addLeg = useStrategyStore((s) => s.addLeg);
  const isLoading = useStrategyStore((s) => s.isLoadingChain);
  const [selectedExp, setSelectedExp] = useState<string | null>(null);

  if (isLoading) return <div className="chain-loading">Loading chain...</div>;
  if (!chain) return null;

  const expData = chain.expirations.find((e) => e.expiration === selectedExp);

  const handleAddFromChain = (
    strike: StrikeData,
    optionType: "call" | "put",
    action: "buy" | "sell"
  ) => {
    addLeg({
      id: uuidv4(),
      optionType,
      action,
      strike: strike.strike,
      expiration: selectedExp,
      quantity: 1,
      premium: action === "buy" ? strike.ask : strike.bid,
      iv: strike.iv,
    });
  };

  return (
    <div className="chain-viewer">
      <ExpirationSelector
        expirations={chain.expirations}
        selected={selectedExp}
        onSelect={setSelectedExp}
        earningsDate={earningsDate}
      />
      {expData && (
        <div className="chain-table-wrapper">
          <table className="chain-table">
            <thead>
              <tr>
                <th colSpan={5} className="calls-header">CALLS</th>
                <th className="strike-header">Strike</th>
                <th colSpan={5} className="puts-header">PUTS</th>
              </tr>
              <tr>
                <th>Bid</th>
                <th>Ask</th>
                <th>Vol</th>
                <th>OI</th>
                <th>IV</th>
                <th></th>
                <th>Bid</th>
                <th>Ask</th>
                <th>Vol</th>
                <th>OI</th>
                <th>IV</th>
              </tr>
            </thead>
            <tbody>
              {expData.calls.map((call, i) => {
                const put = expData.puts[i];
                return (
                  <tr
                    key={call.strike}
                    className={call.inTheMoney ? "itm" : "otm"}
                  >
                    <td
                      className="clickable"
                      onClick={() => handleAddFromChain(call, "call", "buy")}
                      title="Buy call"
                    >
                      {fmt(call.bid)}
                    </td>
                    <td
                      className="clickable"
                      onClick={() => handleAddFromChain(call, "call", "sell")}
                      title="Sell call"
                    >
                      {fmt(call.ask)}
                    </td>
                    <td>{call.volume ?? 0}</td>
                    <td>{call.openInterest ?? 0}</td>
                    <td>{fmtPct(call.iv)}</td>
                    <td className="strike-col">{fmtDollar(call.strike)}</td>
                    {put && (
                      <>
                        <td
                          className="clickable"
                          onClick={() => handleAddFromChain(put, "put", "buy")}
                          title="Buy put"
                        >
                          {fmt(put.bid)}
                        </td>
                        <td
                          className="clickable"
                          onClick={() => handleAddFromChain(put, "put", "sell")}
                          title="Sell put"
                        >
                          {fmt(put.ask)}
                        </td>
                        <td>{put.volume ?? 0}</td>
                        <td>{put.openInterest ?? 0}</td>
                        <td>{fmtPct(put.iv)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
