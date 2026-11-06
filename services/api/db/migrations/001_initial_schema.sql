CREATE TABLE dbo.LinkedProviders (
  UserId nvarchar(200) NOT NULL,
  Provider nvarchar(40) NOT NULL,
  SecretRef nvarchar(128) NOT NULL,
  LinkedAt datetime2 NOT NULL,
  CONSTRAINT PK_LinkedProviders PRIMARY KEY (UserId, Provider)
);

CREATE TABLE dbo.AccountSnapshots (
  UserId nvarchar(200) NOT NULL,
  Provider nvarchar(40) NOT NULL,
  Currency nvarchar(8) NOT NULL,
  AvailableBalance decimal(19,4) NOT NULL,
  PortfolioValue decimal(19,4) NULL,
  SyncedAt datetime2 NOT NULL,
  CONSTRAINT PK_AccountSnapshots PRIMARY KEY (UserId, Provider)
);

CREATE TABLE dbo.Positions (
  UserId nvarchar(200) NOT NULL,
  Provider nvarchar(40) NOT NULL,
  Ticker nvarchar(128) NOT NULL,
  MarketTitle nvarchar(500) NOT NULL,
  PositionCount decimal(19,4) NOT NULL,
  MarketExposure decimal(19,4) NULL,
  RealizedPnl decimal(19,4) NULL,
  SyncedAt datetime2 NOT NULL,
  CONSTRAINT PK_Positions PRIMARY KEY (UserId, Provider, Ticker)
);

CREATE TABLE dbo.Markets (
  UserId nvarchar(200) NOT NULL,
  Provider nvarchar(40) NOT NULL,
  Ticker nvarchar(128) NOT NULL,
  Title nvarchar(500) NOT NULL,
  Subtitle nvarchar(500) NULL,
  Status nvarchar(40) NOT NULL,
  YesBid decimal(19,4) NULL,
  YesAsk decimal(19,4) NULL,
  Volume decimal(19,4) NULL,
  OpenInterest decimal(19,4) NULL,
  CloseTime nvarchar(50) NULL,
  SyncedAt datetime2 NOT NULL,
  CONSTRAINT PK_Markets PRIMARY KEY (UserId, Provider, Ticker)
);
