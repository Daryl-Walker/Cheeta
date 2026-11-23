import { Link, useParams, useSearchParams } from "react-router-dom";
import { cents, money } from "../lib/api";
import type { DashboardProps } from "../lib/app-state";
import { findBestOdds, sourceLabel, sourceOf } from "../lib/compare";
import { OddsTable, priceHistory, Sparkline } from "../components/AnalyticsCharts";
import { BetCard } from "../components/BetCard";

/**
 * Bet detail view. Clicking a bet in the feed opens this page.
 * Tabs: Analytics (odds, trending, price history) and Info (event /
 * contract details, rules, expiry, volume).
 */
export default function BetDetailPage({ snapshot, isDemo }: DashboardProps) {
  const { ticker } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "info" ? "info" : "analytics";
  const market = snapshot.markets.find((m) => m.ticker === ticker);

  if (!market) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Bet not found</h1>
        <p className="text-sm text-slate-500">
          No market with ticker “{ticker}” in the current snapshot.
        </p>
        <Link to="/" className="text-sm font-semibold text-[#2563eb]">← Back to the feed</Link>
      </div>
    );
  }

  const history = priceHistory(market);
  const bestOdds = findBestOdds(market, snapshot.markets);
  const trending = [...snapshot.markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 5);
  const others = snapshot.markets.filter((m) => m.ticker !== market.ticker);
  // Shared-parlay links (?side=yes&stake=10) pre-fill the bet card below.
  const sharedSide = searchParams.get("side") === "no" ? "no" : "yes";
  const sharedStake = searchParams.get("stake") ?? "10";
  const sharedParlay = searchParams.has("side") || searchParams.has("stake");

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm font-semibold text-[#2563eb]">← Back to the feed</Link>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {market.ticker} · {market.status}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{market.title}</h1>
        {market.subtitle && <p className="mt-1 text-sm text-slate-500">{market.subtitle}</p>}
        <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#2563eb]">
          Source: {sourceLabel(market)}
        </span>{" "}
        {isDemo && <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">Demo data</span>}
        {sharedParlay && (
          <p className="mt-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">
            Shared parlay: this bet was pre-filled from a link a friend sent you
            ({sharedSide} · ${sharedStake} stake). Placing it is Milestone 2 —
            Milestone 1 is read-only.
          </p>
        )}
      </div>

      <BetCard market={market} initialSide={sharedSide} initialStake={sharedStake} />

      <div className="flex gap-2" role="tablist" aria-label="Bet detail tabs">
        {(["analytics", "info"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("tab", t);
              setSearchParams(next);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? "bg-[#2563eb] text-white" : "bg-white text-slate-700 border border-slate-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "analytics" ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Odds</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-teal-50 p-3"><dt className="text-xs text-teal-800">Yes</dt><dd className="text-xl font-extrabold text-teal-700">{cents(market.yesBid)}</dd></div>
              <div className="rounded-xl bg-rose-50 p-3"><dt className="text-xs text-rose-800">No</dt><dd className="text-xl font-extrabold text-rose-700">{market.yesBid !== null ? `${Math.round((1 - market.yesBid) * 100)}¢` : "—"}</dd></div>
              <div className="rounded-xl bg-blue-50 p-3"><dt className="text-xs text-blue-800">Implied Yes %</dt><dd className="text-xl font-extrabold text-[#2563eb]">{market.yesBid !== null ? `${Math.round(market.yesBid * 100)}%` : "—"}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-600">Yes ask</dt><dd className="text-xl font-extrabold">{cents(market.yesAsk)}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Best odds — compare sources</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              The same event on Kalshi, Polymarket and SX Bet, side by side.
              Prices are normalised to cents (0–100). Best Yes is the cheapest
              Yes price; best No is the cheapest No price. Matches are only
              shown when the titles and dates line up with high confidence —
              otherwise this market is shown on its own, never force-matched.
            </p>
            {bestOdds.rows.length > 1 ? (
              <>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-2 py-2">Source</th>
                        <th className="px-2 py-2 text-right">Yes</th>
                        <th className="px-2 py-2 text-right">No</th>
                        <th className="px-2 py-2 text-right">Volume</th>
                        <th className="px-2 py-2 text-right">Closes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestOdds.rows.map((row) => (
                        <tr key={row.market.ticker} className="border-b border-slate-100 last:border-0">
                          <td className="px-2 py-2">
                            <Link to={`/bet/${encodeURIComponent(row.market.ticker)}`} className="font-semibold text-[#2563eb] hover:underline">
                              {sourceLabel(row.market)}
                            </Link>
                            <span className="block text-xs text-slate-500">{row.market.ticker}</span>
                          </td>
                          <td className={`px-2 py-2 text-right font-bold ${bestOdds.bestYes === row ? "text-teal-700" : ""}`}>
                            {row.yesCents !== null ? `${row.yesCents}¢` : "—"}
                            {bestOdds.bestYes === row && <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-extrabold text-teal-800">BEST YES</span>}
                          </td>
                          <td className={`px-2 py-2 text-right font-bold ${bestOdds.bestNo === row ? "text-rose-700" : ""}`}>
                            {row.noCents !== null ? `${row.noCents}¢` : "—"}
                            {bestOdds.bestNo === row && <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-800">BEST NO</span>}
                          </td>
                          <td className="px-2 py-2 text-right">{row.market.volume?.toLocaleString() ?? "—"}</td>
                          <td className="px-2 py-2 text-right">{row.market.closeTime ? new Date(row.market.closeTime).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bestOdds.spreadYesCents !== null && (
                  <p className="mt-2 text-xs text-slate-500">
                    Yes spread across sources: {bestOdds.spreadYesCents}¢
                    {bestOdds.bestYes && bestOdds.bestYes.market.ticker !== market.ticker && market.yesBid !== null
                      ? ` — e.g. ${sourceLabel(market)} ${Math.round(market.yesBid * 100)}¢ vs ${sourceLabel(bestOdds.bestYes.market)} ${bestOdds.bestYes.yesCents}¢`
                      : ""}
                    .
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                No high-confidence match on the other sources — this event
                wasn&apos;t found with the same wording and date elsewhere, so
                it&apos;s shown on its own rather than force-matched.
              </p>
            )}
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Best price isn&apos;t always best value: fees, liquidity and
              depth, expiry and settlement rules differ by source, and prices
              here are a snapshot, not a live tick. This comparison never
              means a guaranteed profit — there is no arbitrage promise.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Price history — Yes price</h2>
            {market.yesBid !== null ? (
              <>
                <Sparkline values={history} label={`Yes price history for ${market.title}`} />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Illustrative shape only: the Cheeta API does not provide historical
                  prices yet, so this is a sample trend ending at the current Yes
                  price ({cents(market.yesBid)}), not real past prices.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                No price history — this market has no live price yet (SX Bet
                prices need an API key that Milestone 1 does not use), so
                there is no chart to draw.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">What&apos;s trending</h2>
            <p className="text-sm text-slate-500">Highest-volume markets right now.</p>
            <ul className="mt-3 space-y-2">
              {trending.map((m, i) => (
                <li key={m.ticker} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                  <span><span className="mr-2 font-extrabold text-slate-400">#{i + 1}</span>
                    <Link to={`/bet/${encodeURIComponent(m.ticker)}`} className="font-semibold text-slate-900 hover:text-[#2563eb]">{m.title}</Link>
                  </span>
                  <span className="font-bold text-[#2563eb]">Yes {cents(m.yesBid)} · Vol {m.volume?.toLocaleString() ?? "—"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Compare bets</h2>
            <p className="text-sm text-slate-500">This market against the other markets in the snapshot.</p>
            <div className="mt-3"><OddsTable markets={[market, ...others]} currentTicker={market.ticker} /></div>
          </section>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Info — event &amp; contract details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Event / market</dt><dd className="text-right font-semibold text-slate-900">{market.title}</dd></div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Ticker</dt><dd className="text-right font-semibold">{market.ticker}</dd></div>
            {market.subtitle && <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Details</dt><dd className="text-right font-semibold text-slate-900">{market.subtitle}</dd></div>}
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Status</dt><dd className="text-right font-semibold">{market.status}</dd></div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Closes / expiry</dt><dd className="text-right font-semibold">{market.closeTime ? new Date(market.closeTime).toLocaleString() : "—"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Volume</dt><dd className="text-right font-semibold">{market.volume?.toLocaleString() ?? "—"}</dd></div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">Open interest</dt><dd className="text-right font-semibold">{market.openInterest?.toLocaleString() ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Yes bid / ask</dt><dd className="text-right font-semibold">{cents(market.yesBid)} / {cents(market.yesAsk)}</dd></div>
          </dl>
          <h3 className="mt-5 text-sm font-bold text-slate-900">Rules</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {sourceOf(market) === "kalshi"
              ? `This market resolves under Kalshi's contract rules for ${market.ticker}. The Cheeta API does not return the full rule text yet, so the exact settlement wording is not shown here — check the market on Kalshi before placing a bet.`
              : sourceOf(market) === "polymarket"
                ? `This market resolves under Polymarket's market rules for ${market.ticker}. Cheeta shows the public listing only — check the full resolution wording on Polymarket before placing a bet.`
                : `This is a sports market on SX Bet (${market.ticker}). Cheeta shows the public listing only — check the event, teams and settlement rules on SX Bet before placing a bet.`}{" "}
            Milestone 1 is read-only: Cheeta cannot place
            or modify orders, and no bet is placed from this page.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Account exposure for this market: {money(snapshot.account.positions.find((p) => p.ticker === market.ticker)?.marketExposure ?? null)}.
          </p>
        </section>
      )}
    </div>
  );
}
