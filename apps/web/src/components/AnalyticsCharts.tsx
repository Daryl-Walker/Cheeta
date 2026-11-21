import { Link } from "react-router-dom";
import type { MarketSummary } from "@cheeta/contracts";
import { cents } from "../lib/api";

/** Deterministic pseudo-history so the chart is stable per market. */
export function priceHistory(market: MarketSummary, points = 24): number[] {
  let seed = 0;
  for (const ch of market.ticker) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
  const base = market.yesBid ?? 0.5;
  const out: number[] = [];
  let value = Math.max(0.05, Math.min(0.95, base - 0.08));
  for (let i = 0; i < points; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const step = (seed / 2147483648 - 0.5) * 0.06;
    value = Math.max(0.03, Math.min(0.97, value + step + (base - value) * 0.15));
    out.push(value);
  }
  out[points - 1] = base;
  return out;
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 560;
  const h = 140;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 8 - ((v - min) / range) * (h - 16)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={label}>
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={w} cy={h - 8 - ((values[values.length - 1] - min) / range) * (h - 16)} r="4" fill="#2563eb" />
    </svg>
  );
}

export function OddsTable({ markets, currentTicker }: { markets: MarketSummary[]; currentTicker?: string }) {
  const rows = [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3">Market</th>
            <th className="px-4 py-3 text-right">Yes</th>
            <th className="px-4 py-3 text-right">No</th>
            <th className="px-4 py-3 text-right">Implied Yes %</th>
            <th className="px-4 py-3 text-right">Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.ticker} className={`border-b border-slate-100 last:border-0 ${m.ticker === currentTicker ? "bg-blue-50" : ""}`}>
              <td className="px-4 py-3">
                <Link to={`/bet/${encodeURIComponent(m.ticker)}`} className="font-semibold text-[#2563eb] hover:underline">
                  {m.title}
                </Link>
                <span className="block text-xs text-slate-500">{m.ticker}</span>
              </td>
              <td className="px-4 py-3 text-right font-bold text-teal-700">{cents(m.yesBid)}</td>
              <td className="px-4 py-3 text-right font-bold text-rose-700">
                {m.yesBid !== null ? `${Math.round((1 - m.yesBid) * 100)}¢` : "—"}
              </td>
              <td className="px-4 py-3 text-right">{m.yesBid !== null ? `${Math.round(m.yesBid * 100)}%` : "—"}</td>
              <td className="px-4 py-3 text-right">{m.volume?.toLocaleString() ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
