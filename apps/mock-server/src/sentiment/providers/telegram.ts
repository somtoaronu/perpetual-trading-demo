import { SentimentProvider, SentimentSignal, SentimentTone } from "../types";

const KEYWORDS_NEGATIVE = [/dump/i, /bear/i, /fud/i, /panic/i, /down/i];
const KEYWORDS_POSITIVE = [/pump/i, /moon/i, /bull/i, /up only/i, /green/i];

let lastUpdateId = 0;

function classify(text: string): { sentiment: SentimentTone; score: number } {
  if (KEYWORDS_NEGATIVE.some((pattern) => pattern.test(text))) {
    return { sentiment: "negative", score: -0.5 };
  }
  if (KEYWORDS_POSITIVE.some((pattern) => pattern.test(text))) {
    return { sentiment: "positive", score: 0.5 };
  }
  return { sentiment: "neutral", score: 0 };
}

async function fetchTelegramSignals(): Promise<SentimentSignal[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_ID;
  if (!token || !chatId) {
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          id: `telegram-placeholder-${Date.now()}`,
          source: "telegram",
          headline: "Telegram ingestion inactive",
          summary: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_GROUP_ID to enable live group monitoring.",
          sentiment: "neutral",
          score: 0,
          confidence: 0.1,
          createdAt: Date.now()
        }
      ];
    }
    return [];
  }

  const params = new URLSearchParams({ timeout: "10" });
  if (lastUpdateId > 0) {
    params.set("offset", String(lastUpdateId + 1));
  }

  const endpoint = `https://api.telegram.org/bot${token}/getUpdates?${params.toString()}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Telegram API error ${response.status}`);
  }
  const payload = (await response.json()) as {
    ok: boolean;
    result?: Array<{ update_id: number; message?: { chat?: { id?: number }; text?: string } }>;
  };
  if (!payload.ok || !payload.result) {
    return [];
  }

  const signals: SentimentSignal[] = [];
  for (const update of payload.result) {
    lastUpdateId = Math.max(lastUpdateId, update.update_id ?? 0);
    const message = update.message;
    if (!message || !message.chat || String(message.chat.id) !== String(chatId)) {
      continue;
    }
    const text = message.text ?? "";
    if (text.length === 0) {
      continue;
    }
    const classification = classify(text);
    signals.push({
      id: `telegram-${update.update_id}`,
      source: "telegram",
      headline: text.slice(0, 120),
      summary: text,
      sentiment: classification.sentiment,
      score: classification.score,
      confidence: 0.6,
      createdAt: Date.now(),
      metadata: {
        updateId: update.update_id,
        chatId
      }
    });
  }

  return signals;
}

export const telegramProvider: SentimentProvider = {
  key: "telegram",
  async fetchSignals() {
    return fetchTelegramSignals();
  }
};
