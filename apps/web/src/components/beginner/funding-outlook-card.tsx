import { differenceInMinutes, format, addMinutes } from "date-fns";
import { PiggyBank, TimerReset } from "lucide-react";

import { usePlanMetrics } from "../../hooks/usePlanMetrics";
import { useOnboarding } from "../../providers/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

export function FundingOutlookCard() {
  const { metrics, selection, lastSubmission } = usePlanMetrics();
  const evaluationMinutes = metrics.windowMinutes;

  const submittedAt = lastSubmission?.completedAt
    ? new Date(lastSubmission.completedAt)
    : new Date();
  const endAt = addMinutes(submittedAt, evaluationMinutes);
  const minutesRemaining = Math.max(
    differenceInMinutes(endAt, new Date()),
    0
  );

  const fundingImpact = metrics.fundingEstimate;
  const isCredit = fundingImpact >= 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Funding Outlook</CardTitle>
        <p className="text-sm text-muted-foreground">
          See how periodic funding payments could add or subtract from your PnL.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-border/40 bg-muted/15 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <PiggyBank className="h-4 w-4" />
            <span>Projected impact</span>
          </div>
          <p className={`mt-3 text-2xl font-semibold ${isCredit ? "text-bull" : "text-bear"}`}>
            {isCredit ? "+" : "-"}${Math.abs(fundingImpact).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on {selection.leverage?.toFixed(1) ?? 1}× leverage over{" "}
            {formatMinutes(evaluationMinutes)} at a funding rate of{" "}
            {(metrics.fundingRate * 100).toFixed(3)}%.
          </p>
        </div>
        <Separator />
        <div className="rounded-lg border border-border/40 bg-background/70 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <TimerReset className="h-4 w-4" />
              <span>Timer to check-in</span>
            </div>
            <span className="text-xs text-muted-foreground/70">
              Ends {format(endAt, "MMM d, HH:mm")}
            </span>
          </div>
          <p className="mt-2 text-lg font-semibold">
            {minutesRemaining > 0 ? formatMinutes(minutesRemaining) : "Window complete"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Funding is calculated every 8h. We speed it up for the demo, but the maths stays the same:
            funding = notional × rate × (minutes / 480).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMinutes(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${hours}h ${minutes}m`;
}
