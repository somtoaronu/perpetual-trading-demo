import { AssetConfig, MarketData, MarketProvider } from "./types";

type BinancePremiumIndex = {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
};

type Binance24HrTicker = {
  priceChangePercent: string;
  quoteVolume: string;
  openInterest: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export const binancePerpProvider: MarketProvider = {
  async fetch(config: AssetConfig): Promise<MarketData> {
    const symbol = config.params.symbol;
    if (!symbol) {
      throw new Error(`Missing Binance symbol for ${config.id}`);
    }

    const [premium, ticker] = await Promise.all([
      fetchJson<BinancePremiumIndex>(
        `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`
      ),
      fetchJson<Binance24HrTicker>(
        `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`
      )
    ]);

    const markPrice = Number(premium.markPrice);
    const indexPrice = Number(premium.indexPrice);
    const fundingRate = Number(premium.lastFundingRate);
    const change24h = Number(ticker.priceChangePercent);
    const volume24h = Number(ticker.quoteVolume);
    const openInterest = Number(ticker.openInterest);

    return {
      id: config.id,
      symbol: config.displaySymbol,
      markPrice: Number.isFinite(markPrice) ? markPrice : 0,
      indexPrice: Number.isFinite(indexPrice) ? indexPrice : 0,
      fundingRate: Number.isFinite(fundingRate) ? fundingRate : 0,
      change24h: Number.isFinite(change24h) ? change24h : 0,
      openInterest: Number.isFinite(openInterest) ? openInterest : 0,
      volume24h: Number.isFinite(volume24h) ? volume24h : 0,
      provider: config.provider,
      timestamp: Date.now()
    };
  }
};
