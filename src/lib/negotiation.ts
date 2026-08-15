// Negotiation Arena (doc 9.3): cash/margin impact of a requested reduction,
// plus a fixed list of reciprocal value exchanges (rather than discounting
// without change).
import type { CommercialScenario } from "@/types/deal-twin";

export const VALUE_EXCHANGES = [
  "Reduce on-site delivery days",
  "Remove optional scope",
  "Change payment terms",
  "Increase advance payment",
  "Move training to train-the-trainer",
  "Extend timeline / phase the work",
  "Convert selected fixed-price items to time and materials",
] as const;
export type ValueExchange = (typeof VALUE_EXCHANGES)[number];

export type NegotiationImpact = {
  currentPrice: number;
  newPrice: number;
  cashImpact: number;
  currentMarginPct: number;
  newMarginPct: number;
};

export function computeNegotiationImpact(scenario: CommercialScenario, requestedReductionPct: number): NegotiationImpact {
  const newPrice = Math.round(scenario.customerPrice * (1 - requestedReductionPct / 100));
  const cashImpact = scenario.customerPrice - newPrice;
  const newMarginPct =
    newPrice > 0 ? Math.round(((newPrice - scenario.internalCost - scenario.travelExposure) / newPrice) * 1000) / 10 : 0;

  return {
    currentPrice: scenario.customerPrice,
    newPrice,
    cashImpact,
    currentMarginPct: scenario.grossMarginPct,
    newMarginPct,
  };
}
