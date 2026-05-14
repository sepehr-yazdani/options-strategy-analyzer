import type {
  GreeksSurfaceResponse,
  TimeDecayResponse,
  IvImpactResponse,
} from "../types/greeks";
import { apiFetch } from "./client";

export function fetchGreeksSurface(params: {
  option_type: string;
  strike: number;
  expiration: string;
  iv: number;
  underlying_price: number;
}): Promise<GreeksSurfaceResponse> {
  return apiFetch<GreeksSurfaceResponse>("/greeks/surface", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchTimeDecay(params: {
  option_type: string;
  strike: number;
  dte: number;
  iv: number;
  underlying_price: number;
}): Promise<TimeDecayResponse> {
  return apiFetch<TimeDecayResponse>("/greeks/time-decay", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchIvImpact(params: {
  option_type: string;
  strike: number;
  dte: number;
  underlying_price: number;
}): Promise<IvImpactResponse> {
  return apiFetch<IvImpactResponse>("/greeks/iv-impact", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
