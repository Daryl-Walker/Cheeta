import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import type { DashboardSnapshot } from "@cheeta/contracts";
import RightPanel from "./components/RightPanel";
import Sidebar from "./components/Sidebar";
import StatusStrip from "./components/StatusStrip";
import TopBar from "./components/TopBar";
import { API_URL, fetchDashboard, getToken, linkKalshi, setToken, unlinkKalshi } from "./lib/api";
import { DEMO_SNAPSHOT } from "./lib/demo";
import { fetchExternalMarkets, type ExternalFeedStatus, type ExternalSource } from "./lib/external-markets";
import type { SourceFilter } from "./lib/app-state";
import DashboardPage from "./pages/Dashboard";
import MarketsPage from "./pages/Markets";
import PositionsPage from "./pages/Positions";
import BetDetailPage from "./pages/BetDetail";

function SignIn({ onDemo, onToken }: { onDemo: () => void; onToken: (token: string) => void }) {
  const [token, setTokenInput] = useState("");
  const entraConfigured = Boolean(import.meta.env.VITE_ENTRA_CLIENT_ID);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900">cheeta</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          A read-only view of your linked Kalshi account — now on the web.
          Sign in with Entra External ID when it is configured, or continue
          with demo data to see the layout.
        </p>
        {!entraConfigured && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            Entra External ID is not configured for the web app yet
            (set VITE_ENTRA_CLIENT_ID and register a web redirect URI).
            Full MSAL sign-in is a follow-up — the API still validates bearer
            tokens server-side.
          </p>
        )}
        <button
          type="button"
          onClick={onDemo}
          className="mt-5 w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          Continue with demo data
        </button>

        <div className="mt-5">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Or continue with
          </p>
          <div className="mt-2 space-y-2">
            {(["Facebook", "X", "TikTok"] as const).map((network) => (
              <button
                key={network}
                type="button"
                disabled
                title={`Continue with ${network} is coming soon — social sign-in is not wired up yet.`}
                className="flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-400"
              >
                <span>Continue with {network}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold">Coming soon</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] leading-4 text-slate-400">
            Social sign-in is not wired up yet — Entra External ID is still
            the real sign-in for Cheeta. Adding Facebook / X / TikTok as
            identity providers is a separate Milestone 2 decision.
          </p>
        </div>
        <label className="mt-5 block">
          <span className="text-xs font-semibold text-slate-700">Or paste an API bearer token (kept only in this tab)</span>
          <input
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Bearer token"
            autoCapitalize="off"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </label>
        <button
          type="button"
          disabled={!token.trim()}
          onClick={() => onToken(token.trim())}
          className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Sign in with token
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">
          Read-only. Cheeta cannot place or modify orders in Milestone 1.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [signedIn, setSignedIn] = useState(() => sessionStorage.getItem("cheeta-signed-in") === "1");
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(DEMO_SNAPSHOT);
  const [isDemo, setIsDemo] = useState(true);
  const [linked, setLinked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [watchlist] = useState(["Fed decisions", "Inflation", "S&P 500", "Bitcoin"]);
  // Extra read-only feeds (Polymarket + SX Bet, public APIs, no keys).
  // Kept separate from the Kalshi snapshot so a failed extra feed never
  // wipes the account feed, and so the demo fallback stays clearly labeled.
  const [externalMarkets, setExternalMarkets] = useState<DashboardSnapshot["markets"]>([]);
  const [externalStatus, setExternalStatus] = useState<Record<ExternalSource, ExternalFeedStatus>>({
    polymarket: "loading",
    sxbet: "loading",
  });
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // Merge the extra feeds into the snapshot the pages render. Kalshi/demo
  // markets keep their order first; Polymarket/SX Bet follow.
  const mergedSnapshot: DashboardSnapshot = {
    ...snapshot,
    markets: [...snapshot.markets, ...externalMarkets],
  };

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchDashboard();
      setSnapshot(data);
      setIsDemo(false);
      setLinked(true);
    } catch (e) {
      // Graceful fallback: keep the layout visible with clearly-labeled
      // demo data instead of a blank screen.
      setSnapshot(DEMO_SNAPSHOT);
      setIsDemo(true);
      setError(e instanceof Error ? e.message : "Could not reach the Cheeta API — showing demo data.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (signedIn) void refresh();
  }, [signedIn, refresh]);

  // Load the extra read-only feeds once per sign-in. Each source fails
  // independently: a dead source just flips to "unavailable" and the rest
  // of the feed keeps working.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void fetchExternalMarkets().then(({ markets, status }) => {
      if (cancelled) return;
      setExternalMarkets(markets);
      setExternalStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  async function handleLink(apiKeyId: string, privateKeyPem: string) {
    setBusy(true);
    setError(null);
    try {
      const data = await linkKalshi(apiKeyId, privateKeyPem);
      setSnapshot(data);
      setIsDemo(false);
      setLinked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not link Kalshi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    try {
      await unlinkKalshi();
    } catch {
      // Unlink is best-effort in demo mode; still clear local state.
    }
    setLinked(false);
    setSnapshot(DEMO_SNAPSHOT);
    setIsDemo(true);
  }

  function signInDemo() {
    sessionStorage.setItem("cheeta-signed-in", "1");
    setSignedIn(true);
  }

  function signInToken(token: string) {
    setToken(token);
    sessionStorage.setItem("cheeta-signed-in", "1");
    setSignedIn(true);
  }

  function signOut() {
    setToken("");
    sessionStorage.removeItem("cheeta-signed-in");
    setSignedIn(false);
    setLinked(false);
    setSnapshot(DEMO_SNAPSHOT);
    setIsDemo(true);
  }

  if (!signedIn) {
    return <SignIn onDemo={signInDemo} onToken={signInToken} />;
  }

  const props = {
    snapshot: mergedSnapshot,
    isDemo,
    query,
    linked,
    busy,
    error,
    onLink: handleLink,
    onUnlink: handleUnlink,
    sourceFilter,
    onSourceFilter: setSourceFilter,
    externalStatus,
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <TopBar
          query={query}
          onQuery={setQuery}
          onRefresh={() => void refresh()}
          busy={busy}
          syncedAt={snapshot.account.syncedAt}
          isDemo={isDemo}
          onSignOut={signOut}
        />
        <div className="mx-auto max-w-[1440px] px-4 pb-10">
          <StatusStrip snapshot={snapshot} isDemo={isDemo} />
          {error && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="alert">
              {error} Showing demo data.
            </p>
          )}
          <div className="mt-4 flex gap-6">
            <Sidebar linked={linked} watchlist={watchlist} />
            <main className="min-w-0 flex-1">
              <Routes>
                <Route path="/" element={<DashboardPage {...props} />} />
                <Route path="/positions" element={<PositionsPage {...props} />} />
                <Route path="/markets" element={<MarketsPage {...props} />} />
                <Route path="/bet/:ticker" element={<BetDetailPage {...props} />} />
                <Route path="*" element={<DashboardPage {...props} />} />
              </Routes>
              <p className="mt-6 text-center text-xs text-slate-400">
                Milestone 1 is read-only — Cheeta cannot place or modify orders.
                API: {API_URL} {getToken() ? "· signed in with a bearer token" : "· demo mode"}
              </p>
            </main>
            <RightPanel snapshot={snapshot} isDemo={isDemo} />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
