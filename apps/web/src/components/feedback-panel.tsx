import { useState, type FormEvent } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

const sentiments = [
  { id: "excellent", label: "Excellent" },
  { id: "good", label: "Good" },
  { id: "average", label: "Average" },
  { id: "poor", label: "Needs Work" }
];

const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function FeedbackPanel() {
  const [email, setEmail] = useState("");
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiBaseUrl) {
      console.warn("[feedback] VITE_API_BASE_URL is not defined; skipping submission.");
      setStatus("error");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedNotes = notes.trim();

    const payload: Record<string, unknown> = {
      notes: trimmedNotes
    };
    if (trimmedEmail.length > 0) {
      payload.email = trimmedEmail;
    }
    if (sentiment) {
      payload.sentiment = sentiment;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      setStatus("success");
      setEmail("");
      setSentiment(null);
      setNotes("");
      event.currentTarget.reset();
    } catch (error) {
      console.error("[feedback] submission failed", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full border-border/40 bg-background/70">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Share Your Feedback</CardTitle>
        <CardDescription className="text-sm text-muted-foreground/80">
          Tell us what’s working and where we can improve the onboarding experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="feedback-email">Email (optional)</Label>
            <Input
              id="feedback-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              maxLength={120}
              autoComplete="email"
              inputMode="email"
              onChange={(event) => {
                setStatus("idle");
                setEmail(event.target.value.slice(0, 120));
              }}
            />
          </div>
          <fieldset className="space-y-2">
            <Label>Overall Experience</Label>
            <div className="flex flex-wrap gap-2">
              {sentiments.map((option) => {
                const active = sentiment === option.id;
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => {
                      setStatus("idle");
                      setSentiment(active ? null : option.id);
                    }}
                    className={active ? "border-primary/50" : undefined}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="feedback-notes">What should we know?</Label>
            <Textarea
              id="feedback-notes"
              placeholder="Share wins, confusion points, or wishlist features."
              value={notes}
              maxLength={1000}
              onChange={(event) => {
                setStatus("idle");
                const sanitized = event.target.value.replace(CONTROL_CHAR_REGEX, "");
                setNotes(sanitized.slice(0, 1000));
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {status === "success"
                ? "Thanks for helping us improve!"
                : status === "error"
                ? "Thanks for helping us improve."
                : "We reply within 24 hours."}
            </span>
            <Button
              type="submit"
              disabled={
                isSubmitting || (!sentiment && notes.trim().length === 0) || !apiBaseUrl
              }
            >
              {isSubmitting ? "Sending…" : "Send Feedback"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
