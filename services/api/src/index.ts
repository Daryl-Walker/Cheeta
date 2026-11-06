import "dotenv/config";
import { createApp } from "./app.js";
import { KeyVaultSecretStore } from "./keyVaultSecretStore.js";
import { MemoryRepository, MemorySecretStore } from "./memoryStore.js";
import { SqlRepository } from "./sqlRepository.js";

const port = Number(process.env.PORT ?? 4000);
const sqlConnection = process.env.AZURE_SQL_CONNECTION_STRING;
const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
if (process.env.NODE_ENV === "production" && (!sqlConnection || !vaultUrl)) {
  throw new Error("Production requires AZURE_SQL_CONNECTION_STRING and AZURE_KEY_VAULT_URL.");
}

const app = createApp({
  repository: sqlConnection ? new SqlRepository(sqlConnection) : new MemoryRepository(),
  secrets: vaultUrl ? new KeyVaultSecretStore(vaultUrl) : new MemorySecretStore()
});

app.listen(port, () => {
  console.log(`Cheeta API listening on port ${port}`);
});
