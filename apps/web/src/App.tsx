import { MarketSidebar } from "./components/market-sidebar";
import { TopBar } from "./components/top-bar";
import { AccountOverview } from "./components/account-overview";
import { ChartPanel } from "./components/chart-panel";
import { EducationPanel } from "./components/education-panel";
import { OrderflowPanel } from "./components/orderflow-panel";
import { PositionsPanel } from "./components/positions-panel";
import { TradingTicket } from "./components/trading-ticket";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <MarketSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 lg:px-8">
            <div className="grid gap-6 xl:grid-cols-[2.1fr,1fr]">
              <ChartPanel />
              <AccountOverview />
            </div>
            <div className="grid gap-6 xl:grid-cols-[2.1fr,1fr]">
              <OrderflowPanel />
              <TradingTicket />
            </div>
            <div className="grid gap-6 xl:grid-cols-[2.1fr,1fr]">
              <PositionsPanel />
              <EducationPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
