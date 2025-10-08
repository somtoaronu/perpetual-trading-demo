import { useMemo, useState } from "react";

import { positions } from "../data/mock";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

export function AccountOverview() {
  const [priceDelta, setPriceDelta] = useState(1.5);
  const totals = useMemo(() => {
    const equity = 125_000;
    const marginUsed = 42_000;
    const funding = positions.reduce((acc, item) => acc + item.funding, 0);
    const unrealized = positions.reduce((acc, item) => acc + item.pnl, 0);
    return { equity, marginUsed, funding, unrealized };
  }, []);

  const projectedPnl = positions.reduce((acc, position) => {
    const directional = position.side === "Long" ? 1 : -1;
    const notional = position.size * position.markPrice;
    return acc + directional * notional * (priceDelta / 100);
  }, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Account Analytics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cross-margin account summary plus funding impact snapshot.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Metric label="Equity" value={`$${totals.equity.toLocaleString()}`} />
          <Metric label="Margin Used" value={`$${totals.marginUsed.toLocaleString()}`} />
          <Metric
            label="Unrealized PnL"
            value={`$${totals.unrealized.toFixed(2)}`}
            trend="bull"
          />
          <Metric label="Funding (24h)" value={`$${totals.funding.toFixed(2)}`} trend="bear" />
        </div>
        <Separator />
        <div>
          <header className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            <span>Scenario Simulator</span>
            <span>{priceDelta.toFixed(1)}% move</span>
          </header>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={priceDelta}
            onChange={(event) => setPriceDelta(Number(event.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Expected PnL if mark price shifts {priceDelta.toFixed(1)}%:{" "}
            <span className={projectedPnl >= 0 ? "text-bull" : "text-bear"}>
              ${projectedPnl.toFixed(2)}
            </span>
          </p>
        </div>
        <Separator />
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Funding Outlook
          </p>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-md border border-border/30 bg-background/80 px-3 py-2">
              <span>Current Rate</span>
              <Badge variant="bull">+0.015%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/30 bg-background/80 px-3 py-2">
              <span>Next Cycle Impact</span>
              <span>+$12.84 credit</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/30 bg-background/80 px-3 py-2">
              <span>Fair Price Basis</span>
              <span>-0.12%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  trend
}: {
  label: string;
  value: string;
  trend?: "bull" | "bear";
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      {trend && (
        <span className={`text-xs ${trend === "bull" ? "text-bull" : "text-bear"}`}>
          {trend === "bull" ? "Positive momentum" : "Monitor drawdown"}
        </span>
      )}
    </div>
  );
}
