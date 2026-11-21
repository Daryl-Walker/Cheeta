import { Link } from "react-router-dom";
import { cents } from "../lib/api";
import type { DashboardProps } from "../lib/app-state";
import { OddsTable, priceHistory, Sparkline } from "../components/AnalyticsCharts";

/** Analytics tab: odds, compare bets, what's trending. */
export default function AnalyticsPage({ snapshot, isDemo }: DashboardProps) {
  const markets = snapshot.markets;
  const trending = [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 5);
  const top = trending[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">
          Odds, comparisons, and what&apos;s trending across your markets.
          {isDemo ? " Demo data — connect the real API to see live odds." : ""}
        </p>
      </div>

      {top && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Trending now: {top.title}</h2>
          <p className="text-sm text-slate-500">
            Highest volume ({top.volume?.toLocaleString() ?? "—"}) · Yes {cents(top.yesBid)}
          </p>
          <div className="mt-3">
            <Sparkline values={priceHistory(top)} label={`Yes price history for ${top.title}`} />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Illustrative shape only — the API does not provide historical prices
            yet. Click any market below to open its detail view.
          </p>
          <Link to={`/bet/${encodeURIComponent(top.ticker)}`} className="mt-2 inline-block text-sm font-semibold text-[#2563eb]">
            Open {top.ticker} → Analytics &amp; Info
          </Link>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold text-slate-900">What&apos;s trending</h2>
        <ul className="mt-3 space-y-2">
          {trending.map((m, i) => (
            <li key={m.ticker} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <span>
                <span className="mr-2 font-extrabold text-slate-400">#{i + 1}</span>
                <Link to={`/bet/${encodeURIComponent(m.ticker)}`} className="font-semibold text-slate-900 hover:text-[#2563eb]">{m.title}</Link>
              </span>
              <span className="font-bold text-[#2563eb]">Yes {cents(m.yesBid)} · Vol {m.volume?.toLocaleString() ?? "—"}</span>
            </li>
          ))}
          {trending.length === 0 && <li className="text-sm text-slate-500">No markets yet.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Compare bets — odds</h2>
        <p className="text-sm text-slate-500">Yes / No prices and implied Yes % side by side.</p>
        <div className="mt-3"><OddsTable markets={markets} /></div>
      </section>
    </div>
  );
}
