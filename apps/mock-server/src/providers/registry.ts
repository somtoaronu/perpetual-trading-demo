import { binancePerpProvider } from "./binance-perp";
import { MarketProvider } from "./types";

const providers: Record<string, MarketProvider> = {
  "binance-perp": binancePerpProvider
};

export function getProvider(key: string): MarketProvider {
  const provider = providers[key];
  if (!provider) {
    throw new Error(`Unknown market provider: ${key}`);
  }
  return provider;
}
