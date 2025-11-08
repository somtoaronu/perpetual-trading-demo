export type SentimentTone = "positive" | "neutral" | "negative";

export type SentimentSignal = {
  id: string;
  source: string;
  headline: string;
  summary?: string;
  url?: string;
  sentiment: SentimentTone;
  score: number;
  confidence: number;
  tags?: string[];
  createdAt: number;
  metadata?: Record<string, unknown>;
};

export interface SentimentProvider {
  key: string;
  fetchSignals(): Promise<SentimentSignal[]>;
}
