import { useEffect, useMemo, useRef, useState } from "react";

import type { CoinGuide } from "../data/onboarding";
import { fetchCoinPrices } from "../lib/coinbase";
import { useMarketData, type Market } from "../providers/market-data";

type PriceState = {
  prices: Record<string, number>;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

const DEFAULT_REFRESH_MS = 90_000;

type CoinInput = Pick<CoinGuide, "symbol" | "coingeckoId">;

async function fetchCoingeckoPrices(coins: CoinInput[]): Promise<Record<string, number>> {
  const ids = Array.from(
    new Set(
      coins
        .map((coin) => coin.coingeckoId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  if (ids.length === 0) {
    return {};
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd,usdt`
    );

    if (!response.ok) {
      throw new Error(`Coingecko request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, { usd?: number; usdt?: number }>;
    const map: Record<string, number> = {};

    coins.forEach((coin) => {
      if (!coin.coingeckoId) {
        return;
      }
      const entry = payload[coin.coingeckoId];
      if (!entry) {
        return;
      }
      const candidate = entry.usdt ?? entry.usd;
      if (Number.isFinite(candidate) && (candidate as number) > 0) {
        map[coin.symbol.toUpperCase()] = candidate as number;
      }
    });

    return map;
  } catch (error) {
    console.warn("[coingecko] failed to fetch fallback prices", error);
    return {};
  }
}

function findMarketFallback(symbol: string, markets: Market[]) {
  const candidates = ["USDT", "USDC", "USD"].map((quote) => `${symbol}-${quote}`);
  const match = markets.find((market) =>
    candidates.some((candidate) => market.symbol.toUpperCase() === candidate)
  );
  return match?.markPrice ?? null;
}

export function useCoinPrices(coins: CoinInput[], refreshMs = DEFAULT_REFRESH_MS) {
  const [state, setState] = useState<PriceState>({
    prices: {},
    loading: true,
    error: null,
    lastUpdated: null
  });
  const mountedRef = useRef(true);
  const { markets } = useMarketData();

  const symbols = useMemo(
    () =>
      Array.from(
        new Set(
          coins
            .map((coin) => coin.symbol.toUpperCase())
            .filter((symbol): symbol is string => !!symbol)
        )
      ),
    [coins]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (symbols.length === 0) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null
      }));
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const prices = await fetchCoinPrices(symbols);
      const priceMap: Record<string, number> = { ...prices };

      const missingSymbols = symbols.filter((symbol) => priceMap[symbol] === undefined);

      if (missingSymbols.length > 0) {
        const coinsBySymbol = new Map(
          coins.map((coin) => [coin.symbol.toUpperCase(), coin] as const)
        );

        const withGecko = missingSymbols
          .map((symbol) => coinsBySymbol.get(symbol))
          .filter((coin): coin is CoinInput => !!coin && !!coin.coingeckoId);

        if (withGecko.length > 0) {
          const geckoPrices = await fetchCoingeckoPrices(withGecko);
          Object.assign(priceMap, geckoPrices);
        }

        const stillMissing = missingSymbols.filter((symbol) => priceMap[symbol] === undefined);

        if (stillMissing.length > 0 && markets.length > 0) {
          stillMissing.forEach((symbol) => {
            const fallback = findMarketFallback(symbol, markets);
            if (Number.isFinite(fallback) && (fallback as number) > 0) {
              priceMap[symbol] = fallback as number;
            }
          });
        }
      }

      if (!mountedRef.current) {
        return;
      }
      const normalizedPrices: Record<string, number> = {};
      Object.entries(priceMap).forEach(([symbol, value]) => {
        if (Number.isFinite(value) && value > 0) {
          normalizedPrices[symbol] = value;
        }
      });

      setState({
        prices: normalizedPrices,
        loading: false,
        error: Object.keys(normalizedPrices).length === 0 ? "No market data" : null,
        lastUpdated: Date.now()
      });
      if (refreshMs > 0) {
        timeoutId = setTimeout(load, refreshMs);
      }
    };

    load();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [symbols, refreshMs, coins, markets]);

  const getPriceForSymbol = (symbol: string) => {
    const normalized = symbol.toUpperCase();
    return state.prices[normalized];
  };

  return {
    ...state,
    getPriceForSymbol
  };
}
