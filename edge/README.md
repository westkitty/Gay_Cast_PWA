# GayCast Edge

Bounded Cloudflare Worker search broker for the GayCast PWA. Callers provide only a query plus allowlisted provider IDs; arbitrary target URLs are not accepted. Android provider support and Edge adapter readiness remain separate evidence states.

Production endpoint: `https://gaycast-edge.atlas-of-one.workers.dev`

Routes: `GET /health`, `GET /v1/providers`, and `GET /v1/search?q=...&providers=...`. Requests are limited to six providers; the PWA batches larger eligible sets. Native Cloudflare rate limiting is configured as `SEARCH_RATE_LIMITER` at 120 searches per 60 seconds.

Current adapter evidence (2026-09-16):
- GayPornArchive: LIVE VERIFIED. `bear` and `muscle` each returned 40 query-evidenced results; nonsense fallback is rejected as `QUERY_FALLBACK`.
- GayPornPlanet: LIVE VERIFIED. `bear` and `muscle` each returned 40 results with zero URL overlap; nonsense returned `QUERY_FALLBACK` and zero trusted results.
- MachoTube: LIVE VERIFIED. `bear` and `muscle` each returned 40 query-evidenced results; nonsense fallback is rejected as `QUERY_FALLBACK`.
- SunPorno: LIVE VERIFIED from Cloudflare. `bear` returned 12 results, `muscle` returned 40, and a nonsense control returned HTTP 404 with zero trusted results.
- XVideos: parser fixture passes, but the Cloudflare vantage receives the provider's tiny "Please visit" response. It is cached as `VANTAGE_BLOCKED` and is not re-fetched on every user search.
- BarebackBastards: parser fixture passes, but Cloudflare upstream fetches hit the eight-second budget. It is cached as `VANTAGE_TIMEOUT` and is not re-fetched on every user search.
- Other contract-supported providers: `ADAPTER_UNIMPLEMENTED` until separately implemented and verified.

Run local contract tests with `node --test edge/test/*.test.mjs`. Bundle validation: `wrangler deploy --dry-run --config edge/wrangler.jsonc`.


## Normalized adapter contract

`edge/src/adapters.mjs` is the portable internal adapter boundary. Each live adapter declares an ID/version, bounded URL builder, response parser, and query-evidence evaluator. The Worker registry remains allowlist-driven; the browser cannot submit an arbitrary upstream URL or domain.

`search-contract.mjs` defines the normalized cross-runtime search response used by the Worker and PWA. Trusted result data is kept separate from provider evidence reports. Missing metadata remains absent rather than being guessed.

Current evidence states retain distinct meanings including `OK`, `EMPTY`, `QUERY_FALLBACK`, `VANTAGE_BLOCKED`, `VANTAGE_TIMEOUT`, `ADAPTER_UNIMPLEMENTED`, `HTTP_ERROR`, `UNEXPECTED_CONTENT`, and `NETWORK_ERROR`. `EMPTY` is a trusted query-specific no-result observation; it is not the same as a fallback, timeout, block, or unimplemented adapter.

The four previously live-verified adapters remain GayPornArchive, GayPornPlanet, MachoTube, and SunPorno. XVideos and BarebackBastards remain honestly represented as Cloudflare-vantage states, not successful empty searches. Provider-count expansion was intentionally not part of this reliability phase.
