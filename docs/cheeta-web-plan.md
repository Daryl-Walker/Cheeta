# Cheeta — Web Plan (updated 2026-11-23)

This is the current plan for the Cheeta **web** app. It supersedes the
original mobile-first plan in `.azure/project-plan.md` (2026-11-06) for
everything web-related. That file is still the record of the original
mobile / API scope; this file is where the web work lives.

Branch: `web-frontend` · PR #1 · **not merged to `main` yet**
Run it: `npm install`, then `npm run dev --workspace @cheeta/web` —
open **http://localhost:5173** (not 4000), hit "Continue with demo data".

## What Cheeta is

A Facebook-style web shell for linked prediction-market accounts. The
centre feed is where users place bets. The market/account overview sits
in the top horizontal strip (side-to-side scroll, like a Facebook
Stories row). It feels social — share, follow, social profile links —
opt-in only, never auto-posting.

Money plan, in Daryl's words: Cheeta makes money for him first, then he
shares it with his people so they can make money too, then he outsources it.
First purchase with app money: a new gaming computer / build a tower.

## Milestone 1 — DONE (read-only)

Web front end, React + Vite + TypeScript + Tailwind, in `apps/web/`.
Mobile app (`apps/mobile/`) untouched. No order API, no live bet
placement — place-bet buttons are disabled, labelled "coming soon".

- Top bar: brand, search, Dashboard / Positions / Markets, sync status.
  No top-nav Analytics tab.
- Top strip: account cards + key market cards.
- Centre feed: bet cards (Yes/No prices, volume, stake input) and open
  positions. Clicking a bet opens its detail view, where **Analytics
  and Info tabs live only there**. Analytics: odds, compare bets,
  trending, price history. Info: event/contract details, rules,
  expiry, volume.
- Left sidebar: nav, Kalshi link status, watchlists.
- Right sidebar, first section: **Risky bets — high payout** — underdog
  Yes at 30¢ or less, odds first big on each card (e.g. Yes 12¢ · pays
  $8.33 per $1), biggest payout first, top 6. Clicking a card opens
  that bet. Visible from 1024px up; below that, the feed's Highest
  Payout tab shows the same list.
- Feed tabs (combine with source tabs): All (default) / **Low Risk**
  (favourite outcome ≥ 80%) / **Highest Payout** (underdog Yes ≤ 30¢,
  sorted by payout) / **Trending** (highest volume first).
- Sources, all read-only: **Kalshi** (first provider), **Polymarket**
  (public Gamma API, no key, live prices), **SX Bet** (public
  `/markets/active`, no key, sports only, no prices in the keyless
  listing — cards show no live price, never invented).
- Best odds: bet detail Analytics compares Yes/No in cents across
  sources, strict high-confidence matching only, no force-matching.
  Best price is not best value after fees/liquidity; no guaranteed
  arbitrage, no "safe bet" claims anywhere. High probability is not a
  guarantee; high payout means high risk.
- Social, first pass: opt-in Share on feed cards (market title only,
  never balances), shareable parlay links that pre-fill a bet for a
  friend, Follow buttons with sample traders (UI only), social profile
  links. Social sign-in buttons are disabled / coming soon — no social
  login in Milestone 1.
- Stock market: Daryl asked for an option to trade on Wall Street, not
  just the in-app betting market. **Not built yet** — see Milestone 2.

Commits on `web-frontend` (latest first):
- `d03f439` — risky-bets right sidebar, odds first
- `9ac95e4` — feed tabs Low Risk / Highest Payout / Trending
- `a5f3c73` — Polymarket + SX Bet feeds, cross-source best odds
- `fa8ab08` — social pass 2 (shareable parlay links, Follow UI)
- earlier — web shell, Analytics/Info only in bet detail

## Milestone 2 — NEXT (not started, not decided yet)

1. **Live bet placement** — needs an order API (does not exist yet).
   Until then, placement stays disabled / coming soon.
2. **Entra / MSAL web sign-in** — register a web/SPA redirect URI in
   Entra, add `@azure/msal-browser`. Demo mode / pasted bearer token
   is the current stand-in.
3. **Deployment + API CORS** — API must allow the deployed web origin
   (with `Authorization` header). Local dev works through the Vite
   proxy (`/api` → localhost:4000); a deployed site does not.
4. **SX Bet in production** — needs a same-origin proxy or server-side
   fetch (dev-only `/sx` proxy in `vite.config.ts` does not exist in a
   production build).
5. **Real follow graph + activity feed** — follows are browser-only
   sample data in Milestone 1.
6. **Social sign-in** — Facebook / X / TikTok as Entra identity
   providers, a separate decision, not wired up.
7. **Stock-market trading option** — Daryl asked for it. Needs a
   brokerage, real-time market data, and following financial
   regulations/licensing. No provider or design chosen yet.

## Open decisions (Daryl's call)

- Milestone 2 timing — when to start live placement.
- Web-only vs keeping the mobile app alive — mobile is untouched so far.
- Deployment target — not chosen.
- Merge `web-frontend` to `main` — only when Daryl approves.

## Out of scope / do not do

- Do not merge to `main` without Daryl's go-ahead.
- Do not invent prices, odds, or payouts — SX Bet keyless listings have
  no price, and that must stay visible as "price unavailable".
- Do not claim any bet is safe, and do not predict safe bets.
- Do not auto-post to social, and never share balances, positions,
  or P&L.
- Microsoft Copilot integration — Daryl decided to keep the project
  separate; do not push it unless he reopens it.
