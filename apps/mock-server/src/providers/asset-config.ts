import { AssetConfig } from "./types";

function resolveProvider(envKey: string, fallback: string) {
  return process.env[envKey] ?? fallback;
}

export const assetConfigs: AssetConfig[] = [
  {
    id: "BTC-PERP",
    displaySymbol: "BTC-USDT",
    provider: resolveProvider("MARKET_PROVIDER_BTC", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_BTC ?? "BTCUSDT"
    }
  },
  {
    id: "ETH-PERP",
    displaySymbol: "ETH-USDT",
    provider: resolveProvider("MARKET_PROVIDER_ETH", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_ETH ?? "ETHUSDT"
    }
  }
];
