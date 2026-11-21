# Cheeta

Cheeta is an account dashboard for linked prediction-market accounts. The
initial milestone is a read-only app that lets a user sign in, connect a
Kalshi account, and view synced account and market data. Order placement is
not supported.

There are two clients: the original React Native mobile app
(`apps/mobile/`) and the new web app (`apps/web/`, Milestone 1) — a
Facebook-style web shell (top bar, horizontal accounts/markets strip,
centre feed) built with Vite + React + TypeScript + Tailwind CSS. The web
app reuses `@cheeta/contracts` and the same Express API. Styling choice for
the web shell is Tailwind CSS (matching the open-source Facebook-clone
references Daryl picked), rather than the Fluent UI v9 named in
`.azure/project-plan.md`.

## Architecture

- React Native and TypeScript mobile client (`apps/mobile/`).
- Vite + React + TypeScript + Tailwind CSS web client (`apps/web/`).
- TypeScript and Express API hosted on Azure App Service.
- Azure SQL for Cheeta application and normalized provider data.
- Microsoft Entra External ID for Cheeta user authentication.
- A provider-neutral API boundary, with Kalshi as the first real provider.
- Azure Key Vault for server-side provider secrets.

Both clients communicate only with the Cheeta API. Provider credentials
must never be embedded in the app or exposed to clients. Use official or
otherwise approved provider integrations.

## Web app (Milestone 1, read-only)

```sh
npm install
npm run dev --workspace @cheeta/web   # http://localhost:5173
```

The web app shows a top horizontal accounts/markets strip, a centre feed of
bet cards and open positions, a left sidebar, and a right account panel.
Bet cards show prices and a stake input, but the place-bet action is
disabled and labeled "coming soon (Milestone 2)" — there is no order API
yet. Clicking a bet opens a detail view with Analytics (odds, trending,
price history) and Info (contract details, rules, expiry, volume) tabs —
those two tabs live only inside the bet detail view, not in the top nav,
which stays Dashboard / Positions / Markets.
If the API is unreachable it shows clearly-labeled demo data.

Social (first pass): feed cards have an opt-in Share action (Facebook / X /
TikTok, market title only, never a balance or position, never automatic)
and the user menu holds social profile links. No social login, no social
SDKs, no social credentials. See `apps/web/README.md`.

**CORS note:** `services/api` has no CORS middleware yet. The Vite dev
server proxies `/api` to `http://localhost:4000`, so local development
works. For a deployed web app, the API must allow the web origin (with the
`Authorization` header) — that is still to do, and is not part of this
Milestone 1 change.
- TypeScript and Express API hosted on Azure App Service.
- Azure SQL for Cheeta application and normalized provider data.
- Microsoft Entra External ID for Cheeta user authentication.
- A provider-neutral API boundary, with Kalshi as the first real provider.
- Azure Key Vault for server-side provider secrets.

The mobile app communicates only with the Cheeta API. Provider credentials must never be embedded in the app or exposed to clients. Use official or otherwise approved provider integrations.

## Development

The app and API should support local development and automated tests without production Azure resources or real provider credentials. See [.azure/project-plan.md](.azure/project-plan.md) for the initial scope and acceptance criteria.
