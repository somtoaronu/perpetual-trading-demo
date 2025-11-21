import type { EvaluationWindow, PlatformGuide } from "../data/onboarding";
import type { OnboardingSelection } from "../providers/onboarding";
import { requireApiBase } from "./api-base";

const API_BASE_URL = requireApiBase();
const API_KEY = import.meta.env.VITE_API_KEY?.trim();

export type PlanSubmissionPayload = OnboardingSelection & {
  walletAddress: string | null | undefined;
  submittedAt: string;
};

export type OnboardingPlanRecord = {
  walletAddress: string;
  platformId: PlatformGuide["id"];
  coinSymbol: string;
  evaluationWindow: EvaluationWindow["id"];
  leverage: number;
  stake: number;
  predictionDirection: OnboardingSelection["predictionDirection"];
  submittedAt: string;
  updatedAt: string;
};

export type SubmitOnboardingPlanResult = {
  record: OnboardingPlanRecord;
  simulated: boolean;
};

function buildEndpoint(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function buildHeaders(includeJson = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }
  return headers;
}

export async function submitOnboardingPlan(
  payload: PlanSubmissionPayload
): Promise<SubmitOnboardingPlanResult> {
  const endpoint = buildEndpoint("/api/onboarding");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (response.status === 503) {
      throw new Error("Onboarding persistence unavailable (503).");
    }

    if (!response.ok) {
      throw new Error(`Failed to submit onboarding plan: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      record: normalizeRecord(data),
      simulated: false
    };
  } catch (error) {
    console.warn("[onboarding] submission fallback triggered", error);
    return {
      record: fallbackRecord(payload),
      simulated: true
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getOnboardingPlan(
  walletAddress: string
): Promise<OnboardingPlanRecord | null> {
  const normalizedWallet = walletAddress.toLowerCase();
  const endpoint = buildEndpoint(`/api/onboarding/${encodeURIComponent(normalizedWallet)}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: buildHeaders(true)
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 503) {
      throw new Error("Onboarding persistence unavailable (503).");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch onboarding plan: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return normalizeRecord(data);
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeRecord(raw: Record<string, unknown>): OnboardingPlanRecord {
  const walletAddress = typeof raw.walletAddress === "string" ? raw.walletAddress : "";
  const platformId = raw.platformId as PlatformGuide["id"];
  const coinSymbol = typeof raw.coinSymbol === "string" ? raw.coinSymbol : "";
  const evaluationWindow = raw.evaluationWindow as EvaluationWindow["id"];
  const leverage = typeof raw.leverage === "number" ? raw.leverage : Number(raw.leverage ?? 0);
  const stake = typeof raw.stake === "number" ? raw.stake : Number(raw.stake ?? 0);
  const predictionDirection = (raw.predictionDirection ?? "long") as OnboardingSelection["predictionDirection"];
  const submittedAt =
    typeof raw.submittedAt === "string" ? raw.submittedAt : new Date().toISOString();
  const updatedAt =
    typeof raw.updatedAt === "string" ? raw.updatedAt : submittedAt;

  return {
    walletAddress: walletAddress.toLowerCase(),
    platformId,
    coinSymbol,
    evaluationWindow,
    leverage,
    stake,
    predictionDirection,
    submittedAt,
    updatedAt
  };
}

function fallbackRecord(payload: PlanSubmissionPayload): OnboardingPlanRecord {
  if (!payload.platformId) {
    throw new Error("Missing platformId in submission payload.");
  }
  if (!payload.coinSymbol) {
    throw new Error("Missing coinSymbol in submission payload.");
  }
  if (!payload.walletAddress) {
    throw new Error("Missing walletAddress in submission payload.");
  }

  const timestamp = payload.submittedAt || new Date().toISOString();
  return {
    walletAddress: payload.walletAddress.toLowerCase(),
    platformId: payload.platformId as PlatformGuide["id"],
    coinSymbol: payload.coinSymbol.toString(),
    evaluationWindow: payload.evaluationWindow,
    leverage: payload.leverage,
    stake: payload.stake,
    predictionDirection: payload.predictionDirection,
    submittedAt: timestamp,
    updatedAt: timestamp
  };
}
