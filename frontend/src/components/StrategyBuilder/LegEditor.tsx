import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStrategyStore } from "../../stores/strategyStore";
import type { OptionLeg } from "../../types/option";

export function LegEditor() {
  const addLeg = useStrategyStore((s) => s.addLeg);
  const [optionType, setOptionType] = useState<"call" | "put" | "stock">("call");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [strike, setStrike] = useState("");
  const [expiration, setExpiration] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [premium, setPremium] = useState("");

  const handleAdd = () => {
    const leg: OptionLeg = {
      id: uuidv4(),
      optionType: optionType,
      action,
      strike: optionType === "stock" ? null : parseFloat(strike) || 0,
      expiration: optionType === "stock" ? null : expiration || null,
      quantity: parseInt(quantity) || 1,
      premium: parseFloat(premium) || 0,
      iv: null,
    };
    addLeg(leg);
    // Reset form
    setStrike("");
    setPremium("");
    setQuantity("1");
  };

  return (
    <div className="leg-editor">
      <h3>Add Leg</h3>
      <div className="leg-form">
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={optionType} onChange={(e) => setOptionType(e.target.value as "call" | "put" | "stock")}>
              <option value="call">Call</option>
              <option value="put">Put</option>
              <option value="stock">Stock</option>
            </select>
          </div>
          <div className="form-group">
            <label>Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value as "buy" | "sell")}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
        </div>
        {optionType !== "stock" && (
          <div className="form-row">
            <div className="form-group">
              <label>Strike</label>
              <input type="number" value={strike} onChange={(e) => setStrike(e.target.value)} placeholder="Strike price" />
            </div>
            <div className="form-group">
              <label>Expiration</label>
              <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} />
            </div>
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>{optionType === "stock" ? "Shares" : "Contracts"}</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
          </div>
          <div className="form-group">
            <label>{optionType === "stock" ? "Cost Basis" : "Premium"}</label>
            <input type="number" value={premium} onChange={(e) => setPremium(e.target.value)} placeholder="Per share" step="0.01" />
          </div>
        </div>
        <button className="btn-add" onClick={handleAdd}>
          Add {action === "buy" ? "Long" : "Short"} {optionType === "stock" ? "Stock" : optionType.charAt(0).toUpperCase() + optionType.slice(1)}
        </button>
      </div>
    </div>
  );
}
