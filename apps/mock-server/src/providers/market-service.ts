import { EventEmitter } from "node:events";

import { assetConfigs } from "./asset-config";
import { getProvider } from "./registry";
import { MarketData } from "./types";

const emitter = new EventEmitter();
const MARKET_UPDATED_EVENT = "marketUpdated";

let cache: MarketData[] = [];
let lastUpdated = 0;

const REFRESH_INTERVAL_MS = Number(process.env.MARKET_REFRESH_MS ?? 15_000);

export async function refreshMarkets() {
  const results: MarketData[] = [];

  for (const config of assetConfigs) {
    try {
      const provider = getProvider(config.provider);
      const data = await provider.fetch(config);
      results.push(data);
    } catch (error) {
      console.warn(`[markets] Failed to fetch ${config.id}`, error);
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
