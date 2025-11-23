import { AssetConfig, MarketData, MarketProvider } from "./types";

type NumericOptions = {
  basePrice?: string;
  amplitude?: string;
  change24h?: string;
  fundingRate?: string;
};

const DEFAULT_BASE_PRICE = 150;
const DEFAULT_AMPLITUDE = 12;
const DEFAULT_CHANGE_24H = 2.1;
const DEFAULT_FUNDING_RATE = 0.012;

function resolveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const syntheticIndexProvider: MarketProvider = {
  async fetch(config: AssetConfig): Promise<MarketData> {
    const params = config.params as NumericOptions;
    const basePrice = resolveNumber(params.basePrice, DEFAULT_BASE_PRICE);
    const amplitude = resolveNumber(params.amplitude, DEFAULT_AMPLITUDE);
    const change24h = resolveNumber(params.change24h, DEFAULT_CHANGE_24H);
    const fundingRate = resolveNumber(params.fundingRate, DEFAULT_FUNDING_RATE);

    const time = Date.now();
    const cycle = Math.sin(time / 600_000);
    const variance = Math.cos(time / 240_000) * 0.5;
    const markPrice = basePrice + amplitude * cycle;
    const indexPrice = markPrice * (1 + variance / 100);

    return {
      id: config.id,
      symbol: config.displaySymbol,
      markPrice,
      indexPrice,
      fundingRate,
      change24h,
      openInterest: Math.abs(markPrice * 3_500),
      volume24h: Math.abs(markPrice * 125_000),
      provider: config.provider,
      timestamp: time
    };
  }
};
