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
  },
  {
    id: "BNB-PERP",
    displaySymbol: "BNB-USDT",
    provider: resolveProvider("MARKET_PROVIDER_BNB", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_BNB ?? "BNBUSDT"
    }
  },
  {
    id: "SOL-PERP",
    displaySymbol: "SOL-USDT",
    provider: resolveProvider("MARKET_PROVIDER_SOL", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_SOL ?? "SOLUSDT"
    }
  },
  {
    id: "ASTR-PERP",
    displaySymbol: "ASTR-USDT",
    provider: resolveProvider("MARKET_PROVIDER_ASTR", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_ASTR ?? "ASTRUSDT"
    }
  },
  {
    id: "HYPE-PERP",
    displaySymbol: "HYPE-USDT",
    provider: resolveProvider("MARKET_PROVIDER_HYPE", "synthetic-index"),
    params: {
      basePrice: process.env.MARKET_BASE_HYPE ?? "140",
      amplitude: process.env.MARKET_AMPLITUDE_HYPE ?? "18",
      change24h: process.env.MARKET_CHANGE24H_HYPE ?? "4.5",
      fundingRate: process.env.MARKET_FUNDING_HYPE ?? "0.018"
    }
  }
];
