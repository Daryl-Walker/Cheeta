import { Link, NavLink } from "react-router-dom";

export default function Sidebar({
  linked,
  watchlist,
}: {
  linked: boolean;
  watchlist: string[];
}) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label="Primary">
      <nav className="space-y-1">
        {[
          { to: "/", label: "Dashboard", end: true },
          { to: "/positions", label: "Positions", end: false },
          { to: "/markets", label: "Markets", end: false },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-2.5 text-sm font-semibold ${isActive ? "bg-blue-50 text-[#2563eb]" : "text-slate-700 hover:bg-white"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kalshi</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{linked ? "Connected" : "Not linked"}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {linked
            ? "Read-only. Cheeta can view balances, positions, and markets."
            : "Link a read-only Kalshi account to replace demo data with your live data."}
        </p>
        <Link to="/markets" className="mt-3 inline-block text-sm font-semibold text-[#2563eb]">
          {linked ? "View markets →" : "Connect Kalshi →"}
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Watchlists</p>
        {watchlist.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No watchlists yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {watchlist.map((item) => (
              <li key={item} className="text-sm font-medium text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
