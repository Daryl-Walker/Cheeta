import type { DashboardSnapshot, MarketSource } from "@cheeta/contracts";
import type { ExternalFeedStatus, ExternalSource } from "./external-markets";
import { sourceOf } from "./compare";

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
  /** Live/unavailable per extra source; Kalshi comes via the Cheeta API. */
  externalStatus: Record<ExternalSource, ExternalFeedStatus>;
}

export function filterMarkets(snapshot: DashboardSnapshot, query: string, source: SourceFilter = "all") {
  const q = query.trim().toLowerCase();
  return snapshot.markets.filter((m) => {
    if (source !== "all" && sourceOf(m) !== source) return false;
    if (!q) return true;
    return m.title.toLowerCase().includes(q) || m.ticker.toLowerCase().includes(q);
  });
}
