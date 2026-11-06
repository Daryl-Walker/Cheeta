import { createSign, constants } from "node:crypto";
import type { MarketSummary } from "@cheeta/contracts";
import type { AccountRead, ProviderCredentials, ReadOnlyProvider } from "./model.js";

type JsonRecord = Record<string, unknown>;
export type Fetcher = typeof fetch;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function decimalOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function centsToDollars(value: unknown): number | null {
  const amount = numberOrNull(value);
  return amount === null ? null : amount / 100;
}

function dollarsOrLegacyCents(dollars: unknown, cents: unknown): number | null {
  return decimalOrNull(dollars) ?? centsToDollars(cents);
}

export class KalshiProvider implements ReadOnlyProvider {
  constructor(
    private readonly baseUrl = process.env.KALSHI_API_BASE_URL ?? "https://api.elections.kalshi.com/trade-api/v2",
    private readonly fetcher: Fetcher = fetch
  ) {}

  async readAccount(credentials: ProviderCredentials): Promise<AccountRead> {
    const [balanceResponse, positions] = await Promise.all([
      this.request("/portfolio/balance", credentials),
      this.readPositions(credentials)
    ]);

    const balance = balanceResponse;
    const availableBalance = dollarsOrLegacyCents(balance.balance_dollars, balance.balance);
    if (availableBalance === null) {
      throw new Error("Kalshi response did not include a valid account balance.");
    }
    return {
      currency: "USD",
      availableBalance,
      portfolioValue: dollarsOrLegacyCents(balance.portfolio_value_dollars, balance.portfolio_value),
      positions,
      syncedAt: new Date().toISOString()
    };
  }

  async readMarkets(credentials: ProviderCredentials): Promise<MarketSummary[]> {
    const payload = await this.request("/markets?limit=50&status=open", credentials);
    const markets = Array.isArray(payload.markets) ? payload.markets : [];
    return markets.map((entry) => {
      const row = entry as JsonRecord;
      return {
        ticker: stringOr(row.ticker, "unknown"),
        title: stringOr(row.title, stringOr(row.ticker, "Market")),
        subtitle: typeof row.subtitle === "string"
          ? row.subtitle
          : typeof row.yes_sub_title === "string" ? row.yes_sub_title : null,
        status: stringOr(row.status, "unknown"),
        yesBid: dollarsOrLegacyCents(row.yes_bid_dollars, row.yes_bid),
        yesAsk: dollarsOrLegacyCents(row.yes_ask_dollars, row.yes_ask),
        volume: decimalOrNull(row.volume_fp) ?? numberOrNull(row.volume),
        openInterest: decimalOrNull(row.open_interest_fp) ?? numberOrNull(row.open_interest),
        closeTime: typeof row.close_time === "string" ? row.close_time : null
      };
    });
  }

  private async readPositions(credentials: ProviderCredentials): Promise<AccountRead["positions"]> {
    const positions: AccountRead["positions"] = [];
    let cursor = "";
    for (let page = 0; page < 10; page++) {
      const query = new URLSearchParams({ limit: "1000" });
      if (cursor) query.set("cursor", cursor);
      const payload = await this.request(`/portfolio/positions?${query.toString()}`, credentials);
      const entries = Array.isArray(payload.market_positions) ? payload.market_positions : [];
      positions.push(...entries.map((entry) => {
        const row = entry as JsonRecord;
        return {
          ticker: stringOr(row.ticker, "unknown"),
          marketTitle: stringOr(row.title, stringOr(row.ticker, "Market")),
          position: decimalOrNull(row.position_fp) ?? numberOrNull(row.position) ?? 0,
          marketExposure: dollarsOrLegacyCents(row.market_exposure_dollars, row.market_exposure),
          realizedPnl: dollarsOrLegacyCents(row.realized_pnl_dollars, row.realized_pnl)
        };
      }));
      cursor = stringOr(payload.cursor, "");
      if (!cursor) return positions;
    }
    if (cursor) throw new Error("Kalshi position results exceed the supported sync limit.");
    return positions;
  }

  private async request(pathAndQuery: string, credentials: ProviderCredentials): Promise<JsonRecord> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}${pathAndQuery}`);
    const timestamp = Date.now().toString();
    const signedPath = `${url.pathname}`;
    const signer = createSign("RSA-SHA256");
    signer.update(`${timestamp}GET${signedPath}`);
    signer.end();
    const signature = signer.sign({
      key: credentials.privateKeyPem,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32
    }, "base64");

    const response = await this.fetcher(url, {
      method: "GET",
      headers: {
        "KALSHI-ACCESS-KEY": credentials.apiKeyId,
        "KALSHI-ACCESS-SIGNATURE": signature,
        "KALSHI-ACCESS-TIMESTAMP": timestamp,
        accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Kalshi read request failed with HTTP ${response.status}.`);
    }
    return await response.json() as JsonRecord;
  }
}
