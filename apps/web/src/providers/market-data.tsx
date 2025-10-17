import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { requireApiBase } from "../lib/api-base";

export type Market = {
  id: string;
  symbol: string;
  markPrice: number;
  indexPrice: number;
  fundingRate: number;
  change24h: number;
  openInterest: number;
  volume24h: number;
  provider: string;
  timestamp: number;
};

type MarketContextValue = {
  markets: Market[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const MarketDataContext = createContext<MarketContextValue | null>(null);

const DEFAULT_REFRESH_MS = 15_000;

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = requireApiBase();
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        setError(null);
        const response = await fetch(`${baseUrl}/markets`);
        if (!response.ok) {
          throw new Error(`Failed to load markets: ${response.status}`);
        }
        const payload = (await response.json()) as Market[];
        if (!cancelled) {
          setMarkets(payload);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[markets] failed to fetch live data", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    };

    void load();
    timer = setInterval(() => {
      void load();
    }, DEFAULT_REFRESH_MS);

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    const baseUrl = requireApiBase();
    fetch(`${baseUrl}/markets`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load markets: ${response.status}`);
        }
        return response.json();
      })
      .then((payload: Market[]) => {
        setMarkets(payload);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.warn("[markets] manual refresh failed", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  };

  const value = useMemo<MarketContextValue>(
    () => ({
      markets,
      loading,
      error,
      refresh
    }),
    [markets, loading, error]
  );

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error("useMarketData must be used within a MarketDataProvider");
  }
  return context;
}
