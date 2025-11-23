import { binancePerpProvider } from "./binance-perp";
import { fixtureProvider } from "./fixture";
import { syntheticIndexProvider } from "./synthetic";
import { MarketProvider } from "./types";

const providers: Record<string, MarketProvider> = {
  "binance-perp": binancePerpProvider,
  "synthetic-index": syntheticIndexProvider,
  fixture: fixtureProvider
};

export function getProvider(key: string): MarketProvider {
  const provider = providers[key];
  if (!provider) {
    throw new Error(`Unknown market provider: ${key}`);
  }
  return provider;
}
