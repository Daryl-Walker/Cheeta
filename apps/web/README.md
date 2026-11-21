# Cheeta web app — Milestone 1 (read-only)

Facebook-style web shell for Cheeta, built with Vite + React 19 + TypeScript
+ React Router + Tailwind CSS. It reuses `@cheeta/contracts` and the existing
Express API — no new backend, no order placement.

## Layout (as Daryl described it)

- **Sticky top bar:** Cheeta brand, market search, Dashboard / Positions /
  Markets tabs, sync status, Refresh, user menu / sign out. The user menu
  holds social profile links (Facebook, TikTok, X) — plain URLs stored only
  in this browser, no social login.
- **Top horizontal strip** (scrolls side to side, like a Facebook Stories
  row): account cards (balance, cash, net value, status) and key market cards
  (ticker, title, Yes price, volume). This is the market/account overview —
  it does **not** go in the feed.
- **Centre feed:** the main interaction area — bet cards (Yes/No prices,
  volume, stake input, place-bet button labeled *coming soon in Milestone 2*)
  and open-position cards with P&L. Clicking a bet card opens its detail
  view (`/bet/:ticker`) with **Analytics** and **Info** tabs — Analytics and
  Info live only inside that bet detail view, not in the top nav.
- **Left sidebar:** nav, Kalshi link status, watchlists.
- **Right panel:** account summary, P&L, top movers, provider health, social notes.

## Social — first pass

- Each bet/position card has a **Share** action. Sharing is opt-in, per
  card, and never automatic: it shows exactly what will be shared (the
  market title only — never a balance, position, or P&L) and only then opens
  the network's standard share page in a new tab (Facebook / X). TikTok has
  no web share-intent URL, so its action copies the text and opens
  tiktok.com for the user to post themselves.
- No social login, no Facebook/TikTok/X SDKs, no social credentials stored.
  Follow / friends / activity feeds are a later milestone, not this one.

## Run it

```sh
npm install
npm run dev --workspace @cheeta/web   # http://localhost:5173
```

The dev server proxies `/api` and `/health` to `http://localhost:4000`, so
local development works without CORS on the API. Set `VITE_API_URL` in
`apps/web/.env.example` (copy to `.env`) to point at another API.

If the API is unreachable, the app shows clearly-labeled **demo data** so
the layout is visible without Azure or Kalshi credentials. Start the API
(`npm run dev --workspace @cheeta/api`, with `DEV_AUTH_BYPASS=true` locally)
and link Kalshi from the Dashboard or Markets page to see live data.

## Sign-in

Entra External ID sign-in for the web is not wired up yet — the app
currently offers demo mode or a pasted bearer token (kept only in the tab's
session storage). Register a web/SPA redirect URI in Entra and add MSAL
(`@azure/msal-browser`) as a follow-up. The API still validates bearer
tokens server-side, and Kalshi credentials are only ever sent to the API
over HTTPS, never stored in the browser.

## What is NOT in Milestone 1

- Live bet placement — there is no order API yet. Bet cards show prices and
  a stake input, with the place action disabled and labeled "coming soon
  (Milestone 2)".
- Mobile app changes — `apps/mobile/` is untouched.
