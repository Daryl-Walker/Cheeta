import { Link } from "react-router-dom";
import { BetCard, PositionCard } from "../components/BetCard";
import KalshiLinkForm from "../components/KalshiLinkForm";
import { filterMarkets, type DashboardProps, type SourceFilter } from "../lib/app-state";
import { EXTERNAL_SOURCE_LABELS, type ExternalSource } from "../lib/external-markets";
import { sourceOf } from "../lib/compare";
import { riskBand, type FeedFilter } from "../lib/risk";

const SOURCE_TABS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All sources" },
  { id: "kalshi", label: "Kalshi" },
  { id: "polymarket", label: "Polymarket" },
  { id: "sxbet", label: "SX Bet" },
];

/**
 * Feed tabs — exactly these four, in this order. Each tab swaps the
 * whole feed. They combine with the source tabs above.
 * - All: every market, default order.
 * - Low Risk: only low-risk bets (favourite outcome >= 80%).
 * - Highest Payout: only underdog bets (Yes <= 30¢), highest payout
 *   first ($1 pays the most first).
 * - Trending: highest volume first, cross-source.
 * Markets with no price (SX Bet's keyless listing) are excluded from
 * Low Risk and Highest Payout — there is no price to judge them by —
 * and appear under Trending only when they have volume.
 */
const FEED_TABS: { id: FeedFilter; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Every market." },
  { id: "low", label: "Low Risk", hint: "Only low-risk bets: the favourite outcome is at 80% or higher. High probability is not a guarantee — favourites can still lose." },
  { id: "high", label: "Highest Payout", hint: "Only the highest-payout bets: underdog Yes at 30¢ or less, highest payout first. High payout means high risk — these are long shots." },
  { id: "trending", label: "Trending", hint: "Most volume first, across all sources — where the most money is moving right now." },
];

export default function DashboardPage(props: DashboardProps) {
  const { snapshot, isDemo, query, linked, busy, error, onLink, sourceFilter, onSourceFilter, feedFilter, onFeedFilter, externalStatus } = props;
  const markets = filterMarkets(snapshot, query, sourceFilter, feedFilter);
  const counts = {
    all: snapshot.markets.length,
    kalshi: snapshot.markets.filter((m) => sourceOf(m) === "kalshi").length,
    polymarket: snapshot.markets.filter((m) => sourceOf(m) === "polymarket").length,
    sxbet: snapshot.markets.filter((m) => sourceOf(m) === "sxbet").length,
  } as Record<SourceFilter, number>;
  const feedCounts: Record<FeedFilter, number> = {
    all: snapshot.markets.length,
    low: snapshot.markets.filter((m) => riskBand(m) === "low").length,
    high: snapshot.markets.filter((m) => riskBand(m) === "high").length,
    trending: snapshot.markets.filter((m) => m.volume && m.volume > 0).length,
  };
  const unavailable = (Object.keys(externalStatus) as ExternalSource[]).filter(
    (s) => externalStatus[s] === "unavailable",
  );
  const activeFeedTab = FEED_TABS.find((t) => t.id === feedFilter) ?? FEED_TABS[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Feed</h1>
        <p className="text-sm text-slate-500">
          The main place you interact with Cheeta — bet cards and your open
          positions. Account and market status lives in the strip above, not here.
          Kalshi is your linked account; Polymarket and SX Bet are extra
          read-only public feeds.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter feed by source">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={sourceFilter === tab.id}
            onClick={() => onSourceFilter(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${sourceFilter === tab.id ? "bg-[#2563eb] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
          >
            {tab.label} · {counts[tab.id]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter feed by risk and trending">
        {FEED_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={feedFilter === tab.id}
            onClick={() => onFeedFilter(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${feedFilter === tab.id ? "bg-[#0f766e] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
          >
            {tab.label} · {feedCounts[tab.id]}
          </button>
        ))}
      </div>
      <p className="text-xs leading-5 text-slate-500">{activeFeedTab.hint}</p>
      {(feedFilter === "low" || feedFilter === "high") && (
        <p className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          Markets with no price are not shown here: SX Bet&apos;s public listing
          carries no prices, so there is nothing to judge their risk or payout
          by. They still show under All (and under Trending if they have volume).
        </p>
      )}

      {unavailable.length > 0 && (
        <p className="rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800" role="alert">
          Live data unavailable from {unavailable.map((s) => EXTERNAL_SOURCE_LABELS[s]).join(" and ")} —{" "}
          {unavailable.length === 2 ? "both extra feeds" : "that feed"} could not be reached, so the feed
          shows Kalshi{isDemo ? " demo" : ""} markets only. Nothing was removed; try Refresh to retry.
        </p>
      )}

      {markets.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No markets match “{query}”{sourceFilter === "all" ? "" : ` from ${SOURCE_TABS.find((t) => t.id === sourceFilter)?.label}`}{feedFilter === "all" ? "" : ` under ${activeFeedTab.label}`}.
        </p>
      )}

      {markets.map((market) => (
        <BetCard key={market.ticker} market={market} />
      ))}

      <h2 className="pt-2 text-lg font-bold text-slate-900">Your open positions</h2>
      {snapshot.account.positions.length === 0 ? (
        <p className="text-sm text-slate-500">No positions reported.</p>
      ) : (
        snapshot.account.positions.map((position) => (
          <PositionCard key={position.ticker} position={position} />
        ))
      )}

      {!linked && (
        <KalshiLinkForm onLink={onLink} busy={busy} error={error} />
      )}
      {isDemo && (
        <p className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          Demo data: the Cheeta API at {import.meta.env.VITE_API_URL ?? "http://localhost:4000"} was
          unreachable, so this page shows clearly-labeled sample markets and
          positions. Start the API and link Kalshi to see your live data.
          Polymarket and SX Bet above are live public feeds, not demo data.
        </p>
      )}
    </div>
  );
}
