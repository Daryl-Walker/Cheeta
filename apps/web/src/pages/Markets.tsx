import { BetCard } from "../components/BetCard";
import KalshiLinkForm from "../components/KalshiLinkForm";
import { filterMarkets, type DashboardProps } from "../lib/app-state";

export default function MarketsPage(props: DashboardProps) {
  const { snapshot, query, linked, busy, error, onLink, onUnlink } = props;
  const markets = filterMarkets(snapshot, query);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Markets</h1>
          <p className="text-sm text-slate-500">
            Browse market snapshots. Use the search in the top bar to filter.
            {linked ? " Your Kalshi account is linked (read-only)." : " Link Kalshi below to replace demo data."}
          </p>
        </div>
        {linked && (
          <button
            type="button"
            onClick={() => void onUnlink()}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Unlink Kalshi
          </button>
        )}
      </div>

      {markets.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No markets match “{query}”.
        </p>
      )}
      {markets.map((market) => (
        <BetCard key={market.ticker} market={market} />
      ))}

      {!linked && <KalshiLinkForm onLink={onLink} busy={busy} error={error} />}
    </div>
  );
}
