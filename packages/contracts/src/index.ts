export type ProviderId = "kalshi";

/** Where a market came from. Kalshi is the linked account provider;
 * Polymarket and SX Bet are extra read-only public feeds (Milestone 1).
 * Absent means Kalshi (older snapshots / demo data predate the field). */
export type MarketSource = "kalshi" | "polymarket" | "sxbet";

export const MARKET_SOURCE_LABELS: Record<MarketSource, string> = {
  kalshi: "Kalshi",
  polymarket: "Polymarket",
  sxbet: "SX Bet",
};

export interface AccountSummary {
  provider: ProviderId;
  currency: string;
  availableBalance: number;
  portfolioValue: number | null;
  syncedAt: string;
  positions: PositionSummary[];
}

export interface PositionSummary {
  ticker: string;
  marketTitle: string;
  position: number;
  marketExposure: number | null;
  realizedPnl: number | null;
}

export interface MarketSummary {
  ticker: string;
  title: string;
  subtitle: string | null;
  status: string;
  yesBid: number | null;
  yesAsk: number | null;
  volume: number | null;
  openInterest: number | null;
  closeTime: string | null;
  /** Data source. Defaults to "kalshi" when absent. */
  source?: MarketSource;
}

export interface DashboardSnapshot {
  account: AccountSummary;
  markets: MarketSummary[];
}

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  capabilities: readonly ["account.read", "markets.read"];
}

export const API_ROUTES = {
  health: "/health",
  providers: "/api/providers",
  kalshiLink: "/api/providers/kalshi/link",
  dashboard: "/api/account/dashboard"
} as const;
