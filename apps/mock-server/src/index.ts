import cors from "cors";
import dotenv from "dotenv";
import express, { type Response } from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

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
app.use(cors());
app.use(express.json());

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

const onboardingStore = new OnboardingStore({
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.MONGO_DB_NAME,
  collectionName: process.env.MONGO_COLLECTION ?? process.env.MONGO_COLLECTION_NAME
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

app.post("/api/onboarding", async (req, res) => {
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

app.post("/orders", (req, res) => {
  res.json({
    id: `order-${Date.now()}`,
    status: "filled",
    received: req.body
  });
});

app.delete("/orders/:id", (req, res) => {
  res.json({ id: req.params.id, status: "cancelled" });
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
  const status = onboardingStore.status();
  if (!status.ready) {
    console.warn(
      "[server] Onboarding persistence disabled:",
      status.error ?? "No mongoUri configured."
    );
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
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await onboardingStore.close();
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

const ALLOWED_EVALUATION_WINDOWS = new Set(["1h", "4h", "12h", "24h"]);
const ALLOWED_DIRECTIONS = new Set(["long", "short"]);

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
