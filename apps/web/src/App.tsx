import { useRef } from "react";

import { AccountOverview } from "./components/account-overview";
import { MarketSidebar } from "./components/market-sidebar";
import { OnboardingWizard } from "./components/onboarding/onboarding-wizard";
import { ChartPanel } from "./components/chart-panel";
import { TopBar } from "./components/top-bar";
import { PlanSummaryCard } from "./components/beginner/plan-summary-card";
import { RiskSnapshotCard } from "./components/beginner/risk-snapshot-card";
import { FundingOutlookCard } from "./components/beginner/funding-outlook-card";
import { NextStepsChecklist } from "./components/beginner/next-steps-checklist";
import { FeedbackPanel } from "./components/feedback-panel";
import { useOnboarding } from "./providers/onboarding";

function App() {
  const { completed } = useOnboarding();
  const riskRef = useRef<HTMLDivElement | null>(null);

  if (!completed) {
    return <OnboardingWizard />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <MarketSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 lg:px-8">
            <div className="grid gap-6 xl:grid-cols-[1.8fr,1fr]">
              <div className="grid gap-6" ref={riskRef}>
                <PlanSummaryCard />
                <RiskSnapshotCard />
              </div>
              <AccountOverview />
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.8fr,1fr]">
              <ChartPanel />
              <FundingOutlookCard />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <NextStepsChecklist
                onJumpToRisk={() => riskRef.current?.scrollIntoView({ behavior: "smooth" })}
              />
              <FeedbackPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
