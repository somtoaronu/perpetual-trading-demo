import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Radio, TriangleAlert } from "lucide-react";

import { usePsychology } from "../providers/psychology";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

function sentimentVariant(sentiment: "positive" | "neutral" | "negative") {
  switch (sentiment) {
    case "positive":
      return "bull";
    case "negative":
      return "bear";
    default:
      return "outline";
  }
}

export function PsychologyPanel() {
  const { signals, loading, error, lastUpdated, connectionState } = usePsychology();
  const latest = signals.slice(0, 5);

  return (
    <Card className="h-full border-border/40 bg-background/70">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Market Psychology</CardTitle>
            <CardDescription className="text-xs text-muted-foreground/80">
              Aggregated cues from Perplexity briefs, Reddit threads, and Telegram rooms.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Radio className="h-3.5 w-3.5" /> {connectionState === "connected" ? "Live" : "Syncing"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading psychology feed…</p>
        ) : null}
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : null}
        {latest.length === 0 && !loading ? (
          <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
            <TriangleAlert className="h-4 w-4" />
            <p>No psychology reports yet. Keep the server running to gather signals.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {latest.map((signal) => (
              <li key={signal.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="uppercase text-[11px] tracking-wide text-muted-foreground">
                      {signal.source}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(signal.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{signal.headline}</p>
                {signal.summary ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {signal.summary}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <Badge variant={sentimentVariant(signal.sentiment)}>{signal.sentiment}</Badge>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className={cn(signal.score < 0 ? "text-destructive" : "text-emerald-500")}
                    >
                      score {signal.score.toFixed(2)}
                    </span>
                    <span>conf {Math.round(signal.confidence * 100)}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-[11px] text-muted-foreground">
          {lastUpdated ? `Last update ${formatDistanceToNow(lastUpdated, { addSuffix: true })}` : "Waiting for signals"}
        </p>
      </CardFooter>
    </Card>
  );
}
