import { useEffect, useMemo, useRef, useState } from "react";

import type { CoinGuide } from "../data/onboarding";
import { fetchCoinPrices } from "../lib/coinbase";

type PriceState = {
  prices: Record<string, number>;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

const DEFAULT_REFRESH_MS = 90_000;

export function useCoinPrices(
  coins: Array<Pick<CoinGuide, "symbol">>,
  refreshMs = DEFAULT_REFRESH_MS
) {
  const [state, setState] = useState<PriceState>({
    prices: {},
    loading: true,
    error: null,
    lastUpdated: null
  });
  const mountedRef = useRef(true);

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
      if (!mountedRef.current) {
        return;
      }
      setState({
        prices,
        loading: false,
        error: Object.keys(prices).length === 0 ? "No market data" : null,
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
  }, [symbols, refreshMs]);

  const getPriceForSymbol = (symbol: string) => {
    const normalized = symbol.toUpperCase();
    return state.prices[normalized];
  };

  return {
    ...state,
    getPriceForSymbol
  };
}
