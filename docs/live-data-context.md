# Live Data Integration Context

## Why switch?
- The current experience relies on deterministic mocks in `apps/mock-server` and `apps/web/src/data/mock.ts`, so traders never see real fills, funding, or volatility.
- Moving to live feeds lets the Beginner Outlook cards explain genuine risk/reward, aligning the UI with actual market behaviour.
- Separating the data layer also paves the way to swap providers (Coinbase, Hyperliquid, Chainlink) without touching the React app.

## Scope Overview
1. **Replace mock engine with a real data service**
   - Rename `apps/mock-server` → `apps/data-service`.
   - Proxy market, funding, and order flow to chosen providers (REST polling + WebSocket fan-out).
   - Cache/normalise responses into the existing `/markets`, `/positions`, `/stream` contract.

2. **Retire mock-specific modules**
   - Delete `apps/web/src/data/mock.ts` and any placeholder scenario helpers.
   - Remove demo-only copy (e.g., “we speed up funding timers”) once live feeds drive the cards.
   - Drop mock order replay logic unless we rebuild it on live data recordings.

3. **Rewire the front end**
   - Replace static imports with live hooks (React Query + WebSocket) that call the data service.
   - Add loading/error skeletons for every card (Plan Summary, Risk Snapshot, Funding Outlook, Trading Ticket).
   - Keep a feature flag (`VITE_USE_MOCKS=false`) so we can fall back to demo mode if the live API rate limits or goes down.

4. **Flexible staking & evaluation window**
   - Allow arbitrary numbers instead of hard-coded slider stops.
   - Recalculate risk/funding projections on each edit.
   - Persist custom values to the onboarding plan so the dashboard mirrors the user’s exact configuration.

## Key Decisions to Make
- **Provider matrix:** define which exchange/oracle supplies price, funding rate, open interest, and trades for each asset.
- **Update cadence:** choose between WebSocket push vs. REST polling interval per data type.
- **Authentication:** store API keys in environment variables (`LIVE_MARKET_API_KEY`, etc.) and document rotation steps.
- **Error handling:** specify fallback behaviour (show last known data, surface warning banners, auto-retry).

## Suggested Sequencing
1. Confirm provider coverage and credentials.
2. Stand up the new data service with mocked responses that match live schemas (keeps front-end work unblocked).
3. Implement frontend hooks + UI fallbacks; feature flag live mode.
4. Flip providers to live endpoints in staging, observe stability, then enable by default.

## Risks & Mitigations
- **Rate limits / downtime:** add server-side caching, exponential backoff, and health telemetry.
- **Data integrity:** validate funding/price deltas before feeding risk calculations to avoid misleading beginners.
- **Security:** lock down API keys and ensure no secret leaks to the browser (data service should own authenticated calls).

## Public APIs in Use (Current Implementation)
- **Binance Futures Premium Index** – `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT` (and `ETHUSDT`) for mark price, index price, and latest funding rate.
- **Binance 24h Ticker** – `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT` for 24h change, quote volume, and open interest.
- The provider registry in `apps/mock-server/src/providers` lets us add or swap sources (e.g., Coinbase, Hyperliquid) by implementing the `MarketProvider` interface and updating the asset configuration or environment overrides (`MARKET_PROVIDER_BTC`, `MARKET_SYMBOL_BTC`, etc.).

## Next Steps
- Draft environment variable checklist for both the data service and web app.
- Align with design on any copy updates once live numbers land (e.g., removing demo disclaimers).
- Plan for regression tests that compare mock vs. live mode outputs to safeguard the Beginner Outlook flow.
