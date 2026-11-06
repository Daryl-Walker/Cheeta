export type ProviderId = "kalshi";

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
