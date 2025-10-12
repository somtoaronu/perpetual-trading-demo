import { CheckCircle2, Shield, Target, Zap } from "lucide-react";

import { usePlanMetrics } from "../../hooks/usePlanMetrics";
import { useOnboarding } from "../../providers/onboarding";
import { formatDecimal } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type ChecklistItem = {
  title: string;
  description: string;
  icon: typeof Shield;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function NextStepsChecklist({
  onJumpToTicket,
  onJumpToRisk
}: {
  onJumpToTicket?: () => void;
  onJumpToRisk?: () => void;
}) {
  const { selection, metrics } = usePlanMetrics();
  const { resetOnboarding } = useOnboarding();
  const liquidationBuffer =
    metrics.liquidationPrice * (selection.predictionDirection === "long" ? 1.02 : 0.98);

  const items: ChecklistItem[] = [
    {
      title: "Fund your position",
      description: `Make sure at least ${formatDecimal(selection.stake, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        fallback: "0.00"
      })} USDT sits in available balance before placing the order.`,
      icon: Zap,
      action: onJumpToTicket
        ? { label: "Go to ticket", onClick: onJumpToTicket }
        : undefined
    },
    {
      title: "Add a safety stop",
      description: `Set a stop-loss near ${selection.predictionDirection === "long" ? ">" : "<"} $${formatDecimal(liquidationBuffer, {
        minimumFractionDigits: liquidationBuffer < 1 ? 4 : 2,
        maximumFractionDigits: liquidationBuffer < 1 ? 6 : 2
      })} to stay clear of liquidation.`,
      icon: Shield,
      action: onJumpToRisk ? { label: "View risk", onClick: onJumpToRisk } : undefined
    },
    {
      title: "Review funding timer",
      description: "Funding updates each cycle—plan to check the timeline just before it hits.",
      icon: Target,
      action: {
        label: "Edit plan",
        onClick: resetOnboarding
      }
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Next Steps Checklist</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tick through these items before you confirm the first trade.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-2 rounded-lg border border-border/40 bg-muted/15 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <item.icon className="h-4 w-4 text-primary" />
              <span>{item.title}</span>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {item.action ? (
              <Button variant="secondary" size="sm" className="w-fit gap-2" onClick={item.action.onClick}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {item.action.label}
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
