import { format, addMinutes } from "date-fns";
import { AlarmClock, Flag, Play } from "lucide-react";

import { usePlanMetrics } from "../../hooks/usePlanMetrics";

const ICONS = [Play, AlarmClock, Flag];

export function PlanTimeline() {
  const { timeline, lastSubmission, metrics } = usePlanMetrics();

  const submittedAt = lastSubmission?.completedAt
    ? new Date(lastSubmission.completedAt)
    : new Date();

  return (
    <div className="space-y-4 rounded-lg border border-border/40 bg-muted/15 p-4">
      <header className="text-sm font-semibold">Your plan timeline</header>
      <ul className="space-y-3 text-sm text-muted-foreground">
        {timeline.map((entry, index) => {
          const Icon = ICONS[index] ?? Play;
          const timestamp = format(addMinutes(submittedAt, entry.offsetMinutes), "HH:mm");
          return (
            <li
              key={entry.label}
              className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/80 p-3"
            >
              <div className="mt-1">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <span>{entry.label}</span>
                  <span>•</span>
                  <span>{timestamp}</span>
                </div>
                <p>{entry.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        We speed up time for the demo—multiply the window ({formatWindow(metrics.windowMinutes)}) to
        map to live markets.
      </p>
    </div>
  );
}

function formatWindow(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = minutes / 60;
  return `${hours}h`;
}
