import { useState } from "react";

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

import { usePlanMetrics } from "../../hooks/usePlanMetrics";
import { formatDecimal } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

const MIN_SCENARIO = 0.005;
const MAX_SCENARIO = 0.05;

export function RiskSnapshotCard() {
  const { metrics, selection } = usePlanMetrics();
  const [movePct, setMovePct] = useState(metrics.movePct ?? 0.02);
  const direction = selection.predictionDirection ?? "long";

  function projectScenario(positive: boolean) {
    const signedMove = positive ? movePct : -movePct;
    const effectiveMove = direction === "long" ? signedMove : -signedMove;
    const priceDelta = metrics.entryPrice * effectiveMove;
    const notional = metrics.notional;
    return notional * priceDelta / metrics.entryPrice;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Risk &amp; Reward Snapshot</CardTitle>
        <p className="text-sm text-muted-foreground">
          Understand how much you’re putting at risk and what a typical move means for PnL.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Position Notional"
            value={`$${formatDecimal(metrics.notional, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`}
            description={`${formatDecimal(selection.stake, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} USDT × ${formatDecimal(selection.leverage, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            })}× leverage`}
          />
          <Metric
            label="Estimated Liquidation"
            value={`$${formatDecimal(metrics.liquidationPrice, {
              minimumFractionDigits: metrics.liquidationPrice < 1 ? 4 : 2,
              maximumFractionDigits: metrics.liquidationPrice < 1 ? 6 : 2
            })}`}
            description="Approximation using 0.6% maintenance margin"
            intent="danger"
          />
          <Metric
            label="Target Mark"
            value={`$${formatDecimal(metrics.targetPrice, {
              minimumFractionDigits: metrics.targetPrice < 1 ? 4 : 2,
              maximumFractionDigits: metrics.targetPrice < 1 ? 6 : 2
            })}`}
            description={`${formatDecimal(movePct * 100, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            })}% move ${direction === "long" ? "upward" : "downward"}`}
          />
        </div>
        <Separator />
        <div className="space-y-4">
          <header className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            <span>Scenario Range</span>
            <span>
              {formatDecimal(movePct * 100, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              })}
              % move
            </span>
          </header>
          <input
            type="range"
            min={MIN_SCENARIO}
            max={MAX_SCENARIO}
            step={0.005}
            value={movePct}
            onChange={(event) => setMovePct(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ScenarioCard
              icon={TrendingUp}
              label="If price moves in your favour"
              amount={projectScenario(true)}
              positive
            />
            <ScenarioCard
              icon={TrendingDown}
              label="If price moves against you"
              amount={projectScenario(false)}
              positive={false}
            />
          </div>
        </div>
        <Separator />
        <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-bear" />
          <p>
            Liquidation is estimated and can happen sooner during volatility. Add a stop-loss at
            least 20% above the estimated liquidation price to stay safe.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  description,
  intent
}: {
  label: string;
  value: string;
  description?: string;
  intent?: "danger";
}) {
  const colour = intent === "danger" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-lg border border-border/40 bg-muted/15 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${colour}`}>{value}</p>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground/80">{description}</p>
      ) : null}
    </div>
  );
}

function ScenarioCard({
  icon: Icon,
  label,
  amount,
  positive
}: {
  icon: typeof TrendingUp;
  label: string;
  amount: number;
  positive: boolean;
}) {
  const colour = positive ? "text-bull" : "text-bear";
  const formatted = `$${formatDecimal(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  return (
    <div className="rounded-lg border border-border/40 bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className={`h-4 w-4 ${colour}`} />
        <span>{label}</span>
      </div>
      <p className={`mt-3 text-xl font-semibold ${colour}`}>{formatted}</p>
    </div>
  );
}
