## Perpetual Trading MVP Requirements
_Last updated: October 9, 2025_

### 1. Objective
- Deliver a research-backed demo that explains perpetual swaps from beginner to advanced levels while mimicking Aster’s “Simple vs. Pro” experience.citeturn0search2
- Showcase a responsive React + TypeScript + Tailwind front end using shadcn/ui components, seeded with mock market data.
- Provide a Hardhat workspace with placeholder contracts and interfaces so on-chain interactions can be explored later without blocking UI progress.

### 2. Research Insights (Aster & Competitive Landscape)
- Aster emphasizes dual trading modes: Simple 1001x (streamlined tickets) and Pro (full depth, multi-asset margin, advanced order types), plus a Trade & Earn program for yield-bearing collateral.citeturn0search2turn0search7
- It offers stock index perpetuals, deep liquidity via private market makers, and hourly to 8-hour funding cadences that keep prices aligned with index oracles.citeturn0search3turn0search4
- Hyperliquid’s success stems from gasless, high-throughput matching and risk engine transparency—key cues for our education layer and performance messaging.citeturn1search0turn1search5
- High-performing trading dashboards cluster information around a central chart with flanking order books, depth visuals, and contextual stats; premium templates highlight dense but legible typography, gradient accents, and modular cards for analytics.citeturn2search0

### 3. Product Vision & Personas
- **Learner Lucy (Beginner):** Wants to understand perps basics, try small mock trades, and see immediate feedback.
- **Builder Ben (Intermediate):** Needs to tweak leverage, margin modes, and funding settings to grasp advanced mechanics.
- **Analyst Avery (Advanced):** Explores deeper analytics, risk metrics, and automation hooks to compare against exchanges like Aster/Hyperliquid.

Learning path:
1. Guided onboarding overlay introduces wallet connection, funding, leverage, and margin.
2. “Simple” ticket defaults to isolated positions with pre-filled leverage suggestions.
3. Unlock “Pro” view after tutorial completion, exposing cross-margin toggles, depth metrics, and configurable funding cadence.

### 4. MVP Scope Summary
- Front end: Vite + React + TypeScript + Tailwind + shadcn/ui. Layout mirrors pro CEX dashboards with responsive resizing.
- Data: Deterministic mock engines (local JSON + interval workers) simulating ETH-USDC and ETC-USDC markets with configurable volatility curves.
- Wallet: MetaMask integration (read-only when disconnected, sandboxed signer when connected to Hardhat or Sepolia).
- Contracts: Hardhat project with placeholder `MockUSDC`, `MockOracle`, and `PerpEngine` interfaces—no production logic, but typed events/ABIs for front-end integration.
- Documentation: Inline tooltips, glossary modal, and tutorial steps stored in JSON to keep education content editable.

### 5. Functional Requirements
**5.1 Onboarding & Accounts**
- MetaMask connect button with network gate (Sepolia default, fallback to Hardhat local chain).
- Read-only market browsing permitted without wallet; trade actions gated behind connection.
- Tutorial mode overlays highlight: funding, margin, liquidation price, fees.
- Guided onboarding wizard must persist the selected plan by calling `POST /api/onboarding`; the response unblocks the dashboard view and stores a timestamped summary of the wallet’s preferences.
- On application boot or wallet reconnect, call `GET /api/onboarding/:wallet` to hydrate state; if no record exists the user stays inside the wizard instead of falling back to the generic index layout (the current bug we observed when the database is absent).

**5.2 Market Data & Mock Services**
- Markets list with tickers, mark/index price, 24h change, funding rate, open interest; data pulled from mock WebSocket service seeded with random-walk generator.
- Depth/order book aggregated into 10 levels each side, plus mini depth histogram.
- Recent trades stream and funding countdown timer; funding accrual executes every simulated 5 minutes (sped-up cycle vs. live 8-hour cadence for teaching).citeturn0search4

**5.3 Trading Simulation**
- Order tickets: Simple (side, size slider, leverage slider, optional TP/SL toggle) and Pro (add limit price, post-only, reduce-only flags, isolated vs. cross margin).
- Order routing: Mock REST call `POST /orders`; engine returns synthetic fills based on current order book snapshot.
- Positions panel: entry price, size, leverage, liquidation price, unrealized/realized PnL, fees, funding paid/received.
- Account summary: wallet balance proxy, margin used, free collateral, account leverage (value ÷ equity).

**5.4 Funding & Risk**
- Funding rate displayed as % with direction indicator; tutorial explains premium vs. discount and auto debits or credits positions each cycle.citeturn0search3
- Liquidation logic: isolate margin per position, maintenance margin ratio configurable (default 0.6%); when equity below threshold, mark position as liquidated and log event.

**5.5 Analytics & Education**
- KPI cards for realized/unrealized PnL, ROE, total fees, funding impact.
- Interactive glossary modal with segments: Perps 101, Margin Mechanics, Funding, Advanced Orders, Risk Controls (pull content from research notes).
- Scenario simulator: slider adjustments (price, leverage) to show PnL impact in real time.

**5.6 Advanced Modules (Stretch Within MVP)**
- Funding history chart (line graph of rates over time).
- Order replay toggle to step through executed trades for a given session.
- Export session data as CSV for further analysis.

### 6. Mock Data & Services Strategy
- Node-based mock server (`apps/mock-server`) broadcasting random walk prices, synthetic order books, and trade events over WebSocket; also exposes REST endpoints for orders/positions.
- Deterministic seeds ensure reproducible demos; configuration stored in `.json` templates for each market.
- Funding engine recalculates every cycle: `fundingPayment = positionValue * fundingRate * (cycleMinutes/480)` (since 8-hour windows = 480 minutes).citeturn0search4

### 7. Persistence & Backend API
- **Service Footprint:** Extend `apps/mock-server` into a lightweight API tier (or spin up `apps/data-service`) reachable via `VITE_API_BASE_URL`; keep market mocks but add onboarding persistence routes.
- **Environment Variables:** The service reads `MONGO_URI` (aka `mongoUri`) and optional `PORT`; the web app needs `VITE_API_BASE_URL`. Example local string: `mongodb://localhost:27017/perp_demo`.
- **Onboarding Plan Schema:** Store documents in `onboardingPlans` with fields `walletAddress` (lowercased, unique), `platformId`, `coinSymbol`, `evaluationWindow`, `leverage`, `stake`, `predictionDirection`, `submittedAt`, `updatedAt`, plus optional `notes`.
- **API Contract:** `POST /api/onboarding` upserts the plan, normalises wallet casing, stamps server time, and returns the saved record; `GET /api/onboarding/:walletAddress` fetches the latest plan or 404s when absent; optionally expose `GET /api/onboarding` for admin review.
- **Setup & Tooling:** Ship a seed script (e.g., `pnpm seed:onboarding`) that connects with `const mongoUri = process.env.MONGO_URI ?? "mongodb://localhost:27017/perp_demo";`, creates the collection, ensures a unique index on `walletAddress`, and can preload demo plans.
- **QA Expectation:** If Mongo is unreachable, surface a clear error state so users remain in the wizard—this prevents the “previous index page” regression we see when persistence is missing.

```bash
mongosh "$mongoUri" --eval 'db.onboardingPlans.createIndex({ walletAddress: 1 }, { unique: true })'
```

### 8. Technical Architecture
- **Monorepo Layout:** `apps/web` (Vite React), `apps/mock-server`, `packages/ui` (shared shadcn components), `contracts` (Hardhat).
- **State Management:** Zustand with selectors; React Query for server sync.
- **Wallet & Chains:** `wagmi` + `viem` targeting Sepolia and Hardhat networks; fallback connectors for MetaMask only.
- **UI Toolkit:** Install shadcn/ui (button, card, dialog, tabs, table, chart wrappers). Tailwind `base` + theme tokens reflecting dark trading aesthetic inspired by reference dashboards.citeturn2search0
- **Testing:** Vitest + React Testing Library for critical UI logic; Hardhat tests stub event emission.

### 9. shadcn UI Integration Plan
- Generate component primitives (Navbar, Sidebar, Command palette) via shadcn CLI.
- Compose reusable widgets: `OrderTicket`, `OrderBook`, `DepthChart`, `FundingTicker`, `TutorialStepper`.
- Apply Tailwind CSS variables for dark/light toggles; use shadcn `ThemeToggle` for accessible contrast.

### 10. Hardhat Placeholder Contracts
- `MockUSDC.sol`: ERC20 with faucet `mint`.
- `MockOracle.sol`: owner-settable price; emits `PriceUpdated`.
- `PerpEngine.sol`: Interfaces for `deposit`, `withdraw`, `openPosition`, `closePosition`, `liquidate`; internal logic stubbed with events so the front end can react without real accounting.
- Provide deployment script targeting Hardhat network and Sepolia (optional), plus TypeScript typings via `typechain`.

### 11. Implementation Roadmap
1. **Phase 0 – Tooling:** Initialize pnpm workspace, set up linting/formatting, commit hooks.
2. **Phase 1 – Web Shell:** Scaffold layout, global state, mock data adapters, wallet connect.
3. **Phase 2 – Trading Modules:** Implement order book, trades feed, tickets, positions, analytics.
4. **Phase 2.5 – Onboarding API:** Wire Express + Mongo persistence, add health checks, and connect the wizard submit/retrieve flows.
5. **Phase 3 – Education Layer:** Guided tour, glossary, scenario simulator.
6. **Phase 4 – Contracts & Integration:** Deploy placeholder contracts locally, wire minimal read/write using MetaMask.
7. **Phase 5 – Polish:** Responsive tweaks, theming, documentation, handoff notes.

### 12. Risks & Open Items
- **Market Authenticity:** Mock data must feel realistic; calibrate volatility to avoid implausible spikes.
- **Performance:** Keep WebSocket diff handling efficient to mimic Hyperliquid responsiveness.citeturn1search0
- **Education Depth:** Ensure advanced content aligns with Aster feature set (e.g., equity perps, multi-asset margin).citeturn0search7
- **Future Integration:** Plan upgrade path for real oracle feeds and execution once contracts mature.
- **Persistence Reliability:** Missing Mongo connectivity currently drops users back on the generic index; add smoke tests and monitoring to prevent silent regressions.

### 13. Deliverables Checklist
- Updated `REQUIREMENTS.md` (this document).
- Research notes and citations embedded.
- Monorepo scaffold with web app, mock server, and Hardhat stubs.
- UI components matching reference layouts.
- Mock trading flow demonstrating Simple + Pro modes and education overlay.
- Onboarding persistence service wired to Mongo with documented schema, seed script, and health checks.
