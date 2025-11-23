# Perpetual Trading Demo – Deep Dive (updated November 7, 2025)

This document summarizes the current architecture, stack, and improvement opportunities for the **perpetual-trading-demo** monorepo. Sources referenced below include the codebase itself plus Express production security guidance from the Express.js maintainers.[^express]

## Monorepo Snapshot
- **Workspaces**: `apps/web` (React client), `apps/mock-server` (TypeScript Express API + WebSocket), `contracts` (Hardhat project with placeholder perpetual engine contracts).
- **Primary flows**: onboarding wizard → onboarding API, market data polling/streaming, submission of feedback, optional on-chain actions via wagmi + Hardhat/Sepolia RPCs.
- **Key dependencies**: React 19, Vite 7, Tailwind + shadcn/ui, TanStack Query, wagmi/viem, Express 4, ws, MongoDB driver, Binance Futures HTTP APIs, Coinbase + CoinGecko price fallbacks, Hardhat + OpenZeppelin.

## Architecture Overview
1. **Front-end (`apps/web`)**
   - `main.tsx` composes `Web3Provider` (wagmi + TanStack Query), `MarketDataProvider`, and `OnboardingProvider` before rendering `App.tsx`.
   - `App.tsx` switches between the `OnboardingWizard` and the post-onboarding dashboard (market sidebar, plan cards, chart panel, feedback panel, etc.).
   - Providers encapsulate API access: `MarketDataProvider` polls `GET /markets`; `OnboardingProvider` fetches/saves plans over `/api/onboarding`; feedback form posts to `/feedback`; `useCoinPrices` pulls spot prices from Coinbase with CoinGecko + market fallbacks.

2. **Mock server (`apps/mock-server`)**
   - `src/index.ts` bootstraps Express, configures CORS whitelists driven by `ALLOWED_ORIGINS`, verifies API keys, mounts REST endpoints (`/markets`, `/api/onboarding`, `/feedback`, `/orders`) and a WebSocket stream at `/stream`.
   - `OnboardingStore` and `FeedbackStore` wrap MongoDB collections but degrade to in-memory storage when `MONGO_URI` is missing or unreachable.
   - `market-service.ts` polls providers listed in `asset-config.ts` every `MARKET_REFRESH_MS` ms, caching entries and emitting updates via an `EventEmitter`. Providers include live Binance futures quotes, deterministic synthetic data, and JSON fixtures.

3. **Contracts (`contracts`)**
   - Hardhat config targets Solidity 0.8.26 with Sepolia + local networks.
   - Contracts include `PerpEngine.sol` (event-only placeholder for collateral + intent flows), `MockOracle.sol`, and `MockUSDC.sol`. Scripts deploy to local/Sepolia for wagmi demos.

### Architecture Diagram
```mermaid
graph TD
  subgraph Frontend (apps/web)
    Web3[Web3Provider\nwagmi+viem] --> Providers
    Providers[MarketData & Onboarding Providers] --> App[App.tsx UI]
  end

  subgraph MockServer (apps/mock-server)
    ExpressAPI[Express REST + ws server] -->|CRUD| Mongo[(MongoDB)]
    ExpressAPI -->|poll| MarketSvc[Market Service]
    MarketSvc --> Binance[(Binance Perp API)]
    MarketSvc --> Synthetic[Synthetic Generator]
    MarketSvc --> Fixtures[markets.json fixtures]
  end

  subgraph Contracts (contracts)
    Hardhat[Hardhat scripts] --> Perp[PerpEngine.sol]
    Hardhat --> Oracle[MockOracle.sol]
  end

  App -->|HTTP fetch| ExpressAPI
  App -->|WebSocket /stream| ExpressAPI
  App -->|wagmi RPC| Hardhat
```

## Technology Stack Highlights
| Layer | Technologies | Notes |
| --- | --- | --- |
| UI & state | React 19, Vite 7, TypeScript, Tailwind, shadcn/ui, TanStack Query, wagmi/viem | `App.tsx`, `providers/` contexts, `components/` dashboards. |
| Data access | Native fetch, custom `requireApiBase`, Coinbase & CoinGecko fetchers | `.env.local` must define `VITE_API_BASE_URL`, `VITE_API_KEY`, `VITE_COINGECKO_DEMO_KEY`. |
| API server | Express 4, cors, ws, dotenv, MongoDB Node driver, tsx dev runner | `index.ts`, `market-service.ts`, provider registry + fixtures. |
| Realtime | WebSocket broadcast on `/stream` + client polling fallback | Provider caches feed both HTTP responses and websocket pushes. |
| Data providers | Binance Futures HTTP endpoints, synthetic wave generator, JSON fixtures | Controlled via `MARKET_PROVIDER_*` env vars. |
| Storage | MongoDB collections for onboarding + feedback (`perp_demo` DB) | Graceful degradation to memory when `MONGO_URI` missing. |
| Smart contracts | Hardhat 2.26, Solidity 0.8.26, OpenZeppelin 5 | `PerpEngine.sol` exposes deposit/open/close intent events only. |

## Key Workflows
- **Onboarding**: `OnboardingProvider` collects selections → `submitOnboardingPlan` posts JSON to `/api/onboarding` with API key → server validates payload (`validateOnboardingPayload`) → `OnboardingStore.upsertPlan` persists to Mongo with unique wallet index.
- **Market data**: `startMarketPolling` periodically hydrates cache → HTTP `/markets` returns cached array, `/stream` pushes diff events → client `MarketDataProvider` polls every 15s (WebSocket not yet consumed on the client).
- **Feedback**: UI sanitizes input and posts to `/feedback` with optional `x-api-key` → `FeedbackStore.insert` stores to Mongo or memory fallback. `ensureFeedbackReady` currently returns true even when persistence is disabled, so UI receives 201 responses even if data only lives in RAM.
- **On-chain sim**: `Web3Provider` registers MetaMask connectors for Hardhat/Sepolia; contracts emit events but don’t process funds, giving the UI endpoints to listen to while remaining non-custodial.

## Improvement Opportunities

### Frontend & Shared Code
1. **Share DTOs between client and server**: `apps/web/src/providers/market-data.tsx` defines `Market` independently of the server-side `MarketData` type. Promote shared schemas via a small workspace package (e.g., `packages/types`) or codegen from a `zod`/OpenAPI contract to prevent drift and enable end-to-end type checking.
2. **Adopt TanStack Query or WebSocket hooks for markets**: `MarketDataProvider` re-implements polling, loading flags, and manual refresh. Extract it into a `useQuery` + `subscribe` hook to unify caching, retries, and error handling, and to consume `/stream` for near-real-time updates.
3. **Fail-fast env validation**: The front-end calls `requireApiBase()` at import time (`lib/onboarding-api.ts`), so builds crash when `VITE_API_BASE_URL` is undefined (including Storybook/tests). Replace with a small runtime `getApiBase()` plus `zod` schema validated in `main.tsx`, logging warnings without tearing down the bundle.
4. **Instrument onboarding fallbacks**: When `/api/onboarding` times out, the client silently stores data locally. Persist these “simulated” records to IndexedDB with background sync to avoid data loss if the tab closes before reconnection.

### Mock Server & APIs
1. **Harden HTTP security**: Apply `helmet`, enforce TLS termination, and rotate API keys per Express security guidance (don’t rely solely on a static `x-api-key`). Add rate limiting (e.g., `express-rate-limit`) and slow-down middleware for `/orders` and `/feedback` to mitigate brute-force attempts.[^express]
2. **Fix feedback persistence guard**: `ensureFeedbackReady` always returns `true`, meaning 201 responses are sent even if Mongo writes fail. Mirror `ensureStoreReady` by surfacing 503s and queueing submissions to flush once the store reconnects.
3. **Back-pressure for provider polling**: `refreshMarkets` fires concurrent provider fetches without timeouts or jitter. Wrap remote calls in `AbortController` timeouts, add per-provider circuit breakers, and stagger schedules (e.g., `setTimeout` offsets) to avoid synchronized spikes when Binance rate limits.
4. **Centralize schema validation**: Validation logic in `validateOnboardingPayload` and `validateFeedbackPayload` is hand-written and duplicated in the client. Introduce `zod` schemas shared via a workspace package, and expose them to the front-end for compile-time safety.
5. **Observability & logging**: Add structured logging (pino/winston) plus health metrics (Prometheus counters for provider success/failure, websocket clients, request rates). Current logs rely on `console` with minimal context, making it hard to troubleshoot polling failures in production.

### Infrastructure & DevEx
1. **Environment management**: Document required env vars per workspace and validate them at boot (e.g., `envalid`). Provide `.env.example` files for `apps/mock-server` and `apps/web` plus scripts to sync secrets into local dev containers.
2. **Automated testing**: There are no tests outside Hardhat defaults. Add API contract tests (Supertest) and React component tests (Vitest/Testing Library) plus a Playwright smoke test that exercises onboarding → feedback to guard against regressions.
3. **CI/CD**: Set up a monorepo pipeline (GitHub Actions/Turborepo) that runs lint/typecheck/test across workspaces, caches pnpm installs, and deploys the mock server + app to staging.
4. **Runtime packaging**: Containerize the mock server with multi-stage builds, configure health probes (`GET /health`), and publish versioned images. Provide a docker-compose file that wires Mongo, mock server, Vite dev server, and Hardhat node for easy onboarding.
5. **Smart-contract integration**: The contracts emit events but the UI does not consume them. Consider generating type-safe wagmi hooks from ABI via `@wagmi/cli`, enabling real event-driven UI demos once the engine logic matures.

---
_Last reviewed on November 7, 2025._

[^express]: Express.js Production Best Practices – Security (https://expressjs.com/en/advanced/best-practice-security.html).
