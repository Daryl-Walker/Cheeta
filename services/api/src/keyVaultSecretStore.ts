import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import type { ProviderCredentials, SecretStore } from "./model.js";

export class KeyVaultSecretStore implements SecretStore {
  private readonly client: SecretClient;

  constructor(vaultUrl: string) {
    this.client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  }

  async put(secretRef: string, credentials: ProviderCredentials): Promise<void> {
    await this.client.setSecret(secretRef, JSON.stringify(credentials), {
      contentType: "application/json"
    });
  }

  async get(secretRef: string): Promise<ProviderCredentials> {
    const secret = await this.client.getSecret(secretRef);
    if (!secret.value) throw new Error("Provider credentials are not available.");
    return JSON.parse(secret.value) as ProviderCredentials;
  }

  async delete(secretRef: string): Promise<void> {
    const operation = await this.client.beginDeleteSecret(secretRef);
    await operation.pollUntilDone();
  }
}
