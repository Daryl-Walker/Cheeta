import sql from "mssql";
import type { DashboardSnapshot, MarketSummary, PositionSummary } from "@cheeta/contracts";
import type { LinkedProvider, Repository } from "./model.js";

export class SqlRepository implements Repository {
  private readonly pool: sql.ConnectionPool;

  constructor(connectionString: string) {
    this.pool = new sql.ConnectionPool(connectionString);
  }

  private async connection(): Promise<sql.ConnectionPool> {
    if (!this.pool.connected) await this.pool.connect();
    return this.pool;
  }

  async getLink(userId: string, provider: "kalshi"): Promise<LinkedProvider | null> {
    const result = await (await this.connection()).request()
      .input("userId", sql.NVarChar(200), userId)
      .input("provider", sql.NVarChar(40), provider)
      .query("SELECT UserId, Provider, SecretRef, LinkedAt FROM LinkedProviders WHERE UserId=@userId AND Provider=@provider");
    const row = result.recordset[0];
    return row ? {
      userId: row.UserId as string,
      provider: row.Provider as "kalshi",
      secretRef: row.SecretRef as string,
      linkedAt: new Date(row.LinkedAt as Date).toISOString()
    } : null;
  }

  async saveLink(link: LinkedProvider): Promise<void> {
    await (await this.connection()).request()
      .input("userId", sql.NVarChar(200), link.userId)
      .input("provider", sql.NVarChar(40), link.provider)
      .input("secretRef", sql.NVarChar(128), link.secretRef)
      .input("linkedAt", sql.DateTime2, new Date(link.linkedAt))
      .query(`MERGE LinkedProviders AS target
        USING (SELECT @userId AS UserId, @provider AS Provider) AS source
        ON target.UserId=source.UserId AND target.Provider=source.Provider
        WHEN MATCHED THEN UPDATE SET SecretRef=@secretRef, LinkedAt=@linkedAt
        WHEN NOT MATCHED THEN INSERT (UserId, Provider, SecretRef, LinkedAt)
          VALUES (@userId, @provider, @secretRef, @linkedAt);`);
  }

  async removeLink(userId: string, provider: "kalshi"): Promise<void> {
    await (await this.connection()).request()
      .input("userId", sql.NVarChar(200), userId)
      .input("provider", sql.NVarChar(40), provider)
      .query("DELETE FROM LinkedProviders WHERE UserId=@userId AND Provider=@provider; DELETE FROM AccountSnapshots WHERE UserId=@userId AND Provider=@provider; DELETE FROM Positions WHERE UserId=@userId AND Provider=@provider; DELETE FROM Markets WHERE UserId=@userId AND Provider=@provider");
  }

  async saveDashboard(userId: string, snapshot: DashboardSnapshot): Promise<void> {
    const pool = await this.connection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const request = () => new sql.Request(transaction);
      const account = snapshot.account;
      await request()
        .input("userId", sql.NVarChar(200), userId)
        .input("provider", sql.NVarChar(40), account.provider)
        .input("currency", sql.NVarChar(8), account.currency)
        .input("balance", sql.Decimal(19, 4), account.availableBalance)
        .input("portfolio", sql.Decimal(19, 4), account.portfolioValue)
        .input("syncedAt", sql.DateTime2, new Date(account.syncedAt))
        .query(`MERGE AccountSnapshots AS target
          USING (SELECT @userId AS UserId, @provider AS Provider) AS source
          ON target.UserId=source.UserId AND target.Provider=source.Provider
          WHEN MATCHED THEN UPDATE SET Currency=@currency, AvailableBalance=@balance, PortfolioValue=@portfolio, SyncedAt=@syncedAt
          WHEN NOT MATCHED THEN INSERT (UserId, Provider, Currency, AvailableBalance, PortfolioValue, SyncedAt)
            VALUES (@userId, @provider, @currency, @balance, @portfolio, @syncedAt);`);
      await request()
        .input("userId", sql.NVarChar(200), userId)
        .input("provider", sql.NVarChar(40), account.provider)
        .query("DELETE FROM Positions WHERE UserId=@userId AND Provider=@provider; DELETE FROM Markets WHERE UserId=@userId AND Provider=@provider");

      for (const position of account.positions) await this.insertPosition(request(), userId, account.provider, position, account.syncedAt);
      for (const market of snapshot.markets) await this.insertMarket(request(), userId, account.provider, market, account.syncedAt);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getDashboard(userId: string): Promise<DashboardSnapshot | null> {
    const pool = await this.connection();
    const result = await pool.request()
      .input("userId", sql.NVarChar(200), userId)
      .query("SELECT TOP 1 * FROM AccountSnapshots WHERE UserId=@userId AND Provider='kalshi'");
    const row = result.recordset[0];
    if (!row) return null;
    const [positionsResult, marketsResult] = await Promise.all([
      pool.request().input("userId", sql.NVarChar(200), userId)
        .query("SELECT Ticker, MarketTitle, PositionCount, MarketExposure, RealizedPnl FROM Positions WHERE UserId=@userId AND Provider='kalshi'"),
      pool.request().input("userId", sql.NVarChar(200), userId)
        .query("SELECT Ticker, Title, Subtitle, Status, YesBid, YesAsk, Volume, OpenInterest, CloseTime FROM Markets WHERE UserId=@userId AND Provider='kalshi'")
    ]);
    const positions: PositionSummary[] = positionsResult.recordset.map((position) => ({
      ticker: position.Ticker as string,
      marketTitle: position.MarketTitle as string,
      position: Number(position.PositionCount),
      marketExposure: position.MarketExposure === null ? null : Number(position.MarketExposure),
      realizedPnl: position.RealizedPnl === null ? null : Number(position.RealizedPnl)
    }));
    const markets: MarketSummary[] = marketsResult.recordset.map((market) => ({
      ticker: market.Ticker as string,
      title: market.Title as string,
      subtitle: market.Subtitle as string | null,
      status: market.Status as string,
      yesBid: market.YesBid === null ? null : Number(market.YesBid),
      yesAsk: market.YesAsk === null ? null : Number(market.YesAsk),
      volume: market.Volume === null ? null : Number(market.Volume),
      openInterest: market.OpenInterest === null ? null : Number(market.OpenInterest),
      closeTime: market.CloseTime as string | null
    }));
    return {
      account: {
        provider: "kalshi",
        currency: row.Currency as string,
        availableBalance: Number(row.AvailableBalance),
        portfolioValue: row.PortfolioValue === null ? null : Number(row.PortfolioValue),
        syncedAt: new Date(row.SyncedAt as Date).toISOString(),
        positions
      },
      markets
    };
  }

  private async insertPosition(
    request: sql.Request,
    userId: string,
    provider: "kalshi",
    position: PositionSummary,
    syncedAt: string
  ): Promise<void> {
    await request
      .input("userId", sql.NVarChar(200), userId)
      .input("provider", sql.NVarChar(40), provider)
      .input("ticker", sql.NVarChar(128), position.ticker)
      .input("title", sql.NVarChar(500), position.marketTitle)
      .input("count", sql.Decimal(19, 4), position.position)
      .input("exposure", sql.Decimal(19, 4), position.marketExposure)
      .input("pnl", sql.Decimal(19, 4), position.realizedPnl)
      .input("syncedAt", sql.DateTime2, new Date(syncedAt))
      .query(`INSERT INTO Positions (UserId, Provider, Ticker, MarketTitle, PositionCount, MarketExposure, RealizedPnl, SyncedAt)
        VALUES (@userId, @provider, @ticker, @title, @count, @exposure, @pnl, @syncedAt)`);
  }

  private async insertMarket(
    request: sql.Request,
    userId: string,
    provider: "kalshi",
    market: MarketSummary,
    syncedAt: string
  ): Promise<void> {
    await request
      .input("userId", sql.NVarChar(200), userId)
      .input("provider", sql.NVarChar(40), provider)
      .input("ticker", sql.NVarChar(128), market.ticker)
      .input("title", sql.NVarChar(500), market.title)
      .input("subtitle", sql.NVarChar(500), market.subtitle)
      .input("status", sql.NVarChar(40), market.status)
      .input("yesBid", sql.Decimal(19, 4), market.yesBid)
      .input("yesAsk", sql.Decimal(19, 4), market.yesAsk)
      .input("volume", sql.Decimal(19, 4), market.volume)
      .input("openInterest", sql.Decimal(19, 4), market.openInterest)
      .input("closeTime", sql.NVarChar(50), market.closeTime)
      .input("syncedAt", sql.DateTime2, new Date(syncedAt))
      .query(`INSERT INTO Markets (UserId, Provider, Ticker, Title, Subtitle, Status, YesBid, YesAsk, Volume, OpenInterest, CloseTime, SyncedAt)
        VALUES (@userId, @provider, @ticker, @title, @subtitle, @status, @yesBid, @yesAsk, @volume, @openInterest, @closeTime, @syncedAt)`);
  }
}
