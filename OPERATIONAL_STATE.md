# Operational State: GayCast PWA

## Project identity
- Canonical repository: `westkitty/Gay_Cast_PWA`.
- Product: installable browser/PWA edition of GayCast.
- Hosting: `https://westkitty.github.io/Gay_Cast_PWA/` through GitHub Pages.
- Android GayCast remains a separate private repository and is not exposed here.

## Current parity baseline
- Browser persistence uses versioned IndexedDB stores for media, collections, creators, saved searches, inbox, and settings.
- Media records support favorite, watched, progress, duration, bookmarks, tags, notes, creator, collection, and timestamps.
- Search supports GayCast Edge brokered results, per-provider evidence states, verified direct-provider fallback, search history, quick terms, and saved searches without fabricated aggregate results.
- Library supports local filtering/sorting, favorite and unwatched filters, URL records, ephemeral local-file playback, and local discovery recommendations.
- Player supports honest success/failure state, progress persistence, bookmarks, watched state, PiP, fullscreen, Media Session, Web Share, Remote Playback where available, and CORS-permitted direct downloads.
- Privacy/data surfaces support optional hashed PIN, background re-lock, JSON export/import, storage estimates, and persistent-storage requests.
- Service worker caches the application shell for offline launch.

## Active invariants
- Never fabricate provider search results or playback success.
- Cross-site provider HTML is not scraped from static GitHub Pages when browser origin policy blocks trustworthy access.
- Library and curation data remain browser-local unless the user explicitly exports or shares them.
- Selected local media files are session-only and are never uploaded by the PWA.
- Browser-dependent capabilities must be labeled as such rather than treated as universal.
- Android-only capabilities must remain explicit rather than simulated.

## Remaining hard platform boundaries
- Multi-provider aggregation now uses the separate trusted GayCast Edge Worker; individual provider coverage remains adapter- and network-vantage-dependent and must fail honestly when not proven.
- Android foreground download/service behavior has no static-PWA equivalent.
- Native LAN discovery, Fire TV-specific control, and socket-based watch parties require a signaling/native network layer not present on Pages.
- Android Media3, scoped storage, camera/QR integration, and FLAG_SECURE do not have equivalent universal browser APIs.
- Local-file persistence across restarts remains browser/permission dependent; ordinary file-picker selections are ephemeral.

## Verification state
- JavaScript modules and service worker pass `node --check`.
- Manifest parses as valid JSON and static source passes `git diff --check`.
- Headless Chrome loaded the application over HTTP, executed module initialization, opened IndexedDB, rendered the storage estimate, and populated the runtime capability matrix without observed JavaScript exceptions.
- Full interactive browser matrix (every control in multiple browser engines) remains narrower than Android physical-device evidence and must not be conflated with it.

## Revision log
- 2026-09-16: Initial Pages PWA published.
- 2026-09-16: Major parity pass replaced localStorage-only prototype state with IndexedDB domain stores and added library curation, local discovery, saved searches, creators, inbox, progress/bookmarks/watched state, backup/restore, PIN/background lock, browser storage controls, PiP/fullscreen/Media Session/Web Share/Remote Playback hooks, and direct-download handling while preserving explicit browser/native boundaries.

## Shared provider truth + GayCast Edge — 2026-09-16
- `provider-contract.json` is a byte-for-byte mirror of Android-generated `contracts/provider-contract.json`; Android `SearchProviderSupportRegistry.kt` remains the authority.
- PWA provider eligibility derives from the contract: 6 supported gay-specific providers by default and 6 supported general networks behind explicit local opt-in.
- Service-worker cache `gaycast-pwa-v5` includes both provider and runtime configuration while remaining network-first for updates.
- GayCast Edge is deployed at `https://gaycast-edge.atlas-of-one.workers.dev`; production endpoint injection is controlled by repository variable `GAYCAST_EDGE_BASE_URL`, not hard-coded into the client source.
- The broker is allowlist-only, accepts no arbitrary target URL, limits each request to 6 providers, bounds query/page inputs, restricts browser CORS to `https://westkitty.github.io`, and uses native Cloudflare `SEARCH_RATE_LIMITER` at 120 searches/60 seconds.
- PWA searches larger than 6 eligible providers are transparently split into bounded broker batches and canonical-deduplicated client-side. Direct verified provider searches remain visible as the recovery path.
- GayPornArchive, GayPornPlanet, and MachoTube adapters are LIVE VERIFIED on Cloudflare. Each returned 40 trusted results for `bear` and `muscle`; provider-specific nonsense controls return `QUERY_FALLBACK` with 0 trusted results.
- XVideos parser is implemented but Cloudflare-vantage blocked by the provider's explicit tiny redirect message; `VANTAGE_BLOCKED` is cached as a known Edge state so searches do not re-fetch it.
- BarebackBastards parser is implemented but Cloudflare upstream exceeds the 8-second broker budget; `VANTAGE_TIMEOUT` is cached as a known Edge state so it cannot stall aggregate searches.
- Unsupported Edge parsers return `ADAPTER_UNIMPLEMENTED`; Android `SUPPORTED` never implies Edge success.
- Edge unit/contract suite contains 17 passing tests, including rate-limit behavior, GayPornPlanet redirect evidence, GayPornArchive/MachoTube query-evidence guards, and cached Cloudflare-vantage failure states.
- Pages CI validates manifest/contract/runtime JSON, browser/service-worker syntax, Edge syntax, and Edge contract tests before deployment.

- 2026-09-16 Edge latency closeout: default six-provider `bear` request returned 40 proven GayPornPlanet results in ~194 ms client-observed; BarebackBastards `VANTAGE_TIMEOUT` and other unimplemented states returned immediately rather than blocking the batch. Deployed Worker version `f317f1a9-f50f-45ea-a6b7-3cd1de36c574`.
- 2026-09-16 three-source aggregate closeout: default six-provider `bear` request returned 120 proven results (40 each from GayPornArchive, GayPornPlanet, MachoTube) in ~223 ms client-observed. Deployed Worker version `74ce2c1b-f698-43d4-a890-f27a61596314`.
- 2026-09-16 live Pages user-path proof: `https://westkitty.github.io/Gay_Cast_PWA/?q=bear` rendered 120 brokered result cards in fresh headless Chrome (GayPornArchive 40, GayPornPlanet 40, MachoTube 40), six provider reports, six direct fallback launchers, populated quick-search controls, and zero DevTools runtime error events. Pages workflow `35091194122` completed successfully for source commit `7a275f9a38440e900468314a80f5c903325e3bd9`.

- 2026-09-16 SunPorno Edge expansion: committed adapter `0e55adb` and deployed Worker version `e153d656-30e6-4e2e-a949-806e0e214f48` from the authorized local Wrangler OAuth session. Live Cloudflare proof: `bear` -> 12 `OK` results at `/s/bear/`; `muscle` -> 40 `OK` results at `/tags/muscle/`; nonsense `qzxqzxqzx987` -> HTTP 404 and zero trusted results. `/health` now advertises four Edge adapters.
- 2026-09-16 deployment-CI finding: `.github/workflows/edge.yml` was upgraded to `cloudflare/wrangler-action@v4` so `wrangler.jsonc` is recognized, but GitHub Actions deployment remains BLOCKED because repository Cloudflare API/account secrets are not currently available to the workflow. Local Wrangler OAuth deployment is verified working; do not claim unattended Edge CI deployment until scoped GitHub secrets are configured and a workflow run succeeds. Failed evidence: runs `35157175831` (Wrangler 3/config mismatch) and `35157248088` (Wrangler 4/auth missing).


## State revision 2026-09-18.1 — provider reliability + truthful offline search

### Implemented
- Added shared normalized search contract `search-contract.mjs` used by Edge responses, PWA normalization/rendering, trusted-result filtering, canonical deduplication, and offline snapshot compatibility.
- Refactored Edge provider behavior into portable allowlisted adapters in `edge/src/adapters.mjs`; adapter-owned seams now cover bounded URL construction, parsing, response-state interpretation where provider-specific, and query-evidence validation.
- Preserved live adapter set: GayPornArchive, GayPornPlanet, MachoTube, and SunPorno. No provider was added merely to increase count.
- Preserved known non-live states: XVideos = `VANTAGE_BLOCKED`, BarebackBastards = `VANTAGE_TIMEOUT`. Android `SUPPORTED` remains separate from Edge readiness.
- Added PWA provider evidence surface showing contract eligibility, Edge adapter availability/readiness, most recent locally observed evidence, most recent result count, most recent trusted search time, Cloudflare-vantage state when known, and direct-provider fallback availability.
- Added IndexedDB schema v3 with `searchSnapshots` and `providerObservations`. Existing media/collections/creators/savedSearches/inbox/settings stores are not deleted or rewritten by upgrade.
- Added exact normalized-query + exact provider-set offline snapshots. Snapshots are bounded to 30 compatible queries, 240 trusted results per query, and a 30-day maximum age.
- Cached snapshots are explicitly labeled `CACHED / OFFLINE` or `CACHED / BROKER UNAVAILABLE`, preserve original evidence timestamps/states, and are never silently replaced when connectivity returns. A deliberate `Refresh live` action becomes available after reconnect.
- Derived search snapshots/provider observations remain browser-local and are excluded from the normal user-authored JSON backup.
- Service-worker shell cache advanced to `gaycast-pwa-v6` only to include the new shared/browser modules. Dynamic Edge search responses remain outside the service-worker static cache.

### Verification
- Legacy Edge/parser suite returned to green after adapter extraction.
- Expanded Node suite: 30/30 passing, covering provider allowlisting, normalized result/report shape, query-evidence rejection, known vantage states, bounded provider count, arbitrary target URL rejection, aggregate deduplication, timeout evidence, exact query/provider keys, snapshot schema/age rejection, cache bounds, untrusted-result filtering, and non-destructive v3 store creation.
- Static syntax checks cover `app.js`, `db.js`, `db-schema.mjs`, `search-contract.mjs`, `sw.js`, `edge/src/adapters.mjs`, and `edge/src/index.mjs`.
- Pages and Edge workflows now validate the new shared and adapter modules before deployment.

### Preserved boundaries
- `provider-contract.json` remains Android-derived provider-support truth and was not manually edited in this phase.
- Worker remains query/provider allowlist-only with existing six-provider request bound, CORS boundary, and rate-limit binding.
- GitHub Pages remains static hosting; the production Edge URL continues to be injected through `runtime-config.json`.
- No Cloudflare credentials, account secrets, local Wrangler cache, or browser profiles belong in the repository.
- Local selected media files remain session-only.
- Direct provider launchers remain the fallback path.

### Deployment boundary
- Source validation and repository delivery are separate from Cloudflare production deployment.
- Unattended Edge CI remains blocked until the required GitHub Cloudflare secrets actually exist and a workflow run succeeds.
- Local Wrangler OAuth deployment remains historically verified, but this reliability source phase does not require or imply a new production Worker deployment.

- Browser smoke note (2026-09-18): headless Chrome was available, but both isolated DevTools and sequential `--dump-dom` harnesses wedged in the temporary Chrome profile before completing the v2→v3/offline user-path assertions. Only the v2 seed step was observed. Treat browser migration/offline smoke as BLOCKED/UNVERIFIED for this source phase; no browser-pass claim is authorized from that attempt.
