import type { DashboardSnapshot } from "@cheeta/contracts";

export interface DashboardProps {
  snapshot: DashboardSnapshot;
  isDemo: boolean;
  query: string;
  linked: boolean;
  busy: boolean;
  error: string | null;
  onLink: (apiKeyId: string, privateKeyPem: string) => Promise<void>;
  onUnlink: () => Promise<void>;
}

export function filterMarkets(snapshot: DashboardSnapshot, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return snapshot.markets;
  return snapshot.markets.filter(
    (m) => m.title.toLowerCase().includes(q) || m.ticker.toLowerCase().includes(q),
  );
}
