import type { DashboardSnapshot, MarketSummary, PositionSummary } from "@cheeta/contracts";

export interface LinkedProvider {
  userId: string;
  provider: "kalshi";
  secretRef: string;
  linkedAt: string;
}

export interface AccountRead {
  currency: string;
  availableBalance: number;
  portfolioValue: number | null;
  positions: PositionSummary[];
  syncedAt: string;
}

export interface ProviderCredentials {
  apiKeyId: string;
  privateKeyPem: string;
}

export interface ReadOnlyProvider {
  readAccount(credentials: ProviderCredentials): Promise<AccountRead>;
  readMarkets(credentials: ProviderCredentials): Promise<MarketSummary[]>;
}

export interface Repository {
  getLink(userId: string, provider: "kalshi"): Promise<LinkedProvider | null>;
  saveLink(link: LinkedProvider): Promise<void>;
  removeLink(userId: string, provider: "kalshi"): Promise<void>;
  saveDashboard(userId: string, snapshot: DashboardSnapshot): Promise<void>;
  getDashboard(userId: string): Promise<DashboardSnapshot | null>;
}

export interface SecretStore {
  put(secretRef: string, credentials: ProviderCredentials): Promise<void>;
  get(secretRef: string): Promise<ProviderCredentials>;
  delete(secretRef: string): Promise<void>;
}
