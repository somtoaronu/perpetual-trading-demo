import { AssetConfig } from "./types";

function resolveProvider(envKey: string, fallback: string) {
  return process.env[envKey] ?? fallback;
}

function fixtureParams() {
  const path = process.env.MARKET_FIXTURE_PATH ?? "./fixtures/markets.json";
  return { path };
}

function createFallback(envKey: string): AssetConfig["fallback"] {
  const provider = resolveProvider(envKey, "fixture");
  if (provider === "fixture") {
    return {
      provider,
      params: fixtureParams()
    };
  }
  return { provider };
}

function createAstrFallback(): AssetConfig["fallback"] {
  const configured = process.env.MARKET_PROVIDER_ASTR_FALLBACK;
  if (configured === "synthetic-index") {
    return {
      provider: "synthetic-index",
      params: {
        basePrice: process.env.MARKET_BASE_ASTR ?? "0.13",
        amplitude: process.env.MARKET_AMPLITUDE_ASTR ?? "0.04",
        change24h: process.env.MARKET_CHANGE24H_ASTR ?? "3.8",
        fundingRate: process.env.MARKET_FUNDING_ASTR ?? "0.009"
      }
    };
  }

  if (configured && configured.length > 0 && configured !== "fixture") {
    return { provider: configured };
  }

  return {
    provider: "fixture",
    params: fixtureParams()
  };
}

export const assetConfigs: AssetConfig[] = [
  {
    id: "BTC-PERP",
    displaySymbol: "BTC-USDT",
    provider: resolveProvider("MARKET_PROVIDER_BTC", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_BTC ?? "BTCUSDT"
    },
    fallback: createFallback("MARKET_PROVIDER_BTC_FALLBACK")
  },
  {
    id: "ETH-PERP",
    displaySymbol: "ETH-USDT",
    provider: resolveProvider("MARKET_PROVIDER_ETH", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_ETH ?? "ETHUSDT"
    },
    fallback: createFallback("MARKET_PROVIDER_ETH_FALLBACK")
  },
  {
    id: "BNB-PERP",
    displaySymbol: "BNB-USDT",
    provider: resolveProvider("MARKET_PROVIDER_BNB", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_BNB ?? "BNBUSDT"
    },
    fallback: createFallback("MARKET_PROVIDER_BNB_FALLBACK")
  },
  {
    id: "SOL-PERP",
    displaySymbol: "SOL-USDT",
    provider: resolveProvider("MARKET_PROVIDER_SOL", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_SOL ?? "SOLUSDT"
    },
    fallback: createFallback("MARKET_PROVIDER_SOL_FALLBACK")
  },
  {
    id: "ASTR-PERP",
    displaySymbol: "ASTR-USDT",
    provider: resolveProvider("MARKET_PROVIDER_ASTR", "binance-perp"),
    params: {
      symbol: process.env.MARKET_SYMBOL_ASTR ?? "ASTRUSDT"
    },
    fallback: createAstrFallback()
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
    },
    fallback: createFallback("MARKET_PROVIDER_HYPE_FALLBACK")
  }
];
