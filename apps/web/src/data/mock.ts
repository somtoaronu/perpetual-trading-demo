import { addMinutes, format } from "date-fns";

const now = new Date();

export const markets = [
  {
    symbol: "ETH-USDC",
    markPrice: 3215.34,
    indexPrice: 3212.87,
    change24h: 1.87,
    fundingRate: 0.015,
    openInterest: 182345678,
    volume24h: 568_123_441,
    status: "live" as const
  },
  {
    symbol: "BTC-USDC",
    markPrice: 61234.56,
    indexPrice: 61210.12,
    change24h: -0.63,
    fundingRate: -0.004,
    openInterest: 242345901,
    volume24h: 742_234_112,
    status: "live" as const
  },
  {
    symbol: "SOL-USDC",
    markPrice: 178.54,
    indexPrice: 178.22,
    change24h: 3.12,
    fundingRate: 0.021,
    openInterest: 54231234,
    volume24h: 112_991_221,
    status: "hot" as const
  },
  {
    symbol: "NVDA-USD",
    markPrice: 113.42,
    indexPrice: 113.12,
    change24h: 0.95,
    fundingRate: 0.008,
    openInterest: 21234565,
    volume24h: 87_331_120,
    status: "equities" as const
  },
  {
    symbol: "SPX-USD",
    markPrice: 5285.4,
    indexPrice: 5280.9,
    change24h: 0.41,
    fundingRate: 0.001,
    openInterest: 13456789,
    volume24h: 45_998_112,
    status: "equities" as const
  }
];

export const priceSeries = Array.from({ length: 60 }).map((_, idx) => {
  const timestamp = addMinutes(now, idx - 59);
  return {
    time: format(timestamp, "HH:mm"),
    price: 3180 + Math.sin(idx / 4) * 25 + Math.random() * 8,
    volume: 150 + Math.random() * 40
  };
});

export const orderBook = {
  bids: [
    { price: 3215.2, size: 220 },
    { price: 3215.0, size: 145 },
    { price: 3214.8, size: 320 },
    { price: 3214.6, size: 95 },
    { price: 3214.2, size: 188 },
    { price: 3214.0, size: 255 }
  ],
  asks: [
    { price: 3215.4, size: 210 },
    { price: 3215.6, size: 332 },
    { price: 3215.8, size: 150 },
    { price: 3216.0, size: 120 },
    { price: 3216.4, size: 205 },
    { price: 3216.6, size: 320 }
  ]
};

export const trades = Array.from({ length: 12 }).map((_, idx) => ({
  id: `trade-${idx}`,
  side: idx % 2 === 0 ? "buy" : "sell",
  price: 3215.2 + (idx % 2 === 0 ? 0.1 : -0.12) * idx,
  size: 12 + idx * 0.7,
  time: format(addMinutes(now, -idx * 3), "HH:mm")
}));

export const positions = [
  {
    symbol: "ETH-USDC",
    side: "Long",
    size: 2.5,
    entryPrice: 3188.5,
    markPrice: 3215.34,
    leverage: 10,
    pnl: 67.1,
    pnlPct: 8.4,
    liqPrice: 2960.2,
    marginMode: "Isolated",
    funding: -8.54
  },
  {
    symbol: "NVDA-USD",
    side: "Short",
    size: 45,
    entryPrice: 116.8,
    markPrice: 113.42,
    leverage: 5,
    pnl: 152.4,
    pnlPct: 12.1,
    liqPrice: 124.6,
    marginMode: "Cross",
    funding: 4.32
  }
];

export const fundingEvents = Array.from({ length: 6 }).map((_, idx) => ({
  time: format(addMinutes(now, idx * 5), "HH:mm"),
  rate: 0.015 - idx * 0.002,
  projectedImpact: 3.21 - idx * 0.4
}));

export const tutorialSteps = [
  {
    title: "Perps 101",
    summary: "Understand mark vs. index price, and why funding keeps them aligned."
  },
  {
    title: "Margin & Leverage",
    summary: "Choose between isolated or cross margin depending on risk tolerance."
  },
  {
    title: "Order Types",
    summary: "Use Market for immediacy or Limit for price control; combine with TP/SL."
  },
  {
    title: "Funding Payments",
    summary: "Monitor funding countdown and expected credits or debits each cycle."
  },
  {
    title: "Advanced Metrics",
    summary: "Read liquidity footprint, open interest, and account leverage in Pro mode."
  }
];

export const strategyPresets = [
  {
    name: "Breakout Long",
    description: "Eases beginners in with 5x leverage and 1% stop loss.",
    settings: { leverage: 5, takeProfit: 2, stopLoss: 1 }
  },
  {
    name: "Mean Reversion",
    description: "Short-term fades with 3x leverage, uses trailing stop.",
    settings: { leverage: 3, takeProfit: 1.2, stopLoss: 0.8 }
  },
  {
    name: "Basis Trade",
    description: "Professional mode template pairing positive funding with hedge.",
    settings: { leverage: 8, takeProfit: 1.5, stopLoss: 1 }
  }
];
