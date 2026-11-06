import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import sql from "mssql";

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
if (!connectionString) throw new Error("Set AZURE_SQL_CONNECTION_STRING before running migrations.");

const pool = await new sql.ConnectionPool(connectionString).connect();
try {
  await pool.request().query(`IF OBJECT_ID('dbo.SchemaMigrations', 'U') IS NULL
    CREATE TABLE dbo.SchemaMigrations (Name nvarchar(200) NOT NULL PRIMARY KEY, AppliedAt datetime2 NOT NULL);`);
  const folder = join(process.cwd(), "db", "migrations");
  const files = (await readdir(folder)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    const exists = await pool.request().input("name", sql.NVarChar(200), name)
      .query("SELECT 1 FROM dbo.SchemaMigrations WHERE Name=@name");
    if (exists.recordset.length) continue;
    const text = await readFile(join(folder, name), "utf8");
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction).batch(text);
      await new sql.Request(transaction).input("name", sql.NVarChar(200), name)
        .query("INSERT INTO dbo.SchemaMigrations (Name, AppliedAt) VALUES (@name, SYSUTCDATETIME())");
      await transaction.commit();
      console.log(`Applied ${name}`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
} finally {
  await pool.close();
}
