import type { ModelSpecs } from "./model-catalog.js";

export interface CachedModelList {
  provider: string;
  models: ModelSpecs[];
  cachedAt: number;
  ttlMs: number;
}

/**
 * DynamicModelCache.
 * Absorbed from packages/catalog/src/model-cache.ts (Pass 32 / ADR-012).
 *
 * Caches model catalog queries per provider with configurable TTL expiration.
 */
export class DynamicModelCache {
  private readonly cache = new Map<string, CachedModelList>();

  setCachedModels(provider: string, models: ModelSpecs[], ttlMs = 3600_000): void {
    this.cache.set(provider.toLowerCase(), {
      provider,
      models,
      cachedAt: Date.now(),
      ttlMs,
    });
  }

  getCachedModels(provider: string): ModelSpecs[] | null {
    const entry = this.cache.get(provider.toLowerCase());
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      this.cache.delete(provider.toLowerCase());
      return null;
    }

    return entry.models;
  }

  clear(): void {
    this.cache.clear();
  }
}
