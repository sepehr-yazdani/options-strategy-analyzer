import type { OptionLeg, PayoffResponse } from "../types/option";
import { apiFetch } from "./client";

interface PayoffRequestBody {
  legs: {
    id: string;
    option_type: string;
    action: string;
    strike: number | null;
    expiration: string | null;
    quantity: number;
    premium: number;
    iv: number | null;
  }[];
  underlying_price: number;
  price_range?: [number, number];
  time_horizons?: number[];
}

function toSnakeCase(leg: OptionLeg) {
  return {
    id: leg.id,
    option_type: leg.optionType,
    action: leg.action,
    strike: leg.strike,
    expiration: leg.expiration,
    quantity: leg.quantity,
    premium: leg.premium,
    iv: leg.iv,
  };
}

export function fetchPayoff(
  legs: OptionLeg[],
  underlyingPrice: number,
  priceRange?: [number, number],
  timeHorizons?: number[]
): Promise<PayoffResponse> {
  const body: PayoffRequestBody = {
    legs: legs.map(toSnakeCase),
    underlying_price: underlyingPrice,
  };
  if (priceRange) body.price_range = priceRange;
  if (timeHorizons) body.time_horizons = timeHorizons;

  return apiFetch<PayoffResponse>("/strategy/payoff", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
