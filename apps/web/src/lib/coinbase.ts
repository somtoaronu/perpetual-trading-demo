type PriceMap = Record<string, number>;

type CacheEntry = {
  timestamp: number;
  data: PriceMap;
};

const CACHE_TTL_MS = 45_000;
const cache = new Map<string, CacheEntry>();

function buildCacheKey(symbols: string[]) {
  return symbols.slice().sort().join(",");
}

async function fetchSpotForSymbol(symbol: string): Promise<number | null> {
  // Stablecoins map to 1:1 in practice; shortcut to reduce API load.
  if (symbol === "USDT" || symbol === "USDC") {
    return 1;
  }

  try {
    const response = await fetch(
      `https://api.coinbase.com/v2/exchange-rates?currency=${encodeURIComponent(symbol)}`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Coinbase request failed with status ${response.status}`);
    }

    const json = (await response.json()) as {
      data?: { rates?: Record<string, string> };
    };

    const rates = json.data?.rates;
    if (!rates) {
      return null;
    }

    const raw = rates.USDT ?? rates.USD;
    if (!raw) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    console.warn(`[coinbase] failed to fetch rate for ${symbol}`, error);
    return null;
  }
}

export async function fetchCoinPrices(symbols: string[]): Promise<PriceMap> {
  if (symbols.length === 0) {
    return {};
  }

  const normalized = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase())));
  const cacheKey = buildCacheKey(normalized);
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const priceMap: PriceMap = cached?.data ? { ...cached.data } : {};

  await Promise.all(
    normalized.map(async (symbol) => {
      const price = await fetchSpotForSymbol(symbol);
      if (price !== null) {
        priceMap[symbol] = price;
      }
    })
  );

  if (Object.keys(priceMap).length > 0) {
    cache.set(cacheKey, { timestamp: now, data: priceMap });
    return priceMap;
  }

  if (cached) {
    return cached.data;
  }

  return {};
}

