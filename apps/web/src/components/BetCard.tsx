import { useState } from "react";
import { Link } from "react-router-dom";
import type { MarketSummary, PositionSummary } from "@cheeta/contracts";
import { cents, money } from "../lib/api";
import ShareMenu from "./ShareMenu";

export function BetCard({ market }: { market: MarketSummary }) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [stake, setStake] = useState("10");
  const price = side === "yes" ? market.yesBid : market.yesAsk !== null && market.yesBid !== null ? 1 - market.yesBid : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {market.ticker} · {market.status}
          </p>
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
        <ShareMenu marketTitle={market.title} />
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
