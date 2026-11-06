# Project Plan

**Status**: Planning
**Created**: 2026-11-06
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build a mobile-first Cheeta account dashboard that lets users sign in, connect a Kalshi account, and view normalized balances, positions, and market data. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**API Login**: Yes

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Backend — API

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | docker-compose |

---

## 3. Frontend — Mobile App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React Native + Expo |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure App Service | Hosts the provider-neutral Express API and exposes read-only account endpoints | API_BASE_URL | http://localhost:3000 | Essential |
| Azure SQL | Persists Cheeta users, linked-provider records, account snapshots, and normalized market data | DATABASE_URL | Server=localhost,1433;Database=cheeta;User Id=${SQL_USER};******;TrustServerCertificate=true | Essential |
| Azure Key Vault | Stores Kalshi client credentials and provider-side secrets outside the app bundle | KEY_VAULT_URL | https://localhost | Enhancement |

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js LTS | backend, mobile | ✅ | v26.13.0 |
| npm | backend, mobile | ✅ | 11.20.0 (`npm.cmd` in PowerShell) |
| Azure CLI | backend | ✅ | 2.92.0 |
| Docker Desktop | backend | ❓ | Not confirmed in this environment |
| SQL Server local tooling | backend | ❓ | Not confirmed in this environment |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| VS Code | backend, mobile | ❓ | Not confirmed in this environment |
| Azure App Service extension | backend | ❓ | Not confirmed in this environment |
| Docker extension | backend | ❓ | Not confirmed in this environment |
| TypeScript extension | backend, mobile | ❓ | Not confirmed in this environment |

Node.js and npm were installed and verified with fnm, and Azure CLI was installed with winget and verified as version 2.92.0. In this PowerShell environment, the `npm.ps1` launcher is blocked by the execution policy; use `npm.cmd` unless that policy is changed. Docker and the remaining Azure tooling required for local verification remain unconfirmed.

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: Modern account-console aesthetic with high-contrast numbers, calm neutral surfaces, and compact, data-dense layouts that prioritize scanability.
**Typography**: Inter, system-ui

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#2563eb` | Primary actions, active account links, and key navigation states |
| `accent` | `#14b8a6` | Secondary highlights for positive movement, market status, and chart emphasis |
| `surface` | `#f8fafc` | Page backgrounds and dashboard panels |
| `text` | `#0f172a` | Core content and data labels |
| `muted` | `#64748b` | Secondary metadata, timestamps, and quiet status hints |
| `border` | `#e2e8f0` | Dividers, card outlines, and form boundaries |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Dashboard | `/` | Signed-in account summary with balances, provider status, and key metrics | `header + hero + grid + table` |
| Positions | `/positions` | Overview of open positions and P&L by market | `sidebar + table + card-list` |
| Markets | `/markets` | Browse watchlists and market snapshots | `header + tabs + table` |

### Sample Content

`Dashboard — account`:
| Account | Provider | Balance | Cash | Net Value | Status |
| --- | --- | --- | --- | --- | --- |
| Cheeta Main | Kalshi | $18,420.64 | $4,260.32 | $14,160.32 | Connected |
| Options Reserve | Kalshi | $6,700.00 | $2,100.00 | $4,600.00 | Synced 2m ago |
| Cash Sweep | Kalshi | $1,240.15 | $1,240.15 | $0.00 | Ready |

`Positions — position`:
| Market | Side | Qty | Mark | P&L | Status |
| --- | --- | --- | --- | --- | --- |
| NVDA 2026-12 | Long | 3 | $214.80 | +$82.40 | Open |
| TSLA 2026-11 | Short | 5 | $172.10 | +$118.50 | Open |
| BTC/USD | Long | 2 | $62,480.00 | +$2,180.00 | Open |

`Markets — market`:
| Event | Contract | Last | Change | Volume | Status |
| --- | --- | --- | --- | --- | --- |
| Fed Chair speech | Rate cut probability | 38.2 | +2.6% | 18.4K | Active |
| CPI release | Inflation above 3.0% | 51.8 | -1.4% | 9.2K | Active |
| NFL divisional | Chiefs to win AFC | 46.1 | +4.9% | 22.7K | Active |

`Account linking` — provider: Kalshi · status: connected · last sync: 2 minutes ago

---

## 7. Project Structure

```text
cheeta/
├── apps/
│   └── mobile/
│       ├── App.tsx
│       ├── app.json
│       └── package.json
├── packages/
│   └── contracts/
│       └── src/
├── services/
│   └── api/
│       ├── src/
│       ├── tests/
│       ├── db/
│       └── package.json
├── .azure/
│   ├── project-plan.md
│   └── requirements.json
├── README.md
├── package.json
└── docs/
    └── local-development.md
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check for API and provider connectivity | — | `{ status, services }` | 200, 503 |
| 2 | GET | `/api/me` | Returns the signed-in user's Cheeta profile and linked providers | — | `{ id, name, providers }` | 200, 401 |
| 3 | GET | `/api/accounts` | Returns normalized account balance and position summaries | — | `{ availableCash, equity, positions }` | 200, 404 |
| 4 | GET | `/api/markets` | Lists watchlists and current market snapshots | — | `{ markets, nextCursor }` | 200, 400 |
| 5 | POST | `/api/providers/kalshi/connect` | Links or refreshes the user's Kalshi connection | `{ refreshToken, userId }` | `{ provider, status, linkedAt }` | 200, 202, 400 |
| 6 | GET | `/api/providers/kalshi/account` | Returns a provider-specific account snapshot through the adapter layer | — | `{ provider, account, syncedAt }` | 200, 502 |

---

## 9. Next Steps

1. Confirm the local toolchain and required SDK versions before the first scaffold pass.
2. Implement provider-neutral account and market contracts in the shared package.
3. Build the backend API around Express with read-only Kalshi adapter logic and Azure SQL persistence.
4. Add React Native mobile screens for dashboard, positions, and markets using the shared contracts.
5. Validate local development flow, test coverage, and safe secret management before any Azure deployment work.
