# Cheeta

Cheeta is a mobile-first account dashboard. The initial milestone is a read-only React Native app that lets a user sign in, connect a Kalshi account, and view synced account and market data. Order placement is not supported.

## Architecture

- React Native and TypeScript mobile client.
- TypeScript and Express API hosted on Azure App Service.
- Azure SQL for Cheeta application and normalized provider data.
- Microsoft Entra External ID for Cheeta user authentication.
- A provider-neutral API boundary, with Kalshi as the first real provider.
- Azure Key Vault for server-side provider secrets.

The mobile app communicates only with the Cheeta API. Provider credentials must never be embedded in the app or exposed to clients. Use official or otherwise approved provider integrations.

## Development

The app and API should support local development and automated tests without production Azure resources or real provider credentials. See [.azure/project-plan.md](.azure/project-plan.md) for the initial scope and acceptance criteria.
