import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { buildWebSocketUrl } from "../lib/utils";
import { requireApiBase } from "../lib/api-base";

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

export type PsychologyContextValue = {
  signals: SentimentSignal[];
  lastUpdated: number | null;
  loading: boolean;
  error: string | null;
  connectionState: "connecting" | "connected" | "disconnected";
};

const PsychologyContext = createContext<PsychologyContextValue | null>(null);

const MAX_SIGNAL_COUNT = 50;

function dedupeSignals(signals: SentimentSignal[]): SentimentSignal[] {
  const map = new Map<string, SentimentSignal>();
  signals.forEach((signal) => {
    map.set(signal.id, signal);
  });
  return Array.from(map.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_SIGNAL_COUNT);
}

function resolveSocketBase(fallback: string): string {
  const explicit = import.meta.env.VITE_WS_BASE_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return fallback;
}

export function PsychologyProvider({ children }: { children: ReactNode }) {
  const apiBase = useMemo(() => requireApiBase(), []);
  const socketBase = useMemo(() => resolveSocketBase(apiBase), [apiBase]);
  const [signals, setSignals] = useState<SentimentSignal[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    PsychologyContextValue["connectionState"]
  >("connecting");

  useEffect(() => {
    let cancelled = false;
    async function loadSnapshot() {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/psychology`);
        if (!response.ok) {
          throw new Error(`Failed to load psychology feed (${response.status})`);
        }
        const payload = (await response.json()) as {
          signals?: SentimentSignal[];
          lastUpdated?: number;
        };
        if (!cancelled) {
          setSignals((current) => dedupeSignals([...(payload.signals ?? []), ...current]));
          setLastUpdated(payload.lastUpdated ?? Date.now());
          setError(null);
        }
      } catch (snapshotError) {
        if (!cancelled) {
          setError(snapshotError instanceof Error ? snapshotError.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  useEffect(() => {
    let shouldReconnect = true;
    let socket: WebSocket | null = null;
    let reconnectAttempts = 0;

    const connect = () => {
      setConnectionState("connecting");
      const wsUrl = buildWebSocketUrl(socketBase, "/psych");
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        reconnectAttempts = 0;
        setConnectionState("connected");
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as {
            type?: string;
            signals?: SentimentSignal[];
            lastUpdated?: number;
          };
          if (payload.signals) {
            setSignals((current) => dedupeSignals([...(payload.signals ?? []), ...current]));
            setLastUpdated(payload.lastUpdated ?? Date.now());
          }
        } catch (messageError) {
          console.warn("[psychology] Failed to parse update", messageError);
        }
      };

      socket.onclose = (event) => {
        setConnectionState("disconnected");
        if (!event.wasClean) {
          setError(
            `Live psychology feed disconnected (code ${event.code ?? "unknown"}). Retrying…`
          );
        }
        if (!shouldReconnect) {
          return;
        }
        const delay = Math.min(500 * 2 ** reconnectAttempts + Math.random() * 500, 30_000);
        reconnectAttempts += 1;
        window.setTimeout(connect, delay);
      };

      socket.onerror = (socketError) => {
        console.warn("[psychology] websocket error", socketError);
        setError("Unable to reach live psychology feed. Retrying…");
        socket?.close();
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      socket?.close();
    };
  }, [socketBase]);

  const value = useMemo<PsychologyContextValue>(
    () => ({
      signals,
      lastUpdated,
      loading,
      error,
      connectionState
    }),
    [signals, lastUpdated, loading, error, connectionState]
  );

  return <PsychologyContext.Provider value={value}>{children}</PsychologyContext.Provider>;
}

export function usePsychology() {
  const context = useContext(PsychologyContext);
  if (!context) {
    throw new Error("usePsychology must be used within a PsychologyProvider");
  }
  return context;
}
