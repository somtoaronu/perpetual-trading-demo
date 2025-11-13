import { SentimentProvider, SentimentSignal, SentimentTone } from "../types";

const DEFAULT_SUBREDDITS = ["CryptoCurrency", "ethfinance"];
const MAX_POSTS = Number(process.env.SENTIMENT_REDDIT_LIMIT ?? 5);

function resolveCommunities(): string[] {
  const raw = process.env.SENTIMENT_REDDIT_COMMUNITIES;
  if (!raw) {
    return DEFAULT_SUBREDDITS;
  }
  return raw
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const negativeWords = [/dump/i, /panic/i, /fear/i, /bear/i, /down/i, /sell/i];
const positiveWords = [/pump/i, /bull/i, /moon/i, /rally/i, /up/i, /buy/i];

function scoreHeadline(headline: string): { sentiment: SentimentTone; score: number } {
  const negativeHits = negativeWords.reduce(
    (total, pattern) => total + (pattern.test(headline) ? 1 : 0),
    0
  );
  const positiveHits = positiveWords.reduce(
    (total, pattern) => total + (pattern.test(headline) ? 1 : 0),
    0
  );
  if (negativeHits > positiveHits) {
    return { sentiment: "negative", score: Number((-negativeHits).toFixed(2)) };
  }
  if (positiveHits > negativeHits) {
    return { sentiment: "positive", score: Number(positiveHits.toFixed(2)) };
  }
  return { sentiment: "neutral", score: 0 };
}

async function fetchSubreddit(subreddit: string): Promise<SentimentSignal[]> {
  const endpoint = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${MAX_POSTS}`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "perp-demo/1.0 (+https://github.com/perpetual-trading-demo)"
    }
  });
  if (!response.ok) {
    throw new Error(`Reddit request failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    data?: { children?: Array<{ data?: { id?: string; title?: string; url?: string; created_utc?: number; selftext?: string } }> };
  };

  const posts = payload.data?.children ?? [];
  return posts
    .map((item) => item.data)
    .filter((data): data is NonNullable<typeof data> => !!data && !!data.title)
    .map((data) => {
      const classification = scoreHeadline(data.title ?? "");
      return {
        id: `reddit-${data.id}`,
        source: "reddit",
        headline: data.title ?? "reddit insight",
        summary: (data.selftext ?? "").slice(0, 240) || undefined,
        url: data.url ?? `https://reddit.com/r/${subreddit}`,
        sentiment: classification.sentiment,
        score: classification.score,
        confidence: 0.65,
        createdAt: (data.created_utc ?? Date.now() / 1000) * 1000,
        metadata: {
          subreddit,
          postId: data.id
        }
      } satisfies SentimentSignal;
    });
}

async function fetchRedditSignals(): Promise<SentimentSignal[]> {
  const subreddits = resolveCommunities();
  if (subreddits.length === 0) {
    return [];
  }
  const batches = await Promise.all(
    subreddits.map(async (subreddit) => {
      try {
        return await fetchSubreddit(subreddit);
      } catch (error) {
        console.warn(`[sentiment] reddit fetch failed for r/${subreddit}`, error);
        return [];
      }
    })
  );
  return batches.flat();
}

export const redditProvider: SentimentProvider = {
  key: "reddit",
  async fetchSignals() {
    return fetchRedditSignals();
  }
};
