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

export function FeedbackPanel() {
  const [email, setEmail] = useState("");
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const form = event.currentTarget;
    form.reset();
    setEmail("");
    setSentiment(null);
    setNotes("");
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
              onChange={(event) => setEmail(event.target.value)}
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
                    onClick={() => setSentiment(active ? null : option.id)}
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
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {submitted ? <span>Thanks for helping us improve!</span> : <span>We reply within 24 hours.</span>}
            <Button type="submit" disabled={!sentiment && notes.trim().length === 0}>
              Send Feedback
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
