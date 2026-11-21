import type { DashboardSnapshot } from "@cheeta/contracts";

/**
 * Clearly-labeled sample data, used ONLY when the Cheeta API is unreachable
 * (no Azure/Kalshi credentials yet). Every screen that shows it carries a
 * "Demo data" badge. No balances here are real, and nothing here is a bet.
 */
export const DEMO_SNAPSHOT: DashboardSnapshot = {
  account: {
    provider: "kalshi",
    currency: "USD",
    availableBalance: 18420.64,
    portfolioValue: 14160.32,
    syncedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    positions: [
      {
        ticker: "FED-DEC25",
        marketTitle: "Will the Fed cut rates in December?",
        position: 120,
        marketExposure: 8400,
        realizedPnl: 312.4,
      },
      {
        ticker: "CPI-JAN26",
        marketTitle: "Will CPI come in above 3% in January?",
        position: -40,
        marketExposure: -1560,
        realizedPnl: -86.2,
      },
      {
        ticker: "SPX-4500",
        marketTitle: "Will the S&P 500 close above 4,500 this week?",
        position: 75,
        marketExposure: 2625,
        realizedPnl: 148.75,
      },
    ],
  },
  markets: [
    {
      ticker: "FED-DEC25",
      title: "Will the Fed cut rates in December?",
      subtitle: "Federal Reserve · Closes Dec 17",
      status: "open",
      yesBid: 0.62,
      yesAsk: 0.64,
      volume: 184320,
      openInterest: 42110,
      closeTime: "2025-12-17T19:00:00Z",
    },
    {
      ticker: "CPI-JAN26",
      title: "Will CPI come in above 3% in January?",
      subtitle: "Inflation · Closes Jan 14",
      status: "open",
      yesBid: 0.41,
      yesAsk: 0.43,
      volume: 96210,
      openInterest: 18840,
      closeTime: "2026-01-14T13:30:00Z",
    },
    {
      ticker: "SPX-4500",
      title: "Will the S&P 500 close above 4,500 this week?",
      subtitle: "Equities · Closes Friday",
      status: "open",
      yesBid: 0.55,
      yesAsk: 0.57,
      volume: 241500,
      openInterest: 63900,
      closeTime: "2025-12-19T21:00:00Z",
    },
    {
      ticker: "BTC-100K",
      title: "Will Bitcoin reach $100,000 by year end?",
      subtitle: "Crypto · Closes Dec 31",
      status: "open",
      yesBid: 0.38,
      yesAsk: 0.4,
      volume: 512000,
      openInterest: 120400,
      closeTime: "2025-12-31T23:59:00Z",
    },
    {
      ticker: "NFL-SB26",
      title: "Will the Chiefs win the Super Bowl?",
      subtitle: "Sports · Closes Feb 8",
      status: "open",
      yesBid: 0.22,
      yesAsk: 0.24,
      volume: 88400,
      openInterest: 22100,
      closeTime: "2026-02-08T23:30:00Z",
    },
    {
      ticker: "AI-AGI26",
      title: "Will a major lab announce AGI in 2026?",
      subtitle: "Tech · Closes Dec 31, 2026",
      status: "open",
      yesBid: 0.12,
      yesAsk: 0.14,
      volume: 31200,
      openInterest: 9800,
      closeTime: "2026-12-31T23:59:00Z",
    },
  ],
};

/** Extra strip cards (accounts) — demo only; the real API returns one account. */
export const DEMO_ACCOUNTS = [
  { name: "Cheeta Main", provider: "Kalshi", balance: 18420.64, cash: 4260.32, netValue: 14160.32, status: "Connected", syncedAt: DEMO_SNAPSHOT.account.syncedAt },
  { name: "Options Reserve", provider: "Kalshi", balance: 6700, cash: 2100, netValue: 4600, status: "Synced 2m ago", syncedAt: DEMO_SNAPSHOT.account.syncedAt },
  { name: "Cash Sweep", provider: "Kalshi", balance: 1240.15, cash: 1240.15, netValue: 0, status: "Ready", syncedAt: DEMO_SNAPSHOT.account.syncedAt },
];
