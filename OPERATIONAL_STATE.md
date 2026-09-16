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
- GayPornPlanet adapter is LIVE VERIFIED on Cloudflare: `bear` = 40 results, `muscle` = 40 results, URL intersection = 0; nonsense control = `QUERY_FALLBACK`, 0 trusted results.
- XVideos parser is implemented but Cloudflare-vantage blocked by the provider's explicit tiny redirect message; state is `VANTAGE_BLOCKED`, not success/empty.
- BarebackBastards parser is implemented but Cloudflare upstream currently exceeds the 8-second broker budget; state is `TIMEOUT`.
- Unsupported Edge parsers return `ADAPTER_UNIMPLEMENTED`; Android `SUPPORTED` never implies Edge success.
- Edge unit/contract suite contains 12 passing tests, including rate-limit behavior and GayPornPlanet query-fallback/result-path regressions.
- Pages CI validates manifest/contract/runtime JSON, browser/service-worker syntax, Edge syntax, and Edge contract tests before deployment.
