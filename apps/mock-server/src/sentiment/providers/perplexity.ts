import { SentimentProvider, SentimentSignal } from "../types";

const DEFAULT_PERPLEXITY_TOPIC = "crypto psychology";

async function fetchPerplexitySignals(): Promise<SentimentSignal[]> {
  const topic = process.env.SENTIMENT_PERPLEXITY_TOPIC ?? DEFAULT_PERPLEXITY_TOPIC;
  if (!process.env.PERPLEXITY_API_KEY) {
    // Without credentials we return a lightweight placeholder to keep the pipeline running.
    return [
      {
        id: `perplexity-${Date.now()}`,
        source: "perplexity",
        headline: `Queued Perplexity brief for ${topic}`,
        summary: "Set PERPLEXITY_API_KEY to replace this stub with live briefs.",
        sentiment: "neutral",
        score: 0,
        confidence: 0.2,
        tags: ["placeholder"],
        createdAt: Date.now(),
        metadata: { topic }
      }
    ];
  }

  // TODO: replace with live Perplexity API call once credentials and SDK are available.
  return [];
}

export const perplexityProvider: SentimentProvider = {
  key: "perplexity",
  async fetchSignals() {
    return fetchPerplexitySignals();
  }
};
