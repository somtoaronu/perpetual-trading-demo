export type EvaluationWindow = {
  id: "1h" | "4h" | "12h" | "24h";
  label: string;
  description: string;
  bestFor: string;
};

export type PlatformGuide = {
  id: "hyperliquid" | "aster" | "custom";
  name: string;
  tagline: string;
  overview: string;
  whyBeginnersLikeIt: string;
  backendConfig: {
    rpcUrlEnvKey: string;
    apiKeyEnvKey: string;
  };
  maxLeverage: number;
  leverageReminder: string;
  fundingNotes: string;
  defaultEvaluationWindow: EvaluationWindow["id"];
};

export type CoinGuide = {
  symbol: "BTC" | "BNB" | "SOL" | "ASTR" | "HYPE" | "USDT";
  name: string;
  summary: string;
  whyItMoves: string;
  pairedWith: string;
  enabled: boolean;
  coingeckoId?: string | null;
};

export const evaluationWindows: EvaluationWindow[] = [
  {
    id: "1h",
    label: "1 hour",
    description: "Quick check-in to see if your thesis plays out shortly after entry.",
    bestFor: "Scalps and event-driven ideas where you want rapid feedback."
  },
  {
    id: "4h",
    label: "4 hours",
    description: "Balances reaction time with enough breathing room for typical volatility.",
    bestFor: "Day trades or sessions where you plan to monitor price action."
  },
  {
    id: "12h",
    label: "12 hours",
    description: "Lets the market digest news cycles without locking you in overnight.",
    bestFor: "Swing attempts that still need a same-day result."
  },
  {
    id: "24h",
    label: "24 hours",
    description: "Full-day view that smooths noise and highlights core trend direction.",
    bestFor: "Beginners who prefer fewer check-ins and want clearer signal vs. noise."
  }
];

export const platformGuides: PlatformGuide[] = [
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    tagline: "Deep liquidity without leaving your browser.",
    overview:
      "Hyperliquid is a Layer-2 perpetuals venue that prioritises tight spreads and quick order execution. You trade directly from your wallet, so funds stay in your custody.",
    whyBeginnersLikeIt:
      "Simple order tickets and a familiar exchange layout make it less intimidating. The platform handles funding automatically and emphasises risk stats at the top of the screen.",
    backendConfig: {
      rpcUrlEnvKey: "HYPERLIQUID_RPC_URL",
      apiKeyEnvKey: "HYPERLIQUID_API_KEY"
    },
    maxLeverage: 25,
    leverageReminder:
      "We cap leverage at 25x here so early trades have room to breathe without instant liquidation.",
    fundingNotes:
      "Funding is settled every eight hours; green highlights mean you earn credits on longs, red means you pay.",
    defaultEvaluationWindow: "4h"
  },
  {
    id: "aster",
    name: "Aster",
    tagline: "Curated for cautious traders who value guidance.",
    overview:
      "Aster offers a teaching-friendly interface with built-in playbooks and portfolio health checks. You can copy best-practice risk settings while you learn.",
    whyBeginnersLikeIt:
      "On-screen helpers explain margin math as you adjust leverage, and the dashboard surfaces your breakeven price before you confirm any trade.",
    backendConfig: {
      rpcUrlEnvKey: "ASTER_RPC_URL",
      apiKeyEnvKey: "ASTER_API_KEY"
    },
    maxLeverage: 15,
    leverageReminder:
      "Aster keeps the ceiling at 15x so volatility swings stay manageable during the learning phase.",
    fundingNotes:
      "Funding settles every four hours and is displayed as a simple credit-or-debit badge beside your open position.",
    defaultEvaluationWindow: "12h"
  },
  {
    id: "custom",
    name: "Custom Workspace",
    tagline: "Bring your own infrastructure when you’re ready.",
    overview:
      "The custom option connects to the venue your team prefers. We pre-fill the credentials stored in the backend so you avoid pasting sensitive keys in the browser.",
    whyBeginnersLikeIt:
      "You still get our safety guardrails—leverage caps, alerts, and plain-language summaries—but can mirror the environment you plan to use long term.",
    backendConfig: {
      rpcUrlEnvKey: "CUSTOM_RPC_URL",
      apiKeyEnvKey: "CUSTOM_API_KEY"
    },
    maxLeverage: 50,
    leverageReminder:
      "Because this setup mirrors pro conditions, we allow up to 50x leverage—double-check position size before confirming.",
    fundingNotes:
      "Funding cadence depends on the connected venue; we surface the countdown and expected rate once the session begins.",
    defaultEvaluationWindow: "1h"
  }
];

export const coinGuides: CoinGuide[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    summary:
      "Bitcoin is the original cryptocurrency and often leads overall market direction.",
    whyItMoves:
      "Price reacts strongly to macro headlines, ETF flows, and changes in Federal Reserve guidance.",
    pairedWith: "USDT",
    enabled: true,
    coingeckoId: "bitcoin"
  },
  {
    symbol: "BNB",
    name: "BNB",
    summary:
      "BNB powers the BNB Chain ecosystem and offers discounts across Binance products.",
    whyItMoves:
      "Ecosystem updates, token burns, and regulatory news tied to Binance can cause abrupt swings.",
    pairedWith: "USDT",
    enabled: true,
    coingeckoId: "binancecoin"
  },
  {
    symbol: "SOL",
    name: "Solana",
    summary:
      "Solana focuses on high-speed smart contracts and a growing DeFi plus NFT ecosystem.",
    whyItMoves:
      "Network performance, daily active users, and launch activity often drive sharp bursts of volatility.",
    pairedWith: "USDT",
    enabled: true,
    coingeckoId: "solana"
  },
  {
    symbol: "ASTR",
    name: "Astar",
    summary:
      "Astar connects Polkadot with EVM builders and emphasises developer incentives.",
    whyItMoves:
      "Partnership announcements and Polkadot slot updates tend to move price more than broader market trends.",
    pairedWith: "USDT",
    enabled: true,
    coingeckoId: "astar"
  },
  {
    symbol: "HYPE",
    name: "Hype Index",
    summary:
      "Hype tracks a basket of trending memecoins, offering exposure to social sentiment in one trade.",
    whyItMoves:
      "Mentions on social media and influencer campaigns can swing the index quickly—expect fast reversals.",
    pairedWith: "USDT",
    enabled: true,
    coingeckoId: null
  },
  {
    symbol: "USDT",
    name: "Tether",
    summary:
      "USDT is a U.S. dollar-pegged stablecoin used here as the quote asset for every market.",
    whyItMoves:
      "It usually holds its peg; track liquidity conditions if you see price deviate more than a few basis points.",
    pairedWith: "USDT",
    enabled: true,
    coingeckoId: "tether"
  }
];
