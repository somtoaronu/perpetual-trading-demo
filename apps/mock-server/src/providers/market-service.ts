import { EventEmitter } from "node:events";

import { assetConfigs } from "./asset-config";
import { getProvider } from "./registry";
import { AssetConfig, MarketData } from "./types";

const emitter = new EventEmitter();
const MARKET_UPDATED_EVENT = "marketUpdated";

let cache: MarketData[] = [];
let lastUpdated = 0;

const REFRESH_INTERVAL_MS = Number(process.env.MARKET_REFRESH_MS ?? 15_000);

async function runProvider(
  baseConfig: AssetConfig,
  providerName: string,
  params: Record<string, string>
): Promise<MarketData> {
  const provider = getProvider(providerName);
  return provider.fetch({
    id: baseConfig.id,
    displaySymbol: baseConfig.displaySymbol,
    provider: providerName,
    params,
    fallback: baseConfig.fallback
  });
}

async function fetchWithFallback(config: AssetConfig): Promise<MarketData | null> {
  const attempts: Array<{ provider: string; params: Record<string, string>; label: string }> = [
    { provider: config.provider, params: config.params, label: "primary" }
  ];

  if (config.fallback) {
    attempts.push({
      provider: config.fallback.provider,
      params: config.fallback.params ?? config.params,
      label: "fallback"
    });
  }

  for (const attempt of attempts) {
    try {
      const data = await runProvider(config, attempt.provider, attempt.params);
      if (attempt.label === "fallback") {
        console.warn(
          `[markets] Using fallback provider ${attempt.provider} for ${config.id}`
        );
      }
      return data;
    } catch (error) {
      console.warn(
        `[markets] Failed to fetch ${config.id} via ${attempt.provider} (${attempt.label})`,
        error
      );
    }
  }

  const cached = cache.find((entry) => entry.id === config.id);
  if (cached) {
    console.warn(`[markets] Returning cached ${config.id} after provider failures`);
    return cached;
  }

  console.warn(`[markets] No market data available for ${config.id}`);
  return null;
}

export async function refreshMarkets() {
  const results: MarketData[] = [];

  for (const config of assetConfigs) {
    const data = await fetchWithFallback(config);
    if (data) {
      results.push(data);
    }
  }

  if (results.length > 0) {
    cache = results;
    lastUpdated = Date.now();
    emitter.emit(MARKET_UPDATED_EVENT, cache);
  }
}

export function getMarketsSnapshot() {
  return {
    markets: cache,
    lastUpdated
  };
}

let intervalHandle: NodeJS.Timeout | null = null;

export function startMarketPolling() {
  if (intervalHandle) {
    return;
  }

  void refreshMarkets();

  intervalHandle = setInterval(() => {
    void refreshMarkets();
  }, REFRESH_INTERVAL_MS);
}

export function stopMarketPolling() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export function subscribeToMarketUpdates(listener: (markets: MarketData[]) => void) {
  emitter.on(MARKET_UPDATED_EVENT, listener);
  return () => emitter.off(MARKET_UPDATED_EVENT, listener);
}
