import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Loader2,
  Info,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import {
  coinGuides,
  evaluationWindows,
  platformGuides
} from "../../data/onboarding";
import { useOnboarding } from "../../providers/onboarding";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { cn } from "../../lib/utils";
import { useCoinPrices } from "../../hooks/useCoinPrices";
import { submitOnboardingPlan } from "../../lib/onboarding-api";

const STEPS = [
  { id: 0, title: "Welcome", description: "How the guided plan works" },
  { id: 1, title: "Connect Wallet", description: "Link MetaMask in a few clicks" },
  { id: 2, title: "Choose Platform", description: "Pick the venue that fits you" },
  { id: 3, title: "Pick a Coin", description: "Select a USDT trading pair" },
  { id: 4, title: "Set Preferences", description: "Stake, leverage, and time window" },
  { id: 5, title: "Review Plan", description: "Confirm before we save it" }
];

export function OnboardingWizard() {
  const {
    currentStep,
    selection,
    updateSelection,
    nextStep,
    previousStep,
    goToStep,
    totalSteps,
    markCompleted,
    loading,
    error
  } = useOnboarding();
  const { address, status: accountStatus } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const metaMaskConnector = useMemo(
    () => connectors.find((connector) => connector.type === "metaMask"),
    [connectors]
  );

  const allowedCoins = useMemo(
    () => coinGuides.filter((coin) => coin.enabled && coin.symbol !== "USDT"),
    []
  );
  const coinsForPricing = useMemo(
    () => coinGuides.filter((coin) => coin.enabled),
    []
  );
  const { getPriceForSymbol, loading: pricesLoading, lastUpdated } = useCoinPrices(
    coinsForPricing
  );

  const selectedPlatform = useMemo(
    () => platformGuides.find((platform) => platform.id === selection.platformId),
    [selection.platformId]
  );
  const selectedCoin = useMemo(
    () => coinGuides.find((coin) => coin.symbol === selection.coinSymbol),
    [selection.coinSymbol]
  );
  const selectedWindow = useMemo(
    () =>
      evaluationWindows.find((window) => window.id === selection.evaluationWindow),
    [selection.evaluationWindow]
  );

  const isConnected = accountStatus === "connected" && !!address;

  const isNextDisabled = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !isConnected;
      case 2:
        return !selection.platformId;
      case 3:
        return !selection.coinSymbol;
      case 4:
        return !selectedPlatform || selection.leverage <= 0 || selection.stake <= 0;
      default:
        return false;
    }
  }, [
    currentStep,
    isConnected,
    selection.platformId,
    selection.coinSymbol,
    selection.leverage,
    selection.stake,
    selectedPlatform
  ]);

  const primaryLabel =
    currentStep === totalSteps - 1 ? "Save My Plan" : "Continue";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background/95 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/80" />
          <span className="text-sm">Loading your saved plan…</span>
        </div>
      </div>
    );
  }

  const handlePrimary = async () => {
    if (currentStep === totalSteps - 1) {
      if (!selection.platformId || !selection.coinSymbol) {
        return;
      }
      setSubmissionError(null);
      setSubmitting(true);
      try {
        const result = await submitOnboardingPlan({
          ...selection,
          walletAddress: address,
          submittedAt: new Date().toISOString()
        });
        markCompleted(selection, result);
        if (result.simulated) {
          setSubmissionError(
            "We saved your selections locally because the database is offline. We’ll sync them once the connection returns."
          );
        } else {
          setSubmissionError(null);
        }
      } catch (error) {
        console.error(error);
        setSubmissionError(
          "We hit a snag while saving. Please try again in a few seconds."
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    nextStep();
  };

  const handleSelectPlatform = (platformId: typeof platformGuides[number]["id"]) => {
    const platform = platformGuides.find((entry) => entry.id === platformId);
    if (!platform) {
      return;
    }
    updateSelection({
      platformId: platform.id,
      evaluationWindow: platform.defaultEvaluationWindow,
      leverage: Math.min(selection.leverage || platform.maxLeverage, platform.maxLeverage)
    });
  };

  const handleSelectCoin = (symbol: typeof allowedCoins[number]["symbol"]) => {
    updateSelection({ coinSymbol: symbol });
  };

  const handleLeverageChange = (value: number) => {
    if (!selectedPlatform) return;
    const clamped = Math.min(Math.max(value, 1), selectedPlatform.maxLeverage);
    updateSelection({ leverage: clamped });
  };

  const handleStakeChange = (value: number) => {
    updateSelection({ stake: Math.max(0, Number.isFinite(value) ? value : 0) });
  };

  const handleEvaluationWindowChange = (
    windowId: typeof evaluationWindows[number]["id"]
  ) => {
    updateSelection({ evaluationWindow: windowId });
  };

  const handleDirectionChange = (direction: "long" | "short") => {
    updateSelection({ predictionDirection: direction });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return (
          <WalletStep
            connect={connect}
            connectStatus={connectStatus}
            disconnect={disconnect}
            isConnected={isConnected}
            address={address}
            metaMaskConnector={metaMaskConnector}
          />
        );
      case 2:
        return (
          <PlatformStep
            selectedPlatformId={selection.platformId}
            onSelectPlatform={handleSelectPlatform}
          />
        );
      case 3:
        return (
          <CoinStep
            coins={allowedCoins}
            selectedSymbol={selection.coinSymbol}
            onSelectCoin={handleSelectCoin}
            getPriceForSymbol={getPriceForSymbol}
            pricesLoading={pricesLoading}
            lastUpdated={lastUpdated}
          />
        );
      case 4:
        return (
          <PlanStep
            selectedPlatform={selectedPlatform}
            leverage={selection.leverage}
            stake={selection.stake}
            evaluationWindowId={selection.evaluationWindow}
            predictionDirection={selection.predictionDirection}
            onLeverageChange={handleLeverageChange}
            onStakeChange={handleStakeChange}
            onEvaluationWindowChange={handleEvaluationWindowChange}
            onDirectionChange={handleDirectionChange}
          />
        );
      case 5:
        return (
          <ReviewStep
            address={address}
            platform={selectedPlatform}
            coin={selectedCoin}
            evaluationWindow={selectedWindow}
            leverage={selection.leverage}
            stake={selection.stake}
            predictionDirection={selection.predictionDirection}
            submissionError={submissionError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-background/95 text-foreground">
      <aside className="hidden w-72 flex-col border-r border-border/40 bg-background/70 px-6 py-10 backdrop-blur lg:flex">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-bull" />
            Guided Onboarding
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Build your trading plan
          </h1>
        </div>
        <nav className="flex flex-1 flex-col gap-4">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            const canJump = isComplete;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => (canJump ? goToStep(index) : undefined)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-all",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : isComplete
                      ? "text-muted-foreground hover:bg-muted/30"
                      : "text-muted-foreground/80 hover:bg-muted/20"
                )}
                disabled={!canJump}
              >
                <span className="mt-0.5">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                        isActive ? "border-primary text-primary" : "border-border/80"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>
                <span>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-primary" : undefined
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-10">
        <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>{`Step ${currentStep + 1} of ${totalSteps}`}</span>
          {selectedPlatform ? (
            <span className="flex items-center gap-1 text-muted-foreground/80">
              <Info className="h-3.5 w-3.5" />
              {selectedPlatform.name} max leverage: {selectedPlatform.maxLeverage}x
            </span>
          ) : null}
        </div>
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col gap-6">{renderStepContent()}</div>
        <footer className="flex items-center justify-between border-t border-border/40 pt-6">
          <Button
            variant="ghost"
            disabled={currentStep === 0 || submitting}
            onClick={previousStep}
          >
            Back
          </Button>
          <Button
            variant="default"
            disabled={isNextDisabled || submitting}
            onClick={handlePrimary}
            className="gap-2"
          >
            {submitting ? "Saving..." : primaryLabel}
            {submitting ? null : currentStep === totalSteps - 1 ? (
              <CircleCheck className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </footer>
      </main>
    </div>
  );
}

function WelcomeStep() {
  const highlights = [
    "We keep the choices simple so you can focus on the decision, not the jargon.",
    "Each step stores your selection so you can revisit or tweak it later.",
    "When you submit, we log the plan against your wallet so results stay unique to you."
  ];
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Let’s create a trading plan together</CardTitle>
          <CardDescription>
            You’ll connect MetaMask, choose where you want to trade, pick a coin, then
            set leverage and timing. Expect it to take about two minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3 text-sm text-muted-foreground">
            {highlights.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 h-4 w-4 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
            Tip: you can revisit onboarding anytime from the account menu if you want to
            rebuild your plan with different assumptions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type WalletStepProps = {
  connect: ReturnType<typeof useConnect>["connect"];
  connectStatus: ReturnType<typeof useConnect>["status"];
  disconnect: ReturnType<typeof useDisconnect>["disconnect"];
  isConnected: boolean;
  address?: string;
  metaMaskConnector?: ReturnType<typeof useConnect>["connectors"][number];
};

function WalletStep({
  connect,
  connectStatus,
  disconnect,
  isConnected,
  address,
  metaMaskConnector
}: WalletStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect MetaMask</CardTitle>
          <CardDescription>
            Your wallet keeps plans unique to you. We never store your seed phrase or ask
            for custody.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border border-border/40 bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Don’t have MetaMask?</p>
            <p>
              Install the browser extension or mobile app, create a wallet, and store your
              recovery phrase offline. Once ready, return here and click connect.
            </p>
          </div>
          {isConnected ? (
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                Connected as{" "}
                <span className="font-mono text-foreground">
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              disabled={!metaMaskConnector || connectStatus === "pending"}
              onClick={() =>
                metaMaskConnector ? connect({ connector: metaMaskConnector }) : undefined
              }
            >
              <Wallet className="h-4 w-4" />
              {connectStatus === "pending" ? "Connecting…" : "Connect MetaMask"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type PlatformStepProps = {
  selectedPlatformId?: typeof platformGuides[number]["id"];
  onSelectPlatform: (platformId: typeof platformGuides[number]["id"]) => void;
};

function PlatformStep({ selectedPlatformId, onSelectPlatform }: PlatformStepProps) {
  return (
    <div className="grid gap-4">
      {platformGuides.map((platform) => {
        const isActive = selectedPlatformId === platform.id;
        return (
          <Card
            key={platform.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/60",
              isActive ? "border-primary/60 ring-2 ring-primary/30" : undefined
            )}
            onClick={() => onSelectPlatform(platform.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {platform.name}
                    {isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : null}
                  </CardTitle>
                  <CardDescription>{platform.tagline}</CardDescription>
                </div>
                <div className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                  Max {platform.maxLeverage}x
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="text-foreground">{platform.overview}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-xs uppercase text-muted-foreground/80">
                    Why beginners like it
                  </p>
                  <p>{platform.whyBeginnersLikeIt}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-xs uppercase text-muted-foreground/80">
                    Funding cadence
                  </p>
                  <p>{platform.fundingNotes}</p>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
                {platform.leverageReminder}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

type CoinStepProps = {
  coins: typeof coinGuides;
  selectedSymbol?: typeof coinGuides[number]["symbol"];
  onSelectCoin: (symbol: typeof coinGuides[number]["symbol"]) => void;
  getPriceForSymbol: (symbol: string) => number | undefined;
  pricesLoading: boolean;
  lastUpdated: number | null;
};

function CoinStep({
  coins,
  selectedSymbol,
  onSelectCoin,
  getPriceForSymbol,
  pricesLoading,
  lastUpdated
}: CoinStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>All markets settle in USDT</span>
        <span>
          {pricesLoading
            ? "Fetching live prices…"
            : lastUpdated
              ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
              : "Awaiting first update"}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {coins.map((coin) => {
          const isActive = coin.symbol === selectedSymbol;
          const price = getPriceForSymbol(coin.symbol);
          return (
            <Card
              key={coin.symbol}
              onClick={() => onSelectCoin(coin.symbol)}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/60",
                isActive ? "border-primary/60 ring-2 ring-primary/20" : undefined
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{coin.name}</span>
                  {isActive ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <span className="text-xs font-normal text-muted-foreground">
                      {coin.symbol}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{coin.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-baseline gap-2 text-foreground">
                  <span className="text-lg font-semibold">
                    {typeof price === "number"
                      ? `$${price.toLocaleString(undefined, {
                          maximumFractionDigits: price > 5 ? 2 : 4
                        })}`
                      : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">spot (USD)</span>
                </div>
                <p>{coin.whyItMoves}</p>
                <div className="rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                  Paired with {coin.pairedWith}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type PlanStepProps = {
  selectedPlatform?: (typeof platformGuides)[number];
  leverage: number;
  stake: number;
  evaluationWindowId: (typeof evaluationWindows)[number]["id"];
  predictionDirection: "long" | "short";
  onLeverageChange: (value: number) => void;
  onStakeChange: (value: number) => void;
  onEvaluationWindowChange: (
    windowId: (typeof evaluationWindows)[number]["id"]
  ) => void;
  onDirectionChange: (direction: "long" | "short") => void;
};

function PlanStep({
  selectedPlatform,
  leverage,
  stake,
  evaluationWindowId,
  predictionDirection,
  onLeverageChange,
  onStakeChange,
  onEvaluationWindowChange,
  onDirectionChange
}: PlanStepProps) {
  if (!selectedPlatform) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a platform first</CardTitle>
          <CardDescription>
            Head back a step and pick Hyperliquid, Aster, or the Custom workspace so we
            can tailor leverage caps and evaluation defaults.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Stake &amp; Leverage</CardTitle>
          <CardDescription>
            Keeping leverage modest helps avoid liquidation spikes while you test ideas.
            You can always revisit this later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/80 p-4">
              <span className="text-xs uppercase text-muted-foreground/70">Stake</span>
              <input
                type="number"
                className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                min={0}
                step={10}
                value={stake}
                onChange={(event) => onStakeChange(Number(event.target.value))}
              />
              <span className="text-xs text-muted-foreground/80">
                Amount of USDT you’re comfortable allocating to this idea.
              </span>
            </label>
            <label className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/80 p-4">
              <span className="text-xs uppercase text-muted-foreground/70">Leverage</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={selectedPlatform.maxLeverage}
                  value={leverage}
                  onChange={(event) => onLeverageChange(Number(event.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right text-base text-foreground">
                  {leverage}x
                </span>
              </div>
              <span className="text-xs text-muted-foreground/80">
                Max allowed here: {selectedPlatform.maxLeverage}x. Higher leverage means
                tighter liquidation bands.
              </span>
            </label>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase text-muted-foreground/70">Direction</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={cn(
                  "flex items-start gap-3 rounded-md border border-border/60 bg-background/60 p-3 text-left transition",
                  predictionDirection === "long"
                    ? "border-primary/60 ring-2 ring-primary/20"
                    : "hover:border-primary/30"
                )}
                onClick={() => onDirectionChange("long")}
              >
                <ArrowUpRight className="mt-0.5 h-4 w-4 text-primary" />
                <span>
                  <span className="text-sm font-semibold text-foreground">
                    Price will go up (Long)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Expect the coin to increase in value during your evaluation window.
                  </p>
                </span>
              </button>
              <button
                type="button"
                className={cn(
                  "flex items-start gap-3 rounded-md border border-border/60 bg-background/60 p-3 text-left transition",
                  predictionDirection === "short"
                    ? "border-primary/60 ring-2 ring-primary/20"
                    : "hover:border-primary/30"
                )}
                onClick={() => onDirectionChange("short")}
              >
                <ArrowDownRight className="mt-0.5 h-4 w-4 text-bear" />
                <span>
                  <span className="text-sm font-semibold text-foreground">
                    Price will go down (Short)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Profit if the coin drops by the end of your evaluation window.
                  </p>
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Window</CardTitle>
          <CardDescription>
            Choose how long we wait before scoring your prediction against CoinGecko data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {evaluationWindows.map((window) => {
            const isActive = window.id === evaluationWindowId;
            return (
              <button
                key={window.id}
                type="button"
                onClick={() => onEvaluationWindowChange(window.id)}
                className={cn(
                  "rounded-lg border border-border/60 bg-background/60 p-4 text-left transition",
                  isActive ? "border-primary/60 ring-2 ring-primary/20" : "hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">
                    {window.label}
                  </span>
                  {isActive ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{window.description}</p>
                <p className="mt-3 text-xs text-muted-foreground/80">{window.bestFor}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

type ReviewStepProps = {
  address?: string;
  platform?: (typeof platformGuides)[number];
  coin?: (typeof coinGuides)[number];
  evaluationWindow?: (typeof evaluationWindows)[number];
  leverage: number;
  stake: number;
  predictionDirection: "long" | "short";
  submissionError: string | null;
};

function ReviewStep({
  address,
  platform,
  coin,
  evaluationWindow,
  leverage,
  stake,
  predictionDirection,
  submissionError
}: ReviewStepProps) {
  const items = [
    {
      label: "Wallet",
      value: address
        ? `${address.slice(0, 6)}…${address.slice(-4)}`
        : "Connect MetaMask"
    },
    {
      label: "Platform",
      value: platform?.name ?? "Not selected"
    },
    {
      label: "Coin",
      value: coin ? `${coin.name} (${coin.symbol}/USDT)` : "Not selected"
    },
    {
      label: "Direction",
      value: predictionDirection === "long" ? "Long (expect price to rise)" : "Short (expect price to fall)"
    },
    {
      label: "Leverage",
      value: `${leverage}x`
    },
    {
      label: "Stake",
      value: `${stake.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })} USDT`
    },
    {
      label: "Evaluation window",
      value: evaluationWindow?.label ?? "Not selected"
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Review before submitting</CardTitle>
          <CardDescription>
            We record the plan against your wallet so outcome tracking stays unique. You
            can always edit it later in your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-card/70 px-4 py-3"
              >
                <span className="text-xs uppercase tracking-wide text-muted-foreground/80">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
            We’ll snapshot the CoinGecko USD price when you submit, then check again after
            your selected window (1–24 hours) to mark the plan as correct or incorrect
            based on resulting P/L.
          </div>
          {submissionError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              {submissionError}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
