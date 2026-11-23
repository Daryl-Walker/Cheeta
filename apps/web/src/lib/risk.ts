import type { MarketSummary } from "@cheeta/contracts";

/**
 * Risk bands for the feed filter (read-only, data display only).
 *
 * Risk is defined purely from the market's implied probability — the
 * price of the favourite outcome. It is NOT a prediction and NOT a
 * "safe bet" label: a high implied probability is still not a
 * guarantee, and an underdog can still lose. The UI says this wherever
 * the bands are shown.
 *
 * Bands (Yes price in cents; No price = 100 − Yes):
 * - "high" (High payout / high risk): Yes <= 30¢. A $1 Yes stake pays
 *   ~1 / price, so 22¢ pays ~$4.55 if Yes wins. This takes precedence
 *   over "low": a 12¢ Yes market is a long shot even though No is an
 *   88% favourite — the filter is about the payout on the Yes side.
 * - "low" (Low risk): the favourite outcome is >= 80% (max(Yes, No)
 *   >= 80%), and Yes is not a long shot (see above).
 * - "medium" (Medium risk): everything else with a price — favourite
 *   50–79%.
 * - "noprice": no price at all (yesBid null). SX Bet's keyless public
 *   listing carries no prices in Milestone 1, so those markets have no
 *   risk band: they show under All, and are EXCLUDED from the Low /
 *   Medium / High payout filters, with a note explaining why. No price
 *   is ever guessed for them.
 *
 * Payout math: $1 staked on an outcome priced at p (0 < p <= 1) pays
 * ~$1/p if that outcome wins (including the stake). E.g. Yes 22¢ ->
 * ~$4.55; No 78¢ -> ~$1.28.
 */

export type RiskFilter = "all" | "low" | "high";

/**
 * Feed filter tabs (exactly these, in this order in the UI):
 * All (default) / Low Risk / Highest Payout / Trending.
 * - "low": only low-risk bets (favourite >= 80%).
 * - "high": only highest-payout bets (underdog Yes <= 30¢), sorted by
 *   payout descending (lowest Yes price first = $1 pays the most).
 * - "trending": bets sorted by volume, highest first, cross-source.
 *   A market with no volume is excluded from Trending (it shows under
 *   All only). There is no separate "Medium" tab.
 * The source tabs (All / Kalshi / Polymarket / SX Bet) combine with
 * whichever of these is selected.
 */
export type FeedFilter = RiskFilter | "trending";

export type RiskBand = "low" | "medium" | "high" | "noprice";

export const RISK_LABELS: Record<RiskBand, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High payout / high risk",
  noprice: "No price",
};

/** Risk band for one market, or "noprice" when it has no price. */
export function riskBand(market: MarketSummary): RiskBand {
  if (market.yesBid === null || market.yesBid === undefined) return "noprice";
  // High payout first: a long-shot Yes is the payout Daryl is filtering for.
  if (market.yesBid <= 0.3) return "high";
  const favourite = Math.max(market.yesBid, 1 - market.yesBid);
  if (favourite >= 0.8) return "low";
  return "medium";
}

/** Does this market belong in the given risk filter? */
export function matchesRisk(market: MarketSummary, filter: RiskFilter): boolean {
  if (filter === "all") return true;
  return riskBand(market) === filter;
}

/** Sort key for the Highest Payout tab: lowest Yes price first (pays the most per $1). */
export function compareHighestPayout(a: MarketSummary, b: MarketSummary): number {
  return (a.yesBid ?? 1) - (b.yesBid ?? 1);
}

/** $1 staked on an outcome priced at `price` pays ~this much if it wins. Null when no price. */
export function payoutPerDollar(price: number | null): number | null {
  if (price === null || price === undefined || price <= 0) return null;
  return 1 / price;
}

export function formatPayout(price: number | null): string {
  const payout = payoutPerDollar(price);
  return payout === null ? "—" : `$${payout.toFixed(2)}`;
}

/** Top N markets by volume (highest first), ignoring markets with no volume. */
export function trendingMarkets(markets: MarketSummary[], limit = 5): MarketSummary[] {
  return [...markets]
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, limit);
}
