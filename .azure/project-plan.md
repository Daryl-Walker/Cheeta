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
| Azure SQL | Persists Cheeta users, linked-provider records, account snapshots, and normalized market data | DATABASE_URL | Server=localhost,1433;Database=cheeta;User Id=${SQL_USER};Password=${SQL_PASSWORD};TrustServerCertificate=true | Essential |
| Azure Key Vault | Stores Kalshi client credentials and provider-side secrets outside the app bundle | KEY_VAULT_URL | https://localhost | Enhancement |

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js LTS | backend, mobile | ❓ | Not confirmed in this environment |
| npm | backend, mobile | ❓ | Not confirmed in this environment |
| Azure CLI | backend | ❓ | Not confirmed in this environment |
| Docker Desktop | backend | ❓ | Not confirmed in this environment |
| SQL Server local tooling | backend | ❓ | Not confirmed in this environment |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| VS Code | backend, mobile | ❓ | Not confirmed in this environment |
| Azure App Service extension | backend | ❓ | Not confirmed in this environment |
| Docker extension | backend | ❓ | Not confirmed in this environment |
| TypeScript extension | backend, mobile | ❓ | Not confirmed in this environment |

The detection pass in this environment did not confirm Node.js, npm, Docker, or the Azure tooling required for local verification, so every prerequisite currently resolves to ❓ and should be rechecked before proceeding.

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

- `Dashboard`: account equity, available-to-trade, and linked-provider status for Kalshi.
- `Positions`: market name, side, quantity, mark price, and unrealized P&L for active trades.
- `Markets`: watchlist cards, event names, settlement status, and a compact trend view.

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

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/me` | GET | Returns the signed-in user's Cheeta profile and linked providers |
| `/api/accounts` | GET | Returns normalized account balance and position summaries |
| `/api/markets` | GET | Lists market watchlists and live market snapshots |
| `/api/providers/kalshi/connect` | POST | Links or refreshes the user's Kalshi connection |
| `/api/providers/kalshi/account` | GET | Returns the provider-specific account snapshot through the adapter layer |

---

## 9. Next Steps

1. Confirm the local toolchain and required SDK versions before the first scaffold pass.
2. Implement provider-neutral account and market contracts in the shared package.
3. Build the backend API around Express with read-only Kalshi adapter logic and Azure SQL persistence.
4. Add React Native mobile screens for dashboard, positions, and markets using the shared contracts.
5. Validate local development flow, test coverage, and safe secret management before any Azure deployment work.
