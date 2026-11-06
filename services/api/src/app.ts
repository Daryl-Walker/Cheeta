import { createHash, randomUUID } from "node:crypto";
import express, { type NextFunction, type Request, type RequestHandler, type Response } from "express";
import type { DashboardSnapshot } from "@cheeta/contracts";
import { createAuthenticator, type Authenticator } from "./auth.js";
import { KalshiProvider } from "./kalshiProvider.js";
import { MemoryRepository, MemorySecretStore } from "./memoryStore.js";
import type { ProviderCredentials, ReadOnlyProvider, Repository, SecretStore } from "./model.js";
import "./types.js";

async function deleteSecret(secretStore: SecretStore, secretRef: string): Promise<void> {
  try {
    await secretStore.delete(secretRef);
  } catch (error) {
    console.error("Could not delete a provider secret.", error);
  }
}

export interface AppDependencies {
  repository?: Repository;
  secrets?: SecretStore;
  provider?: ReadOnlyProvider;
  authenticate?: Authenticator;
}

export function createApp(dependencies: AppDependencies = {}) {
  const repository = dependencies.repository ?? new MemoryRepository();
  const secrets = dependencies.secrets ?? new MemorySecretStore();
  const provider = dependencies.provider ?? new KalshiProvider();
  const authenticate = dependencies.authenticate ?? createAuthenticator();
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use("/api", authenticate as RequestHandler);

  app.get("/api/providers", (_request, response) => {
    response.json([{
      id: "kalshi",
      name: "Kalshi",
      capabilities: ["account.read", "markets.read"]
    }]);
  });

  app.post("/api/providers/kalshi/link", async (request, response, next) => {
    try {
      const body = request.body as Partial<ProviderCredentials>;
      if (typeof body.apiKeyId !== "string" || body.apiKeyId.length > 200 ||
          typeof body.privateKeyPem !== "string" || !body.privateKeyPem.includes("PRIVATE KEY")) {
        response.status(400).json({ error: "apiKeyId and a valid privateKeyPem are required." });
        return;
      }
      const userId = request.identity!.userId;
      const oldLink = await repository.getLink(userId, "kalshi");
      const secretRef = `kalshi-${createHash("sha256").update(userId).digest("hex").slice(0, 24)}-${randomUUID().replace(/-/g, "")}`;
      const credentials = { apiKeyId: body.apiKeyId, privateKeyPem: body.privateKeyPem };
      await secrets.put(secretRef, credentials);
      try {
        const [account, markets] = await Promise.all([
          provider.readAccount(credentials),
          provider.readMarkets(credentials)
        ]);
        const snapshot: DashboardSnapshot = {
          account: {
            provider: "kalshi",
            ...account,
            positions: account.positions.map((position) => ({
              ...position,
              marketTitle: markets.find((market) => market.ticker === position.ticker)?.title ?? position.marketTitle
            }))
          },
          markets
        };
        await repository.saveDashboard(userId, snapshot);
        await repository.saveLink({ userId, provider: "kalshi", secretRef, linkedAt: new Date().toISOString() });
        if (oldLink) await deleteSecret(secrets, oldLink.secretRef);
        response.status(201).json({ linked: true, dashboard: snapshot });
      } catch (error) {
        await deleteSecret(secrets, secretRef);
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/providers/kalshi/link", async (request, response, next) => {
    try {
      const userId = request.identity!.userId;
      const link = await repository.getLink(userId, "kalshi");
      if (link) await secrets.delete(link.secretRef);
      await repository.removeLink(userId, "kalshi");
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/account/dashboard", async (request, response, next) => {
    try {
      const userId = request.identity!.userId;
      const link = await repository.getLink(userId, "kalshi");
      if (!link) {
        response.status(404).json({ error: "No Kalshi account is linked." });
        return;
      }
      const credentials = await secrets.get(link.secretRef);
      const [account, markets] = await Promise.all([
        provider.readAccount(credentials),
        provider.readMarkets(credentials)
      ]);
      const snapshot: DashboardSnapshot = {
        account: {
          provider: "kalshi",
          ...account,
          positions: account.positions.map((position) => ({
            ...position,
            marketTitle: markets.find((market) => market.ticker === position.ticker)?.title ?? position.marketTitle
          }))
        },
        markets
      };
      await repository.saveDashboard(userId, snapshot);
      response.json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error("API request failed.", error);
    response.status(502).json({ error: "Unable to complete the provider operation." });
  });
  return app;
}
