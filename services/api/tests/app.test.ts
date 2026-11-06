import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import type { DashboardSnapshot } from "@cheeta/contracts";
import { createApp } from "../src/app.js";
import { MemoryRepository, MemorySecretStore } from "../src/memoryStore.js";
import type { Authenticator } from "../src/auth.js";
import type { ProviderCredentials, ReadOnlyProvider } from "../src/model.js";

const authenticate: Authenticator = async (req, _res, next) => {
  req.identity = { userId: "user-1" };
  next();
};
const account = {
  currency: "USD",
  availableBalance: 42.5,
  portfolioValue: null,
  positions: [],
  syncedAt: "2026-01-01T00:00:00.000Z"
};
const market = {
  ticker: "TICKER",
  title: "Test market",
  subtitle: null,
  status: "open",
  yesBid: 0.45,
  yesAsk: 0.47,
  volume: 5,
  openInterest: 2,
  closeTime: null
};

test("health is available without user auth", async () => {
  const app = createApp({ authenticate });
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

test("link stores credentials server-side and returns normalized read-only data", async () => {
  const repository = new MemoryRepository();
  const secrets = new MemorySecretStore();
  let received: ProviderCredentials | undefined;
  const provider: ReadOnlyProvider = {
    async readAccount(credentials) {
      received = credentials;
      return account;
    },
    async readMarkets() {
      return [market];
    }
  };
  const app = createApp({ repository, secrets, provider, authenticate });
  const response = await request(app).post("/api/providers/kalshi/link")
    .send({ apiKeyId: "key-id", privateKeyPem: "-----BEGIN PRIVATE KEY-----placeholder" });
  assert.equal(response.status, 201);
  assert.equal(received?.apiKeyId, "key-id");
  assert.equal(JSON.stringify(response.body).includes("PRIVATE KEY"), false);
  const saved = await repository.getDashboard("user-1") as DashboardSnapshot;
  assert.equal(saved.account.availableBalance, 42.5);
  assert.equal(saved.markets[0]?.ticker, "TICKER");
});

test("dashboard returns not found when the authenticated user has no linked account", async () => {
  const app = createApp({ authenticate });
  const response = await request(app).get("/api/account/dashboard");
  assert.equal(response.status, 404);
});

test("credential validation rejects missing private keys", async () => {
  const app = createApp({ authenticate });
  const response = await request(app).post("/api/providers/kalshi/link").send({ apiKeyId: "id" });
  assert.equal(response.status, 400);
});

test("provider failure does not leave a linked account", async () => {
  const repository = new MemoryRepository();
  const app = createApp({
    repository,
    authenticate,
    provider: {
      async readAccount() { throw new Error("upstream unavailable"); },
      async readMarkets() { return []; }
    }
  });
  const response = await request(app).post("/api/providers/kalshi/link")
    .send({ apiKeyId: "id", privateKeyPem: "PRIVATE KEY" });
  assert.equal(response.status, 502);
  assert.equal(response.body.error, "Unable to complete the provider operation.");
  assert.equal(await repository.getLink("user-1", "kalshi"), null);
});
