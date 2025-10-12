import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Web3Provider } from "./providers/web3";
import { OnboardingProvider } from "./providers/onboarding";
import { MarketDataProvider } from "./providers/market-data";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Web3Provider>
      <MarketDataProvider>
        <OnboardingProvider>
          <App />
        </OnboardingProvider>
      </MarketDataProvider>
    </Web3Provider>
  </StrictMode>
);
