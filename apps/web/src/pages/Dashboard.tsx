import { BetCard, PositionCard } from "../components/BetCard";
import KalshiLinkForm from "../components/KalshiLinkForm";
import { filterMarkets, type DashboardProps } from "../lib/app-state";

export default function DashboardPage(props: DashboardProps) {
  const { snapshot, isDemo, query, linked, busy, error, onLink } = props;
  const markets = filterMarkets(snapshot, query);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Feed</h1>
        <p className="text-sm text-slate-500">
          The main place you interact with Cheeta — bet cards and your open
          positions. Account and market status lives in the strip above, not here.
        </p>
      </div>

      {markets.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No markets match “{query}”.
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
        </p>
      )}
    </div>
  );
}
