import { PositionCard } from "../components/BetCard";
import { money } from "../lib/api";
import type { DashboardProps } from "../lib/app-state";

export default function PositionsPage({ snapshot }: DashboardProps) {
  const { account } = snapshot;
  const totalPnl = account.positions.reduce((sum, p) => sum + (p.realizedPnl ?? 0), 0);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Positions</h1>
        <p className="text-sm text-slate-500">
          Open positions and P&amp;L by market. Available balance {money(account.availableBalance)} ·
          Portfolio value {money(account.portfolioValue)} · Total realised P&amp;L {money(totalPnl)}.
        </p>
      </div>
      {account.positions.length === 0 ? (
        <p className="text-sm text-slate-500">No positions reported.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Exposure</th>
                  <th className="px-4 py-3 text-right">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {account.positions.map((p) => (
                  <tr key={p.ticker} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.marketTitle}</td>
                    <td className="px-4 py-3 text-slate-500">{p.ticker}</td>
                    <td className="px-4 py-3 text-right font-semibold">{p.position}</td>
                    <td className="px-4 py-3 text-right">{money(p.marketExposure)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${(p.realizedPnl ?? 0) >= 0 ? "text-teal-700" : "text-red-600"}`}>
                      {money(p.realizedPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {account.positions.map((position) => (
            <PositionCard key={position.ticker} position={position} />
          ))}
        </>
      )}
    </div>
  );
}
