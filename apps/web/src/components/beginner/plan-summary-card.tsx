import { ArrowRight, Clock, RefreshCw, Sparkles } from "lucide-react";

import { formatDistanceToNow } from "date-fns";

import { coinGuides, platformGuides } from "../../data/onboarding";
import { useOnboarding } from "../../providers/onboarding";
import { usePlanMetrics } from "../../hooks/usePlanMetrics";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

export function PlanSummaryCard() {
  const { selection, lastSubmission, resetOnboarding } = useOnboarding();
  const { metrics } = usePlanMetrics();

  const platform = platformGuides.find((item) => item.id === selection.platformId);
  const coin = coinGuides.find((item) => item.symbol === selection.coinSymbol);
  const directionCopy =
    selection.predictionDirection === "short" ? "Short (bet price falls)" : "Long (bet price rises)";

  const lastSaved =
    lastSubmission?.completedAt && lastSubmission.completedAt !== ""
      ? formatDistanceToNow(new Date(lastSubmission.completedAt), { addSuffix: true })
      : "Just now";

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="outline" className="mb-2 w-fit gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Beginner Outlook
          </Badge>
          <CardTitle>Your saved plan at a glance</CardTitle>
          <p className="text-sm text-muted-foreground">
            We translate the onboarding selections into a risk-aware trading brief.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={resetOnboarding}>
          Edit Plan
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Platform" value={platform?.name ?? "Not selected"} />
          <SummaryItem
            label="Coin"
            value={coin ? `${coin.name} (${coin.symbol}/USDT)` : "Not selected"}
          />
          <SummaryItem label="Direction" value={directionCopy} highlight={selection.predictionDirection} />
          <SummaryItem
            label="Leverage"
            value={`${selection.leverage?.toFixed(1) ?? "—"}×`}
          />
          <SummaryItem
            label="Stake"
            value={`${selection.stake?.toLocaleString(undefined, {
              maximumFractionDigits: 2
            })} USDT`}
          />
          <SummaryItem
            label="Evaluation Window"
            value={selection.evaluationWindow?.toUpperCase() ?? "—"}
          />
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Last saved {lastSaved}</span>
          </div>
          {metrics.marketSymbol ? (
            <Badge variant="secondary" className="gap-1">
              {metrics.marketSymbol}
              <ArrowRight className="h-3 w-3" />
              Mark ${metrics.markPrice.toFixed(2)}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: string | null;
}) {
  const highlightClass =
    highlight === "long"
      ? "text-bull"
      : highlight === "short"
        ? "text-bear"
        : "";

  return (
    <div className="rounded-lg border border-border/40 bg-muted/15 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${highlightClass}`}>{value}</p>
    </div>
  );
}
