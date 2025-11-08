import { SentimentProvider, SentimentSignal } from "../types";

const DEFAULT_SUBREDDITS = ["CryptoCurrency", "ethfinance"];

function resolveCommunities(): string[] {
  const raw = process.env.SENTIMENT_REDDIT_COMMUNITIES;
  if (!raw) {
    return DEFAULT_SUBREDDITS;
  }
  return raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fetchRedditSignals(): Promise<SentimentSignal[]> {
  const subreddits = resolveCommunities();
  if (subreddits.length === 0) {
    return [];
  }

  // NOTE: This is a placeholder implementation. Once credentials are wired we can
  // replace this with live Reddit API ingestion or Pushshift mirrors.
  return subreddits.map((subreddit) => ({
    id: `reddit-${subreddit}-${Date.now()}`,
    source: "reddit",
    headline: `Monitoring sentiment for r/${subreddit}`,
    summary: "Reddit ingestion placeholder — replace with live data.",
    url: `https://reddit.com/r/${subreddit}`,
    sentiment: "neutral",
    score: 0,
    confidence: 0.3,
    tags: ["placeholder"],
    createdAt: Date.now(),
    metadata: { subreddit }
  }));
}

export const redditProvider: SentimentProvider = {
  key: "reddit",
  async fetchSignals() {
    return fetchRedditSignals();
  }
};
