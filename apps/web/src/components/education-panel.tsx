import { BookOpen, GraduationCap } from "lucide-react";

import { fundingEvents, tutorialSteps } from "../data/mock";
import { usePlanMetrics } from "../hooks/usePlanMetrics";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { PlanTimeline } from "./beginner/plan-timeline";

export function EducationPanel() {
  const { selection } = usePlanMetrics();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Guided Learning</CardTitle>
          <p className="text-sm text-muted-foreground">
            Step through concepts from basic market structure to funding strategies.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <GraduationCap className="h-4 w-4" /> Tutorial Mode
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="space-y-4">
          {tutorialSteps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-lg border border-border/40 bg-muted/20 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Step {index + 1}
                  </p>
                  <p className="text-sm font-semibold">{step.title}</p>
                </div>
                <Badge variant="outline">5 min</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{step.summary}</p>
            </li>
          ))}
        </ol>
        <Separator />
        <div className="rounded-lg border border-border/40 bg-background/60 p-4">
          <header className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-accent" />
            Funding &amp; Basis Timeline
          </header>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {fundingEvents.map((event) => (
              <li key={event.time} className="flex items-center justify-between">
                <span>{event.time}</span>
                <span>
                  Rate {event.rate >= 0 ? "+" : ""}
                  {(event.rate * 100).toFixed(2)}% · Impact $
                  {event.projectedImpact.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Use these accelerated funding cycles to explain Aster-style 8h payments in a
            classroom-friendly timeline.
          </p>
        </div>
        {selection.platformId ? <PlanTimeline /> : null}
      </CardContent>
    </Card>
  );
}
