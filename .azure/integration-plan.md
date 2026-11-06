# Integration hand-off

## Backend
- Project: `services/api`
- Run: `npm run dev --workspace @cheeta/api` (port 4000)
- Build: `npm run build --workspace @cheeta/api`
- Health: `GET /health`

## Frontend
- Project: `apps/mobile` (Expo React Native; no web frontend)
- Run: `npm start --workspace @cheeta/mobile`
- Build/typecheck: `npm run typecheck --workspace @cheeta/mobile`
- API seam: `apps/mobile/App.tsx` (`apiUrl`, `headers`, fetch calls)
- Mock files: none; dashboard data comes from API and remains empty until a provider is linked.

## API inventory
- `GET /health`
- `GET /api/providers`
- `POST /api/providers/kalshi/link`
- `DELETE /api/providers/kalshi/link`
- `GET /api/account/dashboard`

## Database
- Azure SQL; migration runner: `npm run migrate --workspace @cheeta/api`
- Migration directory: `services/api/db/migrations`
- Connection: `AZURE_SQL_CONNECTION_STRING`
- Schema is present; no seed data required or included.

## Shared contracts and services
- Contracts: `packages/contracts/src/index.ts`; import alias `@cheeta/contracts`
- Services: React Native mobile and Express API
- Essential: API, Azure SQL in production, Entra External ID authentication, Kalshi read-only provider, Key Vault for production credentials.
- Enhancements: none scaffolded.
