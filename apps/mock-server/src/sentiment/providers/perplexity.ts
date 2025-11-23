import { SentimentProvider, SentimentSignal, SentimentTone } from "../types";

const DEFAULT_PERPLEXITY_TOPIC = "crypto psychology";
const DEFAULT_MODEL = process.env.PERPLEXITY_MODEL ?? "sonar-small-chat";
const ENDPOINT = process.env.PERPLEXITY_API_URL ?? "https://api.perplexity.ai/chat/completions";

function classifySentiment(text: string): SentimentTone {
  const lowered = text.toLowerCase();
  if (/\b(bear|panic|fear|dump|sell)\b/.test(lowered)) {
    return "negative";
  }
  if (/\b(bull|optimistic|buy|accumulate|rally)\b/.test(lowered)) {
    return "positive";
  }
  return "neutral";
}

function buildPlaceholder(topic: string): SentimentSignal[] {
  if (process.env.ALLOW_SENTIMENT_PLACEHOLDER === "true") {
    return [
      {
        id: `perplexity-${Date.now()}`,
        source: "perplexity",
        headline: `Queued Perplexity brief for ${topic}`,
        summary: "Set PERPLEXITY_API_KEY to enable live AI briefs.",
        sentiment: "neutral",
        score: 0,
        confidence: 0.2,
        createdAt: Date.now(),
        metadata: { topic }
      }
    ];
  }
  return [];
}

async function fetchPerplexitySignals(): Promise<SentimentSignal[]> {
  const topic = process.env.SENTIMENT_PERPLEXITY_TOPIC ?? DEFAULT_PERPLEXITY_TOPIC;
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return buildPlaceholder(topic);
  }

  const prompt = `Summarize the latest trading psychology or market sentiment developments for ${topic}. ` +
    `Return a JSON array called signals with objects containing headline, summary, url (if any), and implied sentiment.`;

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a crypto psychology analyst. Only respond with JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return [];
  }

  let parsed: Array<{ headline: string; summary?: string; url?: string; sentiment?: string }> = [];
  try {
    const maybeJson = JSON.parse(content);
    if (Array.isArray(maybeJson)) {
      parsed = maybeJson as typeof parsed;
    } else if (Array.isArray((maybeJson as { signals?: unknown }).signals)) {
      parsed = (maybeJson as { signals: typeof parsed }).signals;
    }
  } catch {
    // If JSON parse fails, fallback to single entry using the raw string
    parsed = [
      {
        headline: `Perplexity brief for ${topic}`,
        summary: content
      }
    ];
  }

  return parsed.map((entry, index) => {
    const sentiment = entry.sentiment
      ? (entry.sentiment as SentimentTone)
      : classifySentiment(`${entry.headline ?? ""} ${entry.summary ?? ""}`);
    return {
      id: `perplexity-${Date.now()}-${index}`,
      source: "perplexity",
      headline: entry.headline ?? `Perplexity update ${index + 1}`,
      summary: entry.summary,
      url: entry.url,
      sentiment,
      score: sentiment === "positive" ? 0.6 : sentiment === "negative" ? -0.6 : 0,
      confidence: 0.7,
      createdAt: Date.now(),
      metadata: {
        provider: "perplexity",
        topic
      }
    } satisfies SentimentSignal;
  });
}

export const perplexityProvider: SentimentProvider = {
  key: "perplexity",
  async fetchSignals() {
    return fetchPerplexitySignals();
  }
};
