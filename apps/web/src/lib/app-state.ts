import type { DashboardSnapshot, MarketSource } from "@cheeta/contracts";
import type { ExternalFeedStatus, ExternalSource } from "./external-markets";
import { sourceOf } from "./compare";
import { compareHighestPayout, matchesRisk, type FeedFilter } from "./risk";

export type SourceFilter = "all" | MarketSource;

export interface DashboardProps {
  snapshot: DashboardSnapshot;
  isDemo: boolean;
  query: string;
  linked: boolean;
  busy: boolean;
  error: string | null;
  onLink: (apiKeyId: string, privateKeyPem: string) => Promise<void>;
  onUnlink: () => Promise<void>;
  /** Which source the feed is filtered to ("all" = every source). */
  sourceFilter: SourceFilter;
  onSourceFilter: (filter: SourceFilter) => void;
  /** Feed tab: All / Low Risk / Highest Payout / Trending. Combines with the source filter. */
  feedFilter: FeedFilter;
  onFeedFilter: (filter: FeedFilter) => void;
  /** Live/unavailable per extra source; Kalshi comes via the Cheeta API. */
  externalStatus: Record<ExternalSource, ExternalFeedStatus>;
}

/**
 * Feed filtering: source + feed tab + search, combined.
 * - "all": every market, default order.
 * - "low": only low-risk markets (favourite >= 80%).
 * - "high": only highest-payout markets (Yes <= 30¢), lowest Yes price
 *   first, so $1 pays the most first.
 * - "trending": only markets with volume, highest volume first, cross-source.
 * Markets with no price are excluded from "low" and "high" (nothing to
 * judge them by); they can appear under "trending" only if they have volume.
 */
export function filterMarkets(
  snapshot: DashboardSnapshot,
  query: string,
  source: SourceFilter = "all",
  feedFilter: FeedFilter = "all",
) {
  const q = query.trim().toLowerCase();
  const markets = snapshot.markets.filter((m) => {
    if (source !== "all" && sourceOf(m) !== source) return false;
    if (feedFilter === "low" || feedFilter === "high") {
      if (!matchesRisk(m, feedFilter)) return false;
    }
    if (feedFilter === "trending" && !(m.volume && m.volume > 0)) return false;
    if (!q) return true;
    return m.title.toLowerCase().includes(q) || m.ticker.toLowerCase().includes(q);
  });
  if (feedFilter === "high") return [...markets].sort(compareHighestPayout);
  if (feedFilter === "trending") return [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  return markets;
}
