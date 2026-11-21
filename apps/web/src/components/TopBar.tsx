import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { isHttpUrl, loadSocialLinks, saveSocialLinks, SOCIAL_LABELS, type SocialLinks, type SocialNetwork } from "../lib/social";
import { timeAgo } from "../lib/api";

const TABS = [
  { to: "/", label: "Dashboard" },
  { to: "/positions", label: "Positions" },
  { to: "/markets", label: "Markets" },
  { to: "/analytics", label: "Analytics" },
];

export default function TopBar({
  query,
  onQuery,
  onRefresh,
  busy,
  syncedAt,
  isDemo,
  onSignOut,
}: {
  query: string;
  onQuery: (value: string) => void;
  onRefresh: () => void;
  busy: boolean;
  syncedAt: string | null;
  isDemo: boolean;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [links, setLinks] = useState<SocialLinks>(() => loadSocialLinks());
  const [saved, setSaved] = useState(false);

  function saveLinks() {
    saveSocialLinks(links);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-lg font-extrabold text-white">C</span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">cheeta</span>
        </Link>

        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search markets…"
          aria-label="Search markets"
          className="hidden w-64 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb] md:block"
        />

        <nav className="mx-auto hidden items-center gap-1 sm:flex" aria-label="Main">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-semibold ${isActive ? "bg-blue-50 text-[#2563eb]" : "text-slate-600 hover:bg-slate-100"}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {isDemo && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">Demo data</span>
          )}
          <span className="hidden text-xs text-slate-500 lg:block">
            {syncedAt ? `Synced ${timeAgo(syncedAt)}` : "Not synced yet"}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
              aria-expanded={menuOpen}
              aria-label="Account and social links"
            >
              D
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                <p className="text-sm font-bold text-slate-900">Your profile</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Link your social profiles so people can find you from Cheeta.
                  Links are stored only in this browser — no social login, and
                  Cheeta never posts to these accounts.
                </p>
                {(Object.keys(SOCIAL_LABELS) as SocialNetwork[]).map((network) => (
                  <label key={network} className="mt-3 block">
                    <span className="text-xs font-semibold text-slate-700">{SOCIAL_LABELS[network]} profile URL</span>
                    <input
                      value={links[network]}
                      onChange={(e) => setLinks({ ...links, [network]: e.target.value })}
                      placeholder={`https://…/${network === "x" ? "your-handle" : "your-page"}`}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                    {links[network] && !isHttpUrl(links[network]) && (
                      <span className="text-[11px] text-red-600">Enter a full https:// link.</span>
                    )}
                  </label>
                ))}
                <button
                  type="button"
                  onClick={saveLinks}
                  className="mt-3 w-full rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save social links
                </button>
                {saved && <p className="mt-2 text-xs text-teal-700">Saved in this browser.</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(SOCIAL_LABELS) as SocialNetwork[]).map((network) =>
                    isHttpUrl(links[network]) ? (
                      <a
                        key={network}
                        href={links[network]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        {SOCIAL_LABELS[network]} ↗
                      </a>
                    ) : null,
                  )}
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
