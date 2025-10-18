export type MarketData = {
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

export type AssetConfig = {
  id: string;
  displaySymbol: string;
  provider: string;
  params: Record<string, string>;
  fallback?: {
    provider: string;
    params?: Record<string, string>;
  };
};

export interface MarketProvider {
  fetch(config: AssetConfig): Promise<MarketData>;
}
