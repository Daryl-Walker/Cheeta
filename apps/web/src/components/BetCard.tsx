import { useState } from "react";
import { Link } from "react-router-dom";
import type { MarketSummary, PositionSummary } from "@cheeta/contracts";
import { cents, money } from "../lib/api";
import { sourceLabel, sourceOf } from "../lib/compare";
import { formatPayout, riskBand, RISK_LABELS } from "../lib/risk";
import { authorForTicker } from "../lib/social";
import FollowButton from "./FollowButton";
import ShareMenu from "./ShareMenu";

export function BetCard({
  market,
  initialSide = "yes",
  initialStake = "10",
}: {
  market: MarketSummary;
  initialSide?: "yes" | "no";
  initialStake?: string;
}) {
  const [side, setSide] = useState<"yes" | "no">(initialSide);
  const [stake, setStake] = useState(initialStake);
  const price = side === "yes" ? market.yesBid : market.yesAsk !== null && market.yesBid !== null ? 1 - market.yesBid : null;
  const author = authorForTicker(market.ticker);
  const band = riskBand(market);
  const badgeClass =
    band === "low"
      ? "bg-teal-50 text-teal-800"
      : band === "high"
        ? "bg-violet-50 text-violet-800"
        : band === "medium"
          ? "bg-amber-50 text-amber-800"
          : "bg-slate-100 text-slate-500";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14b8a6] text-sm font-bold text-white">
          {author.name[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {author.name} <span className="font-medium text-slate-500">{author.handle}</span>
          </p>
          <p className="truncate text-xs text-slate-500">{author.bio} · sample trader</p>
        </div>
        <FollowButton trader={author} compact />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {market.ticker} · {market.status}
          </p>
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#2563eb]">
            {sourceLabel(market)}
          </span>{" "}
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass}`}>
            {RISK_LABELS[band]}
          </span>
          <h3 className="mt-1 text-base font-bold text-slate-900">
            <Link to={`/bet/${encodeURIComponent(market.ticker)}`} className="hover:text-[#2563eb] hover:underline">
              {market.title}
            </Link>
          </h3>
          {market.subtitle && <p className="mt-0.5 text-xs text-slate-500">{market.subtitle}</p>}
          <Link to={`/bet/${encodeURIComponent(market.ticker)}`} className="mt-1 inline-block text-xs font-semibold text-[#2563eb]">
            View details — Analytics &amp; Info →
          </Link>
        </div>
        <ShareMenu marketTitle={market.title} ticker={market.ticker} side={side} stake={stake} />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setSide("yes")}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${side === "yes" ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-800"}`}
        >
          Yes {cents(market.yesBid)}
        </button>
        <button
          type="button"
          onClick={() => setSide("no")}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${side === "no" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800"}`}
        >
          No {market.yesBid !== null ? `${Math.round((1 - market.yesBid) * 100)}¢` : "—"}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Volume {market.volume?.toLocaleString() ?? "—"} · Open interest {market.openInterest?.toLocaleString() ?? "—"}
        {market.closeTime ? ` · Closes ${new Date(market.closeTime).toLocaleDateString()}` : ""}
      </p>
      {market.yesBid !== null ? (
        <p className="mt-1 text-xs text-slate-500">
          Payout per $1: Yes {cents(market.yesBid)} pays {formatPayout(market.yesBid)} if Yes wins · No{" "}
          {Math.round((1 - market.yesBid) * 100)}¢ pays {formatPayout(1 - market.yesBid)} if No wins.
          {band === "low" ? " Low risk means the favourite is at 80% or higher — that is not a guarantee." : ""}
          {band === "high" ? " High payout means high risk — this is a long shot." : ""}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          No payout shown — this market has no live price.
        </p>
      )}
      {sourceOf(market) === "sxbet" && market.yesBid === null && (
        <p className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] leading-4 text-slate-500">
          No live price: SX Bet&apos;s public listing carries no prices, and its
          priced feed needs a free API key that Milestone 1 does not use. This
          market is shown for the event only — no price is guessed.
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <span className="text-xs font-semibold text-slate-500">Stake $</span>
          <input
            value={stake}
            onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            aria-label={`Stake for ${market.title}`}
            className="w-full text-sm font-semibold outline-none"
          />
        </label>
        <span className="text-xs text-slate-500">
          {price !== null && stake ? `≈ ${money(Number(stake) * price)} to win` : "Enter a stake"}
        </span>
      </div>

      <button
        type="button"
        disabled
        title="Live bet placement is Milestone 2 — there is no order API yet."
        className="mt-3 w-full cursor-not-allowed rounded-xl bg-slate-200 px-3 py-2.5 text-sm font-bold text-slate-500"
      >
        Place bet — coming soon (Milestone 2)
      </button>
      <p className="mt-2 text-[11px] leading-4 text-slate-400">
        Milestone 1 is read-only: this shows live prices and a stake, but does not
        place an order. No order API exists yet.
      </p>
    </article>
  );
}

export function PositionCard({ position }: { position: PositionSummary }) {
  const pnl = position.realizedPnl ?? 0;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{position.ticker}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{position.marketTitle}</h3>
        </div>
        <ShareMenu marketTitle={position.marketTitle} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div><dt className="text-xs text-slate-500">Position</dt><dd className="font-bold">{position.position}</dd></div>
        <div><dt className="text-xs text-slate-500">Exposure</dt><dd className="font-bold">{money(position.marketExposure)}</dd></div>
        <div><dt className="text-xs text-slate-500">Realised P&amp;L</dt><dd className={`font-bold ${pnl >= 0 ? "text-teal-700" : "text-red-600"}`}>{money(pnl)}</dd></div>
      </dl>
    </article>
  );
}
