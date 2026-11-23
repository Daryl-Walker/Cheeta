import type { DashboardSnapshot, MarketSummary } from "@cheeta/contracts";
import { MARKET_SOURCE_LABELS } from "@cheeta/contracts";
import { cents, money, timeAgo } from "../lib/api";
import { DEMO_ACCOUNTS } from "../lib/demo";

/**
 * Top horizontal strip — the market/account overview, scrolling side to
 * side like a Facebook Stories row. It does NOT live in the feed.
 */
export default function StatusStrip({
  snapshot,
  isDemo,
}: {
  snapshot: DashboardSnapshot;
  isDemo: boolean;
}) {
  const markets: MarketSummary[] = snapshot.markets.slice(0, 8);
  return (
    <section aria-label="Accounts and markets at a glance" className="mt-4">
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {DEMO_ACCOUNTS.map((account) => (
          <article
            key={account.name}
            className="w-60 shrink-0 rounded-2xl bg-slate-900 p-4 text-white shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{account.name}</p>
            <p className="mt-2 text-2xl font-extrabold">{money(account.balance)}</p>
            <p className="mt-1 text-xs text-slate-300">
              Cash {money(account.cash)} · Net {money(account.netValue)}
            </p>
            <p className="mt-3 text-xs font-semibold text-teal-300">
              {account.status} · {timeAgo(account.syncedAt)}
            </p>
          </article>
        ))}

        {markets.map((market) => (
          <article
            key={market.ticker}
            className="w-60 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{market.ticker} · {MARKET_SOURCE_LABELS[market.source ?? "kalshi"]}</p>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">{market.title}</p>
            <p className="mt-2 text-xl font-extrabold text-[#2563eb]">Yes {cents(market.yesBid)}</p>
            <p className="mt-1 text-xs text-slate-500">
              Vol {market.volume?.toLocaleString() ?? "—"} · {market.status}
            </p>
          </article>
        ))}

        {markets.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No markets yet — link Kalshi to see your markets here{isDemo ? " (demo data is on)." : "."}
          </p>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">Scroll sideways → for more accounts and markets.</p>
    </section>
  );
}
