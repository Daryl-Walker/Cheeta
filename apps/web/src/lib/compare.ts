import type { MarketSummary, MarketSource } from "@cheeta/contracts";
import { MARKET_SOURCE_LABELS } from "@cheeta/contracts";

/**
 * Cross-source best-odds comparison (read-only).
 *
 * Every price is normalised to cents (0–100): Yes cents = yesBid × 100,
 * No cents = (1 − yesBid) × 100. "Best Yes" means the CHEAPEST Yes price
 * (lowest Yes cents); "best No" means the cheapest No price (lowest No
 * cents, i.e. the highest Yes price). A market with no price (SX Bet in
 * Milestone 1 — its keyless listing carries no prices) can be listed as a
 * match but can never be highlighted as best.
 *
 * MATCHING — the hard part, kept deliberately strict:
 * - Titles are lowercased, punctuation stripped, stop-words dropped.
 * - Sports ("Team A vs Team B"): a match needs BOTH teams' distinctive
 *   names (the last word of each team name, e.g. "cowboys" + "eagles")
 *   present in the other title, AND the event dates within 3 days when
 *   both dates are known.
 * - Everything else: at least 2 shared content words AND a token
 *   overlap (Jaccard) of 0.4 or more, AND the close dates within 14 days
 *   when both are known.
 * - Matches are only ever across DIFFERENT sources.
 * - Anything below that bar is NOT shown as a comparison — the market is
 *   shown singly. A false match would be worse than no match, so when in
 *   doubt this code says "no match".
 *
 * LIMITS (shown in the UI, not hidden): matching is text-based, so two
 * differently-worded markets about the same event can be missed, and two
 * similar-looking markets (e.g. the same question asked for different
 * dates) can still slip through if their dates are close. Prices are a
 * snapshot from each source's last fetch, not a live tick. Best price is
 * NOT best value: fees, liquidity/depth, expiry and settlement rules
 * differ by source, and the comparison never claims a guaranteed profit
 * or arbitrage.
 */

export function sourceOf(market: MarketSummary): MarketSource {
  return market.source ?? "kalshi";
}

export function sourceLabel(market: MarketSummary): string {
  return MARKET_SOURCE_LABELS[sourceOf(market)];
}

export interface ComparisonRow {
  market: MarketSummary;
  yesCents: number | null;
  noCents: number | null;
  matchedBy: "teams" | "title";
}

export interface BestOdds {
  rows: ComparisonRow[];
  bestYes: ComparisonRow | null;
  bestNo: ComparisonRow | null;
  /** Highest Yes cents minus lowest Yes cents, across priced rows. */
  spreadYesCents: number | null;
}

const STOPWORDS = new Set([
  "will", "the", "a", "an", "and", "or", "of", "to", "in", "on", "by", "for",
  "at", "is", "be", "are", "does", "do", "win", "wins", "beat", "beats",
  "vs", "versus", "this", "that", "it", "its", "with", "from", "after",
  "before", "over", "under", "above", "below", "end", "year", "week",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentTokens(title: string): string[] {
  return normalize(title)
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/** "Dallas Cowboys vs Philadelphia Eagles" -> ["dallas cowboys", "philadelphia eagles"] */
function teamsOf(title: string): string[] | null {
  const parts = normalize(title).split(/\s+vs\s+/);
  if (parts.length !== 2) return null;
  const [a, b] = parts.map((p) => p.trim());
  if (!a || !b) return null;
  return [a, b];
}

/** Distinctive word of a team name: the last word ("cowboys", "eagles"). */
function teamKey(team: string): string {
  const words = team.split(" ").filter(Boolean);
  return words[words.length - 1] ?? team;
}

function daysApart(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  if (Number.isNaN(ms)) return null;
  return ms / 86_400_000;
}

function teamsMatch(a: MarketSummary, b: MarketSummary): boolean {
  const ta = teamsOf(a.title);
  const tb = teamsOf(b.title);
  if (!ta || !tb) return false;
  const keysA = ta.map(teamKey);
  const keysB = new Set(tb.map(teamKey));
  // Both teams must line up (order does not matter: home/away can flip).
  if (!keysA.every((k) => keysB.has(k))) return false;
  const gap = daysApart(a.closeTime, b.closeTime);
  return gap === null || gap <= 3;
}

function titleMatch(a: MarketSummary, b: MarketSummary): boolean {
  const tokensA = new Set(contentTokens(a.title));
  const tokensB = new Set(contentTokens(b.title));
  const shared = [...tokensA].filter((t) => tokensB.has(t));
  if (shared.length < 2) return false;
  const union = new Set([...tokensA, ...tokensB]);
  if (shared.length / union.size < 0.4) return false;
  const gap = daysApart(a.closeTime, b.closeTime);
  return gap === null || gap <= 14;
}

function matchKind(a: MarketSummary, b: MarketSummary): "teams" | "title" | null {
  if (sourceOf(a) === sourceOf(b)) return null;
  if (teamsMatch(a, b)) return "teams";
  if (titleMatch(a, b)) return "title";
  return null;
}

function toRow(market: MarketSummary, matchedBy: "teams" | "title"): ComparisonRow {
  const yesCents = market.yesBid !== null ? Math.round(market.yesBid * 100) : null;
  return {
    market,
    yesCents,
    noCents: yesCents !== null ? 100 - yesCents : null,
    matchedBy,
  };
}

/** All high-confidence cross-source matches for `market`, plus itself. */
export function findBestOdds(market: MarketSummary, all: MarketSummary[]): BestOdds {
  const rows: ComparisonRow[] = [toRow(market, "title")];
  for (const other of all) {
    if (other.ticker === market.ticker) continue;
    const kind = matchKind(market, other);
    if (kind) rows.push(toRow(other, kind));
  }
  const priced = rows.filter((r) => r.yesCents !== null);
  const bestYes =
    priced.length > 0
      ? priced.reduce((best, r) => (r.yesCents! < best.yesCents! ? r : best))
      : null;
  const bestNo =
    priced.length > 0
      ? priced.reduce((best, r) => (r.noCents! < best.noCents! ? r : best))
      : null;
  const spreadYesCents =
    priced.length > 1
      ? Math.max(...priced.map((r) => r.yesCents!)) - Math.min(...priced.map((r) => r.yesCents!))
      : null;
  return { rows, bestYes, bestNo, spreadYesCents };
}
