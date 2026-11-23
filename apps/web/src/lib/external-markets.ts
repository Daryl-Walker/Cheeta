import type { MarketSummary } from "@cheeta/contracts";

/**
 * Extra read-only public feeds — Polymarket and SX Bet — shown alongside
 * Kalshi in the web feed (Milestone 1). READ-ONLY: no trading, no wallet
 * signing, no order placement, no API keys or secrets anywhere here.
 *
 * Verified live 2026-11-23 (from this workspace):
 * - Polymarket Gamma API sends `access-control-allow-origin: *`, so the
 *   browser can fetch it directly. Its `/markets` endpoint is deprecated
 *   in favour of `/markets/keyset` (header: "use /markets/keyset",
 *   sunset 2026-05-01) but still answers; if it ever stops, switch the
 *   URL below to the keyset endpoint and keep the same field mapping.
 * - SX Bet sends NO `access-control-allow-origin` header, so a direct
 *   browser fetch is blocked by CORS. `fetchSxBetMarkets` therefore tries
 *   the direct URL first and falls back to the Vite dev proxy (`/sx`,
 *   a small dev-server middleware in apps/web/vite.config.ts that
 *   forwards to https://api.sx.bet). In a production build the proxy
 *   does not exist, so SX Bet falls back to the "unavailable" state and
 *   the feed keeps working without it — a same-origin proxy or
 *   server-side fetch is a follow-up, not a secret.
 * - SX Bet's keyless listing (`GET /markets/active`) carries NO prices:
 *   order-book snapshots and best odds need a free `x-sx-api-key`, which
 *   Milestone 1 deliberately does not use. SX Bet markets are therefore
 *   shown WITHOUT a price (yesBid/yesAsk null) — prices are never
 *   invented. They still take part in event matching (team names + date)
 *   for the best-odds comparison, but with no price they can never be
 *   highlighted as the best price.
 *
 * When a live fetch fails for any reason (network, CORS, the source is
 * down), the fetcher throws and the caller keeps the Kalshi/demo feed
 * visible with a clear "live data unavailable" state instead of crashing.
 */

const POLYMARKET_URL =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100";
const SX_BET_DIRECT_URL = "https://api.sx.bet/markets/active";
const SX_BET_PROXY_URL = "/sx/markets/active";

export type ExternalSource = "polymarket" | "sxbet";

export type ExternalFeedStatus = "loading" | "live" | "unavailable";

export const EXTERNAL_SOURCE_LABELS: Record<ExternalSource, string> = {
  polymarket: "Polymarket",
  sxbet: "SX Bet",
};

const MAX_MARKETS_PER_SOURCE = 20;

function parseJsonString(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${url}`);
  return (await res.json()) as unknown;
}

interface PolymarketMarket {
  id?: string | number;
  slug?: string;
  question?: string;
  outcomes?: unknown;
  outcomePrices?: unknown;
  volume24hr?: unknown;
  volumeNum?: unknown;
  endDate?: string;
}

/** Polymarket Gamma API — public, no key. Yes price = outcomePrices[Yes]. */
export async function fetchPolymarketMarkets(): Promise<MarketSummary[]> {
  const raw = await fetchJson(POLYMARKET_URL);
  if (!Array.isArray(raw)) throw new Error("Polymarket returned an unexpected response.");
  const markets = (raw as PolymarketMarket[])
    .map((m): MarketSummary | null => {
      const question = typeof m.question === "string" ? m.question.trim() : "";
      if (!question) return null;
      const outcomes = parseJsonString(m.outcomes);
      const prices = parseJsonString(m.outcomePrices).map((p) => toNumber(p));
      const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
      const yesBid = yesIndex >= 0 ? prices[yesIndex] ?? null : null;
      const slug = typeof m.slug === "string" && m.slug ? m.slug : String(m.id ?? "");
      if (!slug) return null;
      return {
        ticker: `PM-${slug}`,
        title: question,
        subtitle: "Polymarket",
        status: "open",
        yesBid,
        // No ask in the Gamma listing; No price is derived as 1 - Yes.
        yesAsk: yesBid !== null ? yesBid : null,
        volume: toNumber(m.volume24hr) ?? toNumber(m.volumeNum),
        openInterest: null,
        closeTime: typeof m.endDate === "string" ? m.endDate : null,
        source: "polymarket",
      };
    })
    .filter((m): m is MarketSummary => m !== null);
  // Busiest first, so the feed shows the markets people actually trade.
  markets.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  return markets.slice(0, MAX_MARKETS_PER_SOURCE);
}

interface SxBetMarket {
  status?: string;
  marketHash?: string;
  outcomeOneName?: string;
  outcomeTwoName?: string;
  teamOneName?: string;
  teamTwoName?: string;
  leagueLabel?: string;
  sportLabel?: string;
  gameTime?: number;
}

/**
 * SX Bet — public listing, no key. Sports only. The listing has team /
 * outcome names, league, sport and start time, but NO prices (see header
 * comment), so yesBid/yesAsk are null and the card shows "price unavailable".
 */
export async function fetchSxBetMarkets(): Promise<MarketSummary[]> {
  let raw: unknown;
  try {
    // Direct first (works anywhere CORS allows it); dev-proxy fallback
    // second (SX Bet sends no CORS headers, so the browser blocks direct).
    raw = await fetchJson(
      `${SX_BET_DIRECT_URL}?onlyMainLine=true&pageSize=50`,
    );
  } catch {
    raw = await fetchJson(`${SX_BET_PROXY_URL}?onlyMainLine=true&pageSize=50`);
  }
  const data = raw as { data?: { markets?: SxBetMarket[] } };
  const list = data?.data?.markets;
  if (!Array.isArray(list)) throw new Error("SX Bet returned an unexpected response.");
  const markets = list
    .filter((m) => m.status === "ACTIVE")
    .map((m): MarketSummary | null => {
      const one = m.outcomeOneName ?? m.teamOneName ?? "";
      const two = m.outcomeTwoName ?? m.teamTwoName ?? "";
      const hash = typeof m.marketHash === "string" ? m.marketHash : "";
      if (!one || !two || !hash) return null;
      const closeTime =
        typeof m.gameTime === "number" && m.gameTime > 0
          ? new Date(m.gameTime * 1000).toISOString()
          : null;
      return {
        ticker: `SX-${hash.replace(/^0x/, "").slice(0, 10)}`,
        title: `${one} vs ${two}`,
        subtitle: [m.leagueLabel, m.sportLabel, "SX Bet"].filter(Boolean).join(" · "),
        status: "open",
        // No price without an API key — never invented (see header).
        yesBid: null,
        yesAsk: null,
        volume: null,
        openInterest: null,
        closeTime,
        source: "sxbet",
      };
    })
    .filter((m): m is MarketSummary => m !== null);
  // Soonest games first.
  markets.sort((a, b) => (a.closeTime ?? "").localeCompare(b.closeTime ?? ""));
  return markets.slice(0, MAX_MARKETS_PER_SOURCE);
}

/** Fetch both extra feeds; each source fails independently. */
export async function fetchExternalMarkets(): Promise<{
  markets: MarketSummary[];
  status: Record<ExternalSource, ExternalFeedStatus>;
}> {
  const results = await Promise.allSettled([
    fetchPolymarketMarkets(),
    fetchSxBetMarkets(),
  ]);
  const markets: MarketSummary[] = [];
  const status: Record<ExternalSource, ExternalFeedStatus> = {
    polymarket: "unavailable",
    sxbet: "unavailable",
  };
  if (results[0].status === "fulfilled") {
    markets.push(...results[0].value);
    status.polymarket = "live";
  }
  if (results[1].status === "fulfilled") {
    markets.push(...results[1].value);
    status.sxbet = "live";
  }
  return { markets, status };
}
