import assert from "node:assert/strict";
import { generateKeyPairSync, verify, constants } from "node:crypto";
import { test } from "node:test";
import { KalshiProvider } from "../src/kalshiProvider.js";

test("Kalshi adapter signs read-only requests and maps balance/markets", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  const calls: Array<{ url: URL; method: string; headers: Headers }> = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    calls.push({ url, method: init?.method ?? "GET", headers });
    const timestamp = headers.get("KALSHI-ACCESS-TIMESTAMP") ?? "";
    const signature = headers.get("KALSHI-ACCESS-SIGNATURE") ?? "";
    const signed = verify(
      "RSA-SHA256",
      Buffer.from(`${timestamp}GET${url.pathname}`),
      { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 },
      Buffer.from(signature, "base64")
    );
    assert.equal(signed, true);
    assert.equal(headers.get("KALSHI-ACCESS-KEY"), "test-key");
    const payload = url.pathname.endsWith("/portfolio/balance")
      ? { balance: 12345, balance_dollars: "123.4500", portfolio_value: 15000 }
      : url.pathname.endsWith("/portfolio/positions")
        ? { market_positions: [{
          ticker: "MKT",
          position_fp: "2.5",
          market_exposure_dollars: "1.25",
          realized_pnl_dollars: "0.10"
        }] }
        : { markets: [{ ticker: "MKT", title: "Test", status: "open", yes_bid_dollars: "0.4200", yes_ask_dollars: "0.4400" }] };
    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  };
  const provider = new KalshiProvider("https://example.test/trade-api/v2", fakeFetch);
  const credentials = { apiKeyId: "test-key", privateKeyPem: privateKey };
  const account = await provider.readAccount(credentials);
  const markets = await provider.readMarkets(credentials);

  assert.equal(account.availableBalance, 123.45);
  assert.equal(account.portfolioValue, 150);
  assert.equal(account.positions[0]?.position, 2.5);
  assert.equal(account.positions[0]?.marketExposure, 1.25);
  assert.equal(markets[0]?.yesBid, 0.42);
  assert.equal(calls.length, 3);
  assert.equal(calls.every((call) => call.method === "GET"), true);
  assert.equal(calls[0]?.url.pathname, "/trade-api/v2/portfolio/balance");
});

test("provider reports upstream HTTP failure without exposing response bodies", async () => {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  const provider = new KalshiProvider("https://example.test/trade-api/v2", async () =>
    new Response("sensitive provider content", { status: 403 }));
  await assert.rejects(
    provider.readMarkets({ apiKeyId: "key", privateKeyPem: privateKey }),
    /HTTP 403/
  );
});

test("provider rejects account responses without a valid balance", async () => {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  const provider = new KalshiProvider("https://example.test/trade-api/v2", async (input) => {
    const url = new URL(String(input));
    const payload = url.pathname.endsWith("/portfolio/balance")
      ? {}
      : { market_positions: [] };
    return new Response(JSON.stringify(payload), { status: 200 });
  });
  await assert.rejects(
    provider.readAccount({ apiKeyId: "key", privateKeyPem: privateKey }),
    /valid account balance/
  );
});
