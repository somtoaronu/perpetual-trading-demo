# Implementation Checklist (created November 7, 2025)

Use this checklist to shepherd the improvements captured in `docs/deep-dive.md` from idea to delivery. Grouped sections make it easy to spot blockers, and each line captures the owner, status, target date, and dependencies per checklist best practices around assignments, due dates, and progress indicators.[^atlassian] GitHub's own planning workflow also recommends decomposing initiatives into smaller issues or tasks before execution, so consider promoting each checkbox into a dedicated ticket once scoped.[^github]

## How to work this list
- **Status keys**: `Not Started`, `In Progress`, `Blocked`, `Ready for Review`, `Done`.
- **Owner**: individual or squad accountable for delivery.
- **Target date**: optional planned completion date (YYYY-MM-DD).
- Update notes/dependencies whenever assumptions change; this file should stay lightweight but truthful.

---

## Priority 1 – Infrastructure & Code Quality (Clean Architecture: Infrastructure Layer)
- [ ] **P1. Publish shared DTO & validation package** — Extract `MarketData`, onboarding payloads, and feedback schemas into a workspace package (e.g., `packages/types`) using `zod` for runtime validation + type inference. Wire both `apps/web` and `apps/mock-server` to consume these exports.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Align on package workspace naming; confirm build tooling (tsup/tsc references).

- [ ] **P2. Runtime env validation & safer `requireApiBase` usage** — Introduce a bootstrap-level config validator (e.g., `zod` or `envalid`) that surfaces missing `VITE_API_BASE_URL`, `VITE_API_KEY`, etc., without throwing during module evaluation. Update `onboarding-api.ts` and other imports to lazy-load config.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Decide on validation lib; coordinate with CI to fail fast when vars absent.

- [ ] **P3. Automated testing + CI pipeline** — Add Vitest/component tests for `apps/web`, Supertest suites for `apps/mock-server`, and integrate them (plus lint/typecheck) into a monorepo pipeline (GitHub Actions/Turborepo). Configure required checks before merging.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Decide on package manager caching strategy; align with branch protection rules.

- [ ] **P4. Environment catalog & examples** — Provide `.env.example` files per workspace, document required secrets, and add a script (or `taskfile`) to sync env vars for local/staging. Validate envs at startup using the same schema as production.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Coordination with security on secret distribution tooling.

- [ ] **P5. Containerization & dev orchestration** — Create Dockerfiles for the mock server and frontend, publish images, and supply a `docker-compose.yml` that also launches Mongo + Hardhat nodes for end-to-end testing.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Registry selection (GHCR/ECR); confirm devs’ container runtime compatibility.

- [ ] **P6. Structured logging + correlation IDs** — Adopt `pino` or `winston` with JSON output, include request IDs, and forward logs to the chosen aggregation target. Update the WebSocket broadcaster and provider modules to log context-rich events.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Select logging transport (stdout vs. hosted collector).

- [ ] **P7. Metrics & enhanced health checks** — Extend `/health` to expose last provider refresh, queue depths, and Mongo connectivity. Emit Prometheus counters/gauges (e.g., market refresh failures, API latency) for alerting.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Need metrics backend decision (Prometheus, Grafana Cloud, etc.).

## Priority 2 – Backend Services (Application Layer)
- [ ] **B1. Harden HTTP surface** — Add `helmet`, enforce TLS termination (behind reverse proxy), implement rotating API keys and per-route rate limiting/slowdown (`/orders`, `/feedback`, `/api/onboarding`). Document key rotation and credential storage.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Need decision on API gateway vs. Express middleware; confirm secrets manager.

- [ ] **B2. Fix feedback persistence guard & queueing** — Update `ensureFeedbackReady` to mirror onboarding guard behavior, returning 503 when Mongo is down. Implement an in-memory (or Redis) queue that flushes once persistence recovers, with telemetry so the UI can retry gracefully.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Optional Redis deployment; UI contract for surfaced errors.

- [ ] **B3. Provider timeout + backpressure controls** — Wrap each provider fetch (`binance-perp`, `synthetic`, `fixture`) in `AbortController` timeouts, add exponential backoff and jitter when scheduling `refreshMarkets`, and emit metrics for failures to support alerting.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Decide on minimum acceptable data freshness; confirm logging stack (see P6).

- [ ] **B4. Central schema validation middleware** — Replace bespoke validators with shared schemas (from P1) applied via Express middleware, ensuring consistent error responses and leveraging TypeScript inference server-side.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Completion of P1 shared package; align on validation error format.

- [ ] **B5. Psychology-informed sentiment ingestion service** — Stand up a pluggable aggregator that polls Perplexity’s crypto briefs and curated Reddit communities (e.g., r/CryptoCurrency, r/ethfinance) for market psychology signals, stores normalized sentiment events, and triggers Nodemailer-based email alerts whenever drawdowns overlap with fresh negative reports. Deliver the same feed to onboarding so the sidebar can surface timely mindset tips via a dedicated WebSocket channel, leaving room to bolt on future providers (e.g., Twitter, research feeds) without rewriting downstream consumers.[^sentiment]
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Finalize Perplexity + Reddit API credentials/terms, configure Telegram bot access (TELEGRAM_BOT_TOKEN/TELEGRAM_GROUP_ID) for group ingestion, choose sentiment scoring (e.g., VADER) and storage schema, configure Nodemailer with the default `EMAIL_HOST=mail.privateemail.com` (override-able later), and design the WebSocket payload contract + aggregator interface for the sidebar.

## Priority 3 – Smart-Contract & Domain Logic
- [ ] **S1. Generate type-safe wagmi hooks from contracts** — Use `@wagmi/cli` or TypeChain outputs to auto-create React hooks for `PerpEngine` events (deposits, intent submissions). Demonstrate consumption in the dashboard so on-chain events can drive UI state once real logic replaces the mock server.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Ensure ABIs stay in sync; coordinate with contract roadmap.

## Priority 4 – Frontend & Interface Layer
- [ ] **UI1. Replace custom polling with TanStack Query + WebSocket hook** — Migrate `MarketDataProvider` to `useQuery` for caching/retries and add a hook that subscribes to `/stream` for push updates. Expose a shared `useMarketStream` utility for components.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Confirm WebSocket base URL strategy and auth model.

- [ ] **UI2. Durable onboarding submission fallback** — When `/api/onboarding` is unavailable, persist “simulated” submissions in IndexedDB (or browser storage with background sync) and implement a retry worker to POST once connectivity returns. Surface banner messaging in the wizard.
  - Owner: `___`
  - Status: `Not Started`
  - Target date: `___`
  - Dependencies: Pick storage approach; ensure data encryption requirements are clarified.

- [x] **UI3. Surface psychology sentiment feed in the dashboard** — Add a `PsychologyProvider` + WebSocket subscriber and render a shadcn-style card summarizing Perplexity, Reddit, and Telegram cues in the post-onboarding layout.
  - Owner: `core-web`
  - Status: `Done (Nov 8, 2025)`
  - Target date: `2025-11-08`
  - Dependencies: Requires backend `/psychology` REST + `/psych` WebSocket endpoints and configured env keys (Perplexity, Reddit, Telegram).

---
_Last reviewed on November 7, 2025._

[^atlassian]: Atlassian Confluence checklist guide – emphasizes grouped tasks, owners, due dates, and progress indicators for effective collaboration. https://www.atlassian.com/software/confluence/resources/guides/how-to/checklist
[^github]: GitHub Docs – "Plan a project with GitHub Copilot" demonstrates breaking initiatives into epics/features/tasks for better tracking. https://github.com/github/docs/blob/main/content/copilot/tutorials/plan-a-project.md
[^sentiment]: Alpaca "Reddit Sentiment Analysis Strategy" outlines how to scrape Reddit, compute polarity scores, and act on community psychology for crypto decisions. https://alpaca.markets/learn/reddit-sentiment-analysis-trading-strategy
