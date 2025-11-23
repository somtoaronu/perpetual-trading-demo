import { EventEmitter } from "node:events";

import { sendPsychologyAlert } from "../notifications/email";
import { perplexityProvider } from "./providers/perplexity";
import { redditProvider } from "./providers/reddit";
import { telegramProvider } from "./providers/telegram";
import { SentimentProvider, SentimentSignal } from "./types";

const emitter = new EventEmitter();
const SENTIMENT_EVENT = "sentimentUpdated";

let cache: SentimentSignal[] = [];
let lastUpdated = 0;
const alertedSignals = new Set<string>();

const REFRESH_INTERVAL_MS = Number(process.env.SENTIMENT_REFRESH_MS ?? 300_000);
const MAX_SIGNAL_COUNT = Number(process.env.SENTIMENT_MAX_COUNT ?? 200);
const MAX_SIGNAL_AGE_MS = Number(
  process.env.SENTIMENT_MAX_AGE_MS ?? 24 * 60 * 60 * 1000 // 24h default
);

const providers: SentimentProvider[] = [perplexityProvider, redditProvider, telegramProvider];

async function runProvider(provider: SentimentProvider): Promise<SentimentSignal[]> {
  try {
    return await provider.fetchSignals();
  } catch (error) {
    console.warn(`[sentiment] ${provider.key} fetch failed`, error);
    return [];
  }
}

function dedupeAndTrim(signals: SentimentSignal[]): SentimentSignal[] {
  const now = Date.now();
  const map = new Map<string, SentimentSignal>();
  [...cache, ...signals].forEach((signal) => {
    if (Number.isFinite(MAX_SIGNAL_AGE_MS) && now - signal.createdAt > MAX_SIGNAL_AGE_MS) {
      return;
    }
    map.set(signal.id, signal);
  });
  return Array.from(map.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_SIGNAL_COUNT);
}

function shouldTriggerAlert(signal: SentimentSignal): boolean {
  if (signal.sentiment !== "negative") {
    return false;
  }
  if (alertedSignals.has(signal.id)) {
    return false;
  }
  if (signal.tags?.includes("market-down")) {
    return true;
  }
  if (signal.metadata && typeof signal.metadata.marketDown === "boolean") {
    return signal.metadata.marketDown;
  }
  return false;
}

async function handleAlerts(signals: SentimentSignal[]) {
  for (const signal of signals) {
    if (!shouldTriggerAlert(signal)) {
      continue;
    }
    alertedSignals.add(signal.id);
    try {
      await sendPsychologyAlert(signal);
    } catch (error) {
      console.warn("[sentiment] failed to send alert", error);
    }
  }
}

export async function refreshSentimentSignals() {
  const results = await Promise.all(providers.map((provider) => runProvider(provider)));
  const merged = results.flat();
  if (merged.length === 0) {
    return;
  }
  cache = dedupeAndTrim(merged);
  lastUpdated = Date.now();
  emitter.emit(SENTIMENT_EVENT, cache);
  void handleAlerts(merged);
}

let intervalHandle: NodeJS.Timeout | null = null;

export function startSentimentPolling() {
  if (intervalHandle) {
    return;
  }
  void refreshSentimentSignals();
  intervalHandle = setInterval(() => {
    void refreshSentimentSignals();
  }, REFRESH_INTERVAL_MS);
}

export function subscribeToSentiment(listener: (signals: SentimentSignal[]) => void) {
  emitter.on(SENTIMENT_EVENT, listener);
  return () => emitter.off(SENTIMENT_EVENT, listener);
}

export function getSentimentSnapshot() {
  return {
    signals: cache,
    lastUpdated
  };
}
