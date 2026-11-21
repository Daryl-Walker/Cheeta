import type { DashboardSnapshot } from "@cheeta/contracts";

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function getToken(): string {
  return sessionStorage.getItem("cheeta-token") ?? "";
}

export function setToken(token: string): void {
  if (token) sessionStorage.setItem("cheeta-token", token);
  else sessionStorage.removeItem("cheeta-token");
}

function headers(): Record<string, string> {
  const token = getToken();
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDashboard(): Promise<DashboardSnapshot> {
  const res = await fetch(`${API_URL}/api/account/dashboard`, { headers: headers() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Dashboard refresh failed.");
  return body as DashboardSnapshot;
}

export async function linkKalshi(apiKeyId: string, privateKeyPem: string): Promise<DashboardSnapshot> {
  const res = await fetch(`${API_URL}/api/providers/kalshi/link`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ apiKeyId, privateKeyPem }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Could not link Kalshi.");
  return (body as { dashboard: DashboardSnapshot }).dashboard;
}

export async function unlinkKalshi(): Promise<void> {
  const res = await fetch(`${API_URL}/api/providers/kalshi/link`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok && res.status !== 204) throw new Error("Could not unlink Kalshi.");
}

export function money(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function cents(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 100)}¢`;
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}
