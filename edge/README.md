# GayCast Edge

Bounded Cloudflare Worker search broker for the GayCast PWA. Callers provide only a query plus allowlisted provider IDs; arbitrary target URLs are not accepted. Android provider support and Edge adapter readiness remain separate evidence states.

Production endpoint: `https://gaycast-edge.atlas-of-one.workers.dev`

Routes: `GET /health`, `GET /v1/providers`, and `GET /v1/search?q=...&providers=...`. Requests are limited to six providers; the PWA batches larger eligible sets. Native Cloudflare rate limiting is configured as `SEARCH_RATE_LIMITER` at 120 searches per 60 seconds.

Current adapter evidence (2026-09-16):
- GayPornPlanet: LIVE VERIFIED. `bear` and `muscle` each returned 40 results with zero URL overlap; nonsense returned `QUERY_FALLBACK` and zero trusted results.
- XVideos: parser fixture passes, but the Cloudflare vantage receives the provider's tiny "Please visit" response. It is cached as `VANTAGE_BLOCKED` and is not re-fetched on every user search.
- BarebackBastards: parser fixture passes, but Cloudflare upstream fetches hit the eight-second budget. It is cached as `VANTAGE_TIMEOUT` and is not re-fetched on every user search.
- Other contract-supported providers: `ADAPTER_UNIMPLEMENTED` until separately implemented and verified.

Run local contract tests with `node --test edge/test/*.test.mjs`. Bundle validation: `wrangler deploy --dry-run --config edge/wrangler.jsonc`.
