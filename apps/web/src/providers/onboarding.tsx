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
};

const TOTAL_STEPS = 6;

const defaultSelection: OnboardingSelection = {
  evaluationWindow: evaluationWindows[1]?.id ?? evaluationWindows[0].id,
  leverage: 5,
  stake: 100,
  predictionDirection: "long"
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

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
  const normalizedAddress = useMemo(
    () => (address ? address.toLowerCase() : null),
    [address]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [selection, setSelection] = useState<OnboardingSelection>(createDefaultSelection);
  const [completed, setCompleted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<StoredOnboarding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [applyRecord, normalizedAddress, resetState]);

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
      setCompleted(false);
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
    }
  };

  const resetOnboarding = () => {
    resetState();
  };

  const refreshPlan = useCallback(async () => {
    await loadPlan();
  }, [loadPlan]);

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
    refreshPlan
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
