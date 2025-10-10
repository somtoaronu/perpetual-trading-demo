import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Web3Provider } from "./providers/web3";
import { OnboardingProvider } from "./providers/onboarding";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Web3Provider>
      <OnboardingProvider>
        <App />
      </OnboardingProvider>
    </Web3Provider>
  </StrictMode>
);
