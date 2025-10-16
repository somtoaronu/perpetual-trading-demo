import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

import { FeedbackStore } from "./feedback-store";
import { OnboardingStore, type OnboardingPlanInput } from "./onboarding-store";
import {
  getMarketsSnapshot,
  startMarketPolling,
  subscribeToMarketUpdates
} from "./providers/market-service";

dotenv.config();

if (!process.env.MONGO_URI) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env")
  ];
  for (const candidate of candidatePaths) {
    dotenv.config({ path: candidate });
    if (process.env.MONGO_URI) {
      console.log(`[env] Loaded fallback environment from ${candidate}`);
      break;
    }
  }
}

const app = express();

function normalizeOrigin(value: string): string {
  const cleaned = value.replace(/^"|"$/g, "").trim();
  if (!cleaned) {
    return "";
  }

  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/+$/, "");
  }
}

function parseAllowedOrigins(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((value): value is string => typeof value === "string")
        .map(normalizeOrigin)
        .filter(Boolean);
    }
  } catch {
    // Ignore JSON parse errors and fall back to delimiter parsing.
  }

  return rawValue
    .split(/[;,\s]+/)
    .map(normalizeOrigin)
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS policy"));
      }
    },
    credentials: true
  })
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      // Prevent null byte poisoning
      if (buf.includes(0)) {
        throw new Error("Invalid request payload");
      }
    }
  })
);

const requiredApiKey = process.env.MOCK_SERVER_API_KEY ?? process.env.API_KEY ?? null;

function requireApiKey(req: Request, res: Response, next: () => void) {
  if (!requiredApiKey) {
    next();
    return;
  }
  const provided = req.get("x-api-key") ?? req.query.apiKey;
  if (provided !== requiredApiKey) {
    res.status(401).json({ error: "Missing or invalid API key" });
    return;
  }
  next();
}

const positions = [
  {
    symbol: "ETH-USDC",
    side: "LONG",
    size: 2.5,
    entryPrice: 3188.5,
    markPrice: 3215.34,
    leverage: 10,
    marginMode: "ISOLATED"
  }
];

const ONBOARDING_COLLECTION = "onboardingPlans";
const FEEDBACK_COLLECTION = "feedbacks";

const onboardingStore = new OnboardingStore({
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.MONGO_DB_NAME,
  collectionName: ONBOARDING_COLLECTION
});

const feedbackStore = new FeedbackStore({
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.MONGO_DB_NAME,
  collectionName: FEEDBACK_COLLECTION
});

startMarketPolling();

app.get("/health", async (_req, res) => {
  const snapshot = getMarketsSnapshot();
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    onboarding: onboardingStore.status(),
    marketsUpdatedAt: snapshot.lastUpdated
  });
});

app.get("/markets", (_req, res) => {
  const snapshot = getMarketsSnapshot();
  res.json(snapshot.markets);
});

app.get("/positions", (_req, res) => {
  res.json(positions);
});

app.get("/api/onboarding", async (req, res) => {
  if (!ensureStoreReady(res)) {
    return;
  }
  try {
    const limitParam = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const limit = Number.isFinite(limitParam) && limitParam ? Math.min(limitParam, 200) : 50;
    const plans = await onboardingStore.listPlans(limit);
    res.json(plans);
  } catch (error) {
    console.error("[server] Failed to list onboarding plans:", error);
    res.status(500).json({ error: "Failed to load onboarding plans." });
  }
});

app.get("/api/onboarding/:walletAddress", async (req, res) => {
  if (!ensureStoreReady(res)) {
    return;
  }
  try {
    const walletAddress = req.params.walletAddress;
    const plan = await onboardingStore.getPlan(walletAddress);
    if (!plan) {
      res.status(404).json({ error: "Plan not found." });
      return;
    }
    res.json(plan);
  } catch (error) {
    console.error("[server] Failed to fetch onboarding plan:", error);
    res.status(500).json({ error: "Failed to fetch onboarding plan." });
  }
});

app.post("/api/onboarding", requireApiKey, async (req, res) => {
  if (!ensureStoreReady(res)) {
    return;
  }

  const { plan, errors } = validateOnboardingPayload(req.body);
  if (!plan || errors.length > 0) {
    res.status(400).json({
      error: "Invalid onboarding payload.",
      details: errors
    });
    return;
  }

  try {
    const record = await onboardingStore.upsertPlan(plan);
    res.json(record);
  } catch (error) {
    console.error("[server] Failed to save onboarding plan:", error);
    res.status(500).json({ error: "Failed to save onboarding plan." });
  }
});

app.post("/orders", requireApiKey, (req, res) => {
  res.json({
    id: `order-${Date.now()}`,
    status: "filled",
    received: req.body
  });
});

app.delete("/orders/:id", requireApiKey, (req, res) => {
  res.json({ id: req.params.id, status: "cancelled" });
});

app.post("/feedback", requireApiKey, async (req, res) => {
  if (!ensureFeedbackReady(res)) {
    return;
  }

  const { feedback, errors } = validateFeedbackPayload(req.body, req);
  if (!feedback || errors.length > 0) {
    res.status(400).json({ error: "Invalid feedback payload.", details: errors });
    return;
  }

  try {
    await feedbackStore.insert(feedback);
    res.status(201).json({ status: "received" });
  } catch (error) {
    console.error("[server] Failed to save feedback:", error);
    res.status(500).json({ error: "Failed to save feedback." });
  }
});

// Centralised error handler for parsing / auth issues
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: () => void) => {
  console.error("[server] Request error", err.message);
  if (err.message === "Invalid request payload") {
    res.status(400).json({ error: "Invalid request payload" });
    return;
  }
  if (err.message.includes("CORS")) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }
  res.status(500).json({ error: "Unexpected server error" });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/stream" });

wss.on("connection", (socket) => {
  const snapshot = getMarketsSnapshot();
  socket.send(
    JSON.stringify({
      type: "hello",
      message: "Market stream connected",
      markets: snapshot.markets
    })
  );
});

subscribeToMarketUpdates((markets) => {
  const payload = {
    type: "ticker",
    at: Date.now(),
    markets
  };

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(payload));
    }
  });
});

const PORT = Number(process.env.PORT ?? process.env.SERVER_PORT ?? 4000);

async function bootstrap() {
  await onboardingStore.init();
  await feedbackStore.init();
  const status = onboardingStore.status();
  if (!status.ready) {
    console.warn(
      "[server] Onboarding persistence disabled:",
      status.error ?? "No mongoUri configured."
    );
  }

  if (!feedbackStore.isReady()) {
    console.warn("[server] Feedback persistence disabled: feedback will be stored in-memory only.");
  }

  httpServer.listen(PORT, () => {
    console.log(`Mock server listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("[server] Failed to start:", error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await onboardingStore.close();
  await feedbackStore.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await onboardingStore.close();
  await feedbackStore.close();
  process.exit(0);
});

function ensureStoreReady(res: Response): boolean {
  if (onboardingStore.isReady()) {
    return true;
  }
  const status = onboardingStore.status();
  res.status(503).json({
    error: "Onboarding persistence unavailable.",
    details: status.error ?? "Mongo connection is not initialised."
  });
  return false;
}

function ensureFeedbackReady(_res: Response): boolean {
  if (feedbackStore.isReady()) {
    return true;
  }
  return true;
}

const ALLOWED_EVALUATION_WINDOWS = new Set(["1h", "4h", "12h", "24h"]);
const ALLOWED_DIRECTIONS = new Set(["long", "short"]);

const ALLOWED_SENTIMENTS = new Set(["excellent", "good", "average", "poor"]);

function validateOnboardingPayload(body: unknown): {
  plan?: OnboardingPlanInput;
  errors: string[];
} {
  const errors: string[] = [];
  if (!body || typeof body !== "object") {
    errors.push("Request body must be an object.");
    return { errors };
  }

  const payload = body as Record<string, unknown>;

  const walletAddress = coerceString(payload.walletAddress);
  if (!walletAddress) {
    errors.push("walletAddress is required.");
  }

  const platformId = coerceString(payload.platformId);
  if (!platformId) {
    errors.push("platformId is required.");
  }

  const coinSymbol = coerceString(payload.coinSymbol);
  if (!coinSymbol) {
    errors.push("coinSymbol is required.");
  }

  const evaluationWindow = coerceString(payload.evaluationWindow);
  if (!evaluationWindow) {
    errors.push("evaluationWindow is required.");
  } else if (!ALLOWED_EVALUATION_WINDOWS.has(evaluationWindow)) {
    errors.push(`Unsupported evaluationWindow: ${evaluationWindow}.`);
  }

  const predictionDirection = coerceString(payload.predictionDirection);
  if (!predictionDirection) {
    errors.push("predictionDirection is required.");
  } else if (!ALLOWED_DIRECTIONS.has(predictionDirection as string)) {
    errors.push(`Unsupported predictionDirection: ${predictionDirection}.`);
  }

  const leverage = coerceNumber(payload.leverage);
  if (leverage === null) {
    errors.push("leverage must be a positive number.");
  } else if (leverage <= 0) {
    errors.push("leverage must be greater than zero.");
  }

  const stake = coerceNumber(payload.stake);
  if (stake === null) {
    errors.push("stake must be a number.");
  } else if (stake < 0) {
    errors.push("stake cannot be negative.");
  }

  if (errors.length > 0 || !walletAddress || !platformId || !coinSymbol || !evaluationWindow || !predictionDirection || leverage === null || stake === null) {
    return { errors };
  }

  const plan: OnboardingPlanInput = {
    walletAddress,
    platformId,
    coinSymbol,
    evaluationWindow,
    leverage,
    stake,
    predictionDirection: predictionDirection as "long" | "short"
  };

  return { plan, errors };
}

function validateFeedbackPayload(body: unknown, req: Request): {
  feedback?: {
    email?: string | null;
    sentiment?: string | null;
    notes: string;
    userAgent?: string | null;
    ipAddress?: string | null;
  };
  errors: string[];
} {
  const errors: string[] = [];
  if (!body || typeof body !== "object") {
    errors.push("Request body must be an object.");
    return { errors };
  }

  const payload = body as Record<string, unknown>;

  let email: string | null = null;
  const rawEmail = coerceString(payload.email);
  if (rawEmail) {
    const trimmed = rawEmail.slice(0, 120);
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(trimmed)) {
      errors.push("email must be a valid address if provided.");
    } else {
      email = trimmed;
    }
  }

  let sentiment: string | null = null;
  const rawSentiment = coerceString(payload.sentiment);
  if (rawSentiment) {
    const normalized = rawSentiment.toLowerCase();
    if (!ALLOWED_SENTIMENTS.has(normalized)) {
      errors.push(`Unsupported sentiment value: ${rawSentiment}.`);
    } else {
      sentiment = normalized;
    }
  }

  const rawNotes = typeof payload.notes === "string" ? payload.notes : "";
  const sanitizedNotes = sanitizeNotes(rawNotes);
  if (sanitizedNotes.length === 0 && !sentiment) {
    errors.push("notes or sentiment is required.");
  }

  if (sanitizedNotes.length > 1000) {
    errors.push("notes must be 1000 characters or fewer.");
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    feedback: {
      email,
      sentiment,
      notes: sanitizedNotes,
      userAgent: req.get("user-agent") ?? null,
      ipAddress: req.ip ?? null
    },
    errors
  };
}

function sanitizeNotes(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 1000);
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}
