import type { DashboardSnapshot } from "@cheeta/contracts";
import type { LinkedProvider, ProviderCredentials, Repository, SecretStore } from "./model.js";

export class MemoryRepository implements Repository {
  private readonly links = new Map<string, LinkedProvider>();
  private readonly dashboards = new Map<string, DashboardSnapshot>();

  async getLink(userId: string, provider: "kalshi"): Promise<LinkedProvider | null> {
    return this.links.get(`${userId}:${provider}`) ?? null;
  }

  async saveLink(link: LinkedProvider): Promise<void> {
    this.links.set(`${link.userId}:${link.provider}`, link);
  }

  async removeLink(userId: string, provider: "kalshi"): Promise<void> {
    this.links.delete(`${userId}:${provider}`);
    this.dashboards.delete(userId);
  }

  async saveDashboard(userId: string, snapshot: DashboardSnapshot): Promise<void> {
    this.dashboards.set(userId, snapshot);
  }

  async getDashboard(userId: string): Promise<DashboardSnapshot | null> {
    return this.dashboards.get(userId) ?? null;
  }
}

export class MemorySecretStore implements SecretStore {
  private readonly secrets = new Map<string, ProviderCredentials>();

  async put(secretRef: string, credentials: ProviderCredentials): Promise<void> {
    this.secrets.set(secretRef, credentials);
  }

  async get(secretRef: string): Promise<ProviderCredentials> {
    const value = this.secrets.get(secretRef);
    if (!value) throw new Error("Provider credentials are not available.");
    return value;
  }

  async delete(secretRef: string): Promise<void> {
    this.secrets.delete(secretRef);
  }
}
