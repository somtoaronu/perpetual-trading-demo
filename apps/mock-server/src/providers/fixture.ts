import { readFile } from "node:fs/promises";
import path from "node:path";

import { AssetConfig, MarketData, MarketProvider } from "./types";

type FixtureRecord = Partial<MarketData> & {
  id: string;
  symbol?: string;
};

type FixtureIndex = Record<string, FixtureRecord>;

const MODULE_DIR = __dirname;
const DEFAULT_FIXTURE_PATH = path.join(MODULE_DIR, "fixtures", "markets.json");

const DEFAULT_FIXTURE_DATA: FixtureRecord[] = [
  {
    id: "BTC-PERP",
    symbol: "BTC-USDT",
    markPrice: 64520.15,
    indexPrice: 64480.4,
    fundingRate: 0.00018,
    change24h: 2.4,
    openInterest: 328000000,
    volume24h: 8150000000
  },
  {
    id: "ETH-PERP",
    symbol: "ETH-USDT",
    markPrice: 3520.32,
    indexPrice: 3512.08,
    fundingRate: -0.00005,
    change24h: 1.9,
    openInterest: 152000000,
    volume24h: 2860000000
  },
  {
    id: "BNB-PERP",
    symbol: "BNB-USDT",
    markPrice: 598.42,
    indexPrice: 597.1,
    fundingRate: 0.00027,
    change24h: 3.2,
    openInterest: 64000000,
    volume24h: 940000000
  },
  {
    id: "SOL-PERP",
    symbol: "SOL-USDT",
    markPrice: 178.65,
    indexPrice: 177.9,
    fundingRate: 0.00054,
    change24h: 4.8,
    openInterest: 48500000,
    volume24h: 760000000
  },
  {
    id: "ASTR-PERP",
    symbol: "ASTR-USDT",
    markPrice: 0.136,
    indexPrice: 0.1354,
    fundingRate: 0.0009,
    change24h: 5.3,
    openInterest: 8200000,
    volume24h: 28500000
  },
  {
    id: "HYPE-PERP",
    symbol: "HYPE-USDT",
    markPrice: 142.6,
    indexPrice: 143.1,
    fundingRate: 0.0012,
    change24h: 6.7,
    openInterest: 12500000,
    volume24h: 198000000
  }
];

const BUILTIN_INDEX = buildIndex(DEFAULT_FIXTURE_DATA);
const fixtureCache = new Map<string, FixtureIndex>();

function buildIndex(records: FixtureRecord[]): FixtureIndex {
  const index: FixtureIndex = {};
  records.forEach((entry) => {
    if (!entry.id) {
      return;
    }
    index[entry.id.toUpperCase()] = entry;
  });
  return index;
}

async function loadFixture(
  targetPath: string,
  allowBuiltinFallback: boolean
): Promise<FixtureIndex> {
  const normalized = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(MODULE_DIR, targetPath);

  const cached = fixtureCache.get(normalized);
  if (cached) {
    return cached;
  }

  try {
    const raw = await readFile(normalized, "utf-8");
    const data = JSON.parse(raw) as FixtureRecord[];
    const index = buildIndex(data);
    fixtureCache.set(normalized, index);
    return index;
  } catch (error) {
    if (!allowBuiltinFallback) {
      throw error;
    }
    fixtureCache.set(normalized, BUILTIN_INDEX);
    return BUILTIN_INDEX;
  }
}

export const fixtureProvider: MarketProvider = {
  async fetch(config: AssetConfig): Promise<MarketData> {
    const params = config.params ?? {};
    const pathParam = params.path;
    const usingDefaultPath = !pathParam || pathParam.length === 0;
    const fixturePath = usingDefaultPath ? DEFAULT_FIXTURE_PATH : pathParam;

    const index = await loadFixture(fixturePath, usingDefaultPath);
    const key = config.id.toUpperCase();
    const record = index[key];

    if (!record) {
      throw new Error(`Fixture provider missing entry for ${config.id}`);
    }

    const now = Date.now();

    return {
      id: config.id,
      symbol: record.symbol ?? config.displaySymbol,
      markPrice: record.markPrice ?? 0,
      indexPrice: record.indexPrice ?? record.markPrice ?? 0,
      fundingRate: record.fundingRate ?? 0,
      change24h: record.change24h ?? 0,
      openInterest: record.openInterest ?? 0,
      volume24h: record.volume24h ?? 0,
      provider: config.provider,
      timestamp: record.timestamp ?? now
    };
  }
};
