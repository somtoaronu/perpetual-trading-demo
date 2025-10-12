import { useMemo } from "react";

import { useOnboarding } from "../providers/onboarding";
import { useMarketData, type Market } from "../providers/market-data";

type Direction = "long" | "short";

const EVALUATION_WINDOW_MINUTES: Record<string, number> = {
  "1h": 60,
  "4h": 240,
  "12h": 720,
  "24h": 1_440
};

const DEFAULT_MOVE_BY_WINDOW: Record<string, number> = {
  "1h": 0.01,
  "4h": 0.015,
  "12h": 0.02,
  "24h": 0.03
};

const DEFAULT_MAINTENANCE_MARGIN = 0.006; // 0.6%

export function usePlanMetrics() {
  const { selection, lastSubmission } = useOnboarding();
  const { markets } = useMarketData();

  const metrics = useMemo(() => {
    const { coinSymbol, leverage, stake, evaluationWindow, predictionDirection } = selection;
    const direction: Direction = predictionDirection ?? "long";
    const leverageValue = leverage || 1;
    const stakeValue = stake || 0;
    const windowKey = evaluationWindow || "4h";
    const windowMinutes = EVALUATION_WINDOW_MINUTES[windowKey] ?? 240;
    const movePct = DEFAULT_MOVE_BY_WINDOW[windowKey] ?? 0.015;

    const market = findMarket(markets, coinSymbol);
    const markPrice = market?.markPrice ?? 1;
    const fundingRate = market?.fundingRate ?? 0;
    const entryPrice = markPrice;
    const notional = stakeValue * leverageValue;
    const liquidationPrice = estimateLiquidationPrice({
      direction,
      entryPrice,
      leverage: leverageValue,
      maintenance: DEFAULT_MAINTENANCE_MARGIN
    });

    const targetPrice = entryPrice * (1 + movePct * (direction === "long" ? 1 : -1));
    const pnlUp = projectPnl({
      direction,
      entryPrice,
      movePct,
      leverage: leverageValue,
      stake: stakeValue,
      positiveMove: true
    });
    const pnlDown = projectPnl({
      direction,
      entryPrice,
      movePct,
      leverage: leverageValue,
      stake: stakeValue,
      positiveMove: false
    });
    const fundingEstimate =
      notional * fundingRate * (windowMinutes / 480);

    return {
      markPrice,
      fundingRate,
      notional,
      entryPrice,
      liquidationPrice,
      movePct,
      pnlUp,
      pnlDown,
      fundingEstimate,
      windowMinutes,
      targetPrice,
      marketSymbol: market?.symbol ?? null
    };
  }, [selection, markets]);

  const timeline = useMemo(() => {
    const windowMinutes = metrics.windowMinutes;
    const checkpoints = [
      {
        label: "Entry",
        description: "Confirm leverage, margin, and stop-loss before submitting the trade.",
        offsetMinutes: 0
      },
      {
        label: "Midpoint Check",
        description: "Verify funding timer, adjust stop if price has moved sharply.",
        offsetMinutes: Math.round(windowMinutes / 2)
      },
      {
        label: "Evaluation Window Ends",
        description: "Compare mark price vs. your target to log result and lessons learned.",
        offsetMinutes: windowMinutes
      }
    ];
    return checkpoints;
  }, [metrics.windowMinutes]);

  return {
    selection,
    lastSubmission,
    metrics,
    timeline
  };
}

function findMarket(markets: Market[], coinSymbol?: string | null) {
  if (!markets || markets.length === 0) {
    return undefined;
  }
  if (!coinSymbol) {
    return markets[0];
  }
  const upper = coinSymbol.toUpperCase();
  const candidates = [`${upper}-USDT`, `${upper}-USDC`, `${upper}-USD`];
  return markets.find((market) =>
    candidates.some((candidate) => market.symbol.toUpperCase() === candidate)
  ) ?? markets[0];
}

function estimateLiquidationPrice({
  direction,
  entryPrice,
  leverage,
  maintenance
}: {
  direction: Direction;
  entryPrice: number;
  leverage: number;
  maintenance: number;
}) {
  const marginBuffer = 1 / leverage;
  if (direction === "long") {
    return entryPrice * (1 - marginBuffer - maintenance);
  }
  return entryPrice * (1 + marginBuffer + maintenance);
}

function projectPnl({
  direction,
  entryPrice,
  movePct,
  leverage,
  stake,
  positiveMove
}: {
  direction: Direction;
  entryPrice: number;
  movePct: number;
  leverage: number;
  stake: number;
  positiveMove: boolean;
}) {
  const signedMove = positiveMove ? movePct : -movePct;
  const effectiveMove = direction === "long" ? signedMove : -signedMove;
  const priceDelta = entryPrice * effectiveMove;
  const notional = stake * leverage;
  return notional * priceDelta / entryPrice;
}
