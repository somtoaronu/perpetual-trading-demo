import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useAccount } from "wagmi";

import type {
  CoinGuide,
  EvaluationWindow,
  PlatformGuide
} from "../data/onboarding";
import { evaluationWindows } from "../data/onboarding";
import {
  getOnboardingPlan,
  type OnboardingPlanRecord,
  type SubmitOnboardingPlanResult
} from "../lib/onboarding-api";

type PredictionDirection = "long" | "short";

export type OnboardingSelection = {
  platformId?: PlatformGuide["id"];
  coinSymbol?: Exclude<CoinGuide["symbol"], "USDT"> | CoinGuide["symbol"];
  evaluationWindow: EvaluationWindow["id"];
  leverage: number;
  stake: number;
  predictionDirection: PredictionDirection;
};

type StoredOnboarding = {
  selection: OnboardingSelection;
  completedAt: string;
  updatedAt: string;
  walletAddress: string | null;
  source: "server" | "local";
  simulated: boolean;
};

type OnboardingContextValue = {
  currentStep: number;
  totalSteps: number;
  selection: OnboardingSelection;
  updateSelection: (patch: Partial<OnboardingSelection>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  completed: boolean;
  loading: boolean;
  error: string | null;
  markCompleted: (submission: OnboardingSelection, result?: SubmitOnboardingPlanResult) => void;
  resetOnboarding: () => void;
  lastSubmission: StoredOnboarding | null;
  refreshPlan: () => Promise<void>;
  isGuest: boolean;
  guestWalletAddress: string | null;
  enableGuestMode: () => void;
  clearGuestMode: () => void;
};

const TOTAL_STEPS = 6;

const defaultSelection: OnboardingSelection = {
  evaluationWindow: evaluationWindows[1]?.id ?? evaluationWindows[0].id,
  leverage: 5,
  stake: 100,
  predictionDirection: "long"
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const GUEST_WALLET_STORAGE_KEY = "guest-wallet-address";

function generateGuestWalletAddress() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return `0x${Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")}`;
  }
  let result = "0x";
  for (let index = 0; index < 40; index += 1) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

function createDefaultSelection(): OnboardingSelection {
  return { ...defaultSelection };
}

function recordToSelection(record: OnboardingPlanRecord): OnboardingSelection {
  return {
    platformId: record.platformId,
    coinSymbol: record.coinSymbol as OnboardingSelection["coinSymbol"],
    evaluationWindow: record.evaluationWindow,
    leverage: record.leverage,
    stake: record.stake,
    predictionDirection: record.predictionDirection
  };
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [guestAddress, setGuestAddress] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(GUEST_WALLET_STORAGE_KEY);
  });

  const isGuest = useMemo(() => !!guestAddress && !address, [guestAddress, address]);

  const normalizedAddress = useMemo(() => {
    if (address) {
      return address.toLowerCase();
    }
    if (guestAddress) {
      return guestAddress.toLowerCase();
    }
    return null;
  }, [address, guestAddress]);

  const [currentStep, setCurrentStep] = useState(0);
  const [selection, setSelection] = useState<OnboardingSelection>(createDefaultSelection);
  const [completed, setCompleted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<StoredOnboarding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (guestAddress) {
      window.localStorage.setItem(GUEST_WALLET_STORAGE_KEY, guestAddress);
    } else {
      window.localStorage.removeItem(GUEST_WALLET_STORAGE_KEY);
    }
  }, [guestAddress]);

  useEffect(() => {
    if (address && guestAddress) {
      setGuestAddress(null);
    }
  }, [address, guestAddress]);

  const applyRecord = useCallback(
    (record: OnboardingPlanRecord, simulated: boolean) => {
      const mappedSelection = recordToSelection(record);
      setSelection(mappedSelection);
      setCompleted(!simulated);
      setCurrentStep(TOTAL_STEPS - 1);
      setLastSubmission({
        selection: mappedSelection,
        completedAt: record.submittedAt,
        updatedAt: record.updatedAt,
        walletAddress: record.walletAddress,
        source: simulated ? "local" : "server",
        simulated
      });
      setError(
        simulated
          ? "Database unreachable—your plan is stored locally. Keep this tab open and try again when connectivity returns."
          : null
      );
    },
    []
  );

  const resetState = useCallback(() => {
    setSelection(createDefaultSelection());
    setCompleted(false);
    setCurrentStep(0);
    setLastSubmission(null);
  }, []);

  const loadPlan = useCallback(async () => {
    if (isGuest) {
      setLoading(false);
      setError(null);
      return;
    }

    if (!normalizedAddress) {
      resetState();
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const plan = await getOnboardingPlan(normalizedAddress);
      if (!plan) {
        resetState();
        return;
      }
      applyRecord(plan, false);
    } catch (loadError) {
      console.warn("[onboarding] failed to load plan", loadError);
      setCompleted(false);
      setCurrentStep(0);
      setError(
        "We couldn’t load your saved plan. Your selections stay local until the connection returns."
      );
    } finally {
      setLoading(false);
    }
  }, [applyRecord, normalizedAddress, resetState, isGuest]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const updateSelection = (patch: Partial<OnboardingSelection>) => {
    setSelection((prev) => ({ ...prev, ...patch }));
  };

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  const previousStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const goToStep = (step: number) => {
    setCurrentStep(Math.min(Math.max(step, 0), TOTAL_STEPS - 1));
  };

  const markCompleted = (
    submission: OnboardingSelection,
    result?: SubmitOnboardingPlanResult
  ) => {
    if (result?.record) {
      applyRecord(result.record, result.simulated);
    } else {
      setSelection((prev) => ({ ...prev, ...submission }));
      setCompleted(isGuest);
      setCurrentStep(TOTAL_STEPS - 1);
      const timestamp = new Date().toISOString();
      setLastSubmission({
        selection: submission,
        completedAt: timestamp,
        updatedAt: timestamp,
        walletAddress: normalizedAddress,
        source: "local",
        simulated: true
      });
      if (isGuest) {
        setError(null);
      }
    }
  };

  const resetOnboarding = () => {
    resetState();
  };

  const refreshPlan = useCallback(async () => {
    if (isGuest) {
      return;
    }
    await loadPlan();
  }, [isGuest, loadPlan]);

  const enableGuestMode = useCallback(() => {
    setGuestAddress((prev) => prev ?? generateGuestWalletAddress());
  }, []);

  const clearGuestMode = useCallback(() => {
    setGuestAddress(null);
  }, []);

  const value: OnboardingContextValue = {
    currentStep,
    totalSteps: TOTAL_STEPS,
    selection,
    updateSelection,
    nextStep,
    previousStep,
    goToStep,
    completed,
    loading,
    error,
    markCompleted,
    resetOnboarding,
    lastSubmission,
    refreshPlan,
    isGuest,
    guestWalletAddress: guestAddress,
    enableGuestMode,
    clearGuestMode
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
