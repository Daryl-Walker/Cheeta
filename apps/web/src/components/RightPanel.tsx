import { Link } from "react-router-dom";
import type { DashboardSnapshot } from "@cheeta/contracts";
import { cents, money } from "../lib/api";
import { sourceLabel } from "../lib/compare";
import { compareHighestPayout, formatPayout, riskBand } from "../lib/risk";
import { DEMO_TRADERS } from "../lib/social";
import FollowButton from "./FollowButton";

export default function RightPanel({
  snapshot,
  isDemo,
}: {
  snapshot: DashboardSnapshot;
  isDemo: boolean;
}) {
  const { account, markets } = snapshot;
  const totalPnl = account.positions.reduce((sum, p) => sum + (p.realizedPnl ?? 0), 0);
  // Risky bets sidebar: underdog Yes <= 30¢ (riskBand "high"), biggest
  // payout first. SX Bet markets have no price, so riskBand is "noprice"
  // for them and they never appear here — no price is ever guessed.
  const riskyBets = [...markets]
    .filter((m) => riskBand(m) === "high")
    .sort(compareHighestPayout)
    .slice(0, 6);
  const topMovers = [...markets]
    .filter((m) => m.yesBid !== null && m.yesAsk !== null)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, 4);

  return (
    <aside className="hidden w-64 shrink-0 space-y-4 lg:block xl:w-72" aria-label="Risky bets sidebar">
      {/* Risky bets — high payout: FIRST in the right sidebar, odds first
          on every card. Clicking a card opens that bet's detail page. */}
      <section className="rounded-2xl border border-violet-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Risky bets — high payout</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          Underdogs that could pay out big. High payout means high risk —
          these are long shots, not safe bets.
        </p>
        <ul className="mt-3 space-y-2">
          {riskyBets.map((m) => (
            <li key={m.ticker}>
              <Link
                to={`/bet/${encodeURIComponent(m.ticker)}`}
                className="block rounded-xl border border-violet-100 bg-violet-50/60 p-3 hover:border-violet-300 hover:bg-violet-50"
              >
                {/* Odds FIRST, big: price, then payout per $1. */}
                <p className="text-xl font-extrabold leading-6 text-violet-800">
                  Yes {cents(m.yesBid)} · pays {formatPayout(m.yesBid)} per $1
                </p>
                <p className="mt-1 text-sm font-bold leading-5 text-slate-900">{m.title}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  {sourceLabel(m)}{m.volume ? ` · Vol ${m.volume.toLocaleString()}` : ""}
                </p>
              </Link>
            </li>
          ))}
          {riskyBets.length === 0 && (
            <li className="text-sm text-slate-500">No high-payout bets right now.</li>
          )}
        </ul>
        <p className="mt-3 text-[11px] leading-4 text-slate-400">
          Underdog Yes at 30¢ or less, biggest payout first, across Kalshi,
          Polymarket and SX Bet. See the full list under the Highest Payout
          tab in the feed.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Account summary</p>
        <p className="mt-2 text-3xl font-extrabold text-slate-900">{money(account.availableBalance)}</p>
        <p className="mt-1 text-sm text-slate-500">Available balance · {account.currency}</p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Portfolio value</dt><dd className="font-semibold">{money(account.portfolioValue)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Total realised P&amp;L</dt><dd className={`font-semibold ${totalPnl >= 0 ? "text-teal-700" : "text-red-600"}`}>{money(totalPnl)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Open positions</dt><dd className="font-semibold">{account.positions.length}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top movers</p>
        <ul className="mt-2 space-y-2">
          {topMovers.map((m) => (
            <li key={m.ticker} className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{m.ticker}</span>
              <span className="font-bold text-[#2563eb]">Yes {cents(m.yesBid)}</span>
            </li>
          ))}
          {topMovers.length === 0 && <li className="text-sm text-slate-500">No markets yet.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Provider health</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">Kalshi — {account.provider === "kalshi" ? "Connected" : "Unknown"}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Last sync {new Date(account.syncedAt).toLocaleString()}.
          {isDemo ? " Demo data — connect the real API to see live syncs." : " Live data from the Cheeta API."}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Traders to follow</p>
        <ul className="mt-3 space-y-3">
          {DEMO_TRADERS.map((trader) => (
            <li key={trader.handle} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#14b8a6] text-sm font-bold text-white">
                {trader.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {trader.name} <span className="font-medium text-slate-500">{trader.handle}</span>
                </p>
                <p className="truncate text-xs text-slate-500">{trader.bio}</p>
              </div>
              <FollowButton trader={trader} compact />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-4 text-slate-400">
          Sample traders and follower counts — following inside Cheeta is UI
          only in Milestone 1. Follows are kept in this browser; a real
          follow backend and activity feed are Milestone 2.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Social — first pass</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Share a market from the feed (title only, your choice, never automatic)
          and link your Facebook, TikTok, and X profiles from the menu in the top
          bar. No social login yet — follow / friends / activity feeds are a
          later milestone.
        </p>
      </section>
    </aside>
  );
}
