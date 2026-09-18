# GayCast PWA

GayCast's installable browser client, hosted on GitHub Pages. It keeps its library and curation state locally in IndexedDB and is designed to remain useful offline after the app shell has been cached.

## Browser feature set

- Persistent local library with favorites, watched state, playback progress, bookmarks, tags, notes, creators, collections, saved searches, and a review inbox.
- Local discovery from the user's own library state; no remote recommendation service or library upload is involved.
- Verified brokered search through GayCast Edge, with provider evidence reports, recent/saved searches, and direct-provider launchers retained as fallback. The PWA never invents cross-site results when an adapter is unavailable, blocked, empty, or query-fallback.
- Local-file and compatible direct-URL playback with Media Session metadata, Picture-in-Picture, fullscreen, Web Share, and Remote Playback where the browser supports them.
- CORS-permitted direct-media downloads with a transparent fallback to the source URL when browser security prevents a direct fetch.
- Optional local PIN lock, background re-lock, JSON backup/restore, persistent-storage requests, and offline shell caching.
- Responsive dark crimson/rose interface for phone, tablet, and desktop browsers.

## Deliberate platform boundaries

GitHub Pages is static hosting. Browser security prevents reliable cross-origin scraping of arbitrary provider HTML, and a static PWA cannot replace Android foreground services, native LAN discovery/watch-party sockets, Media3, or Android scoped-storage APIs. Those capabilities are reported as unavailable instead of being simulated.

## Local test

Serve the repository over HTTP so IndexedDB and the service worker run in a normal web origin:

```sh
python3 -m http.server 4173
```
## Shared provider contract

Provider support is not maintained independently in this repository. `provider-contract.json` is a generated mirror of the evidence-backed Android GayCast provider registry. The PWA reads that contract at runtime, defaults to its verified gay-specific providers, and offers verified general networks only as an explicit opt-in.

## GayCast Edge

`edge/` contains the bounded Cloudflare Worker search broker deployed at `https://gaycast-edge.atlas-of-one.workers.dev`. It is not an open proxy: callers submit a query and allowlisted provider IDs only, with at most six providers per broker request. The PWA transparently batches larger eligible sets and canonical-deduplicates returned results.

GayPornArchive, GayPornPlanet, MachoTube, and SunPorno are live-verified Edge adapters. The default gay-only search still gets 120 proven `bear` results from the three active gay-specific Edge sources; when verified general networks are explicitly enabled, SunPorno adds a fourth live source. Its Cloudflare proof returned 12 `bear` results, 40 `muscle` results, and an honest HTTP 404 with zero results for a nonsense control. Nonsense/fallback responses are rejected rather than surfaced as relevant results. XVideos is currently `VANTAGE_BLOCKED` from Cloudflare and BarebackBastards currently times out from the Cloudflare vantage; neither condition is disguised as an empty successful search. Providers without an Edge parser return `ADAPTER_UNIMPLEMENTED`.

The Worker restricts browser CORS to `https://westkitty.github.io`, bounds query/page/provider counts, and uses Cloudflare's native `SEARCH_RATE_LIMITER` binding at 120 search calls per 60 seconds. `GAYCAST_EDGE_BASE_URL` is stored as a GitHub repository variable and injected into `runtime-config.json` by the Pages workflow; the source file keeps an empty endpoint so a clone remains deployable without Cloudflare.

Manual CI deployment is available through `.github/workflows/edge.yml` when a scoped `CLOUDFLARE_API_TOKEN` is configured. Local Wrangler OAuth deployment also works on the authorized development machine.


## Provider reliability and offline search snapshots

GayCast now uses one normalized provider-search contract across GayCast Edge, aggregate responses, PWA rendering, local observations, and cached search snapshots. Result records keep only evidence-backed fields such as provider ID, title, source URL, optional proven media/thumbnail metadata, and a canonical deduplication key. Provider reports separately record the provider ID, evidence state, result count, evaluated query, adapter identity/version when applicable, observation time, reason, and whether the returned result set is trusted.

The Edge broker is organized around a portable allowlisted adapter registry. A live adapter owns bounded query-URL construction, parsing, and query-evidence evaluation; adding an adapter does not permit arbitrary domains or browser-supplied target URLs. Android-derived `SUPPORTED` eligibility remains separate from Edge adapter readiness.

IndexedDB schema v3 adds two derived-data stores without replacing or deleting existing user stores:

- `searchSnapshots`: exact normalized-query + exact eligible-provider-set snapshots.
- `providerObservations`: the browser's most recent locally observed provider evidence.

Search snapshots are capped at 30 compatible queries, at 240 trusted results per snapshot, and expire after 30 days. They are shown only for an exact normalized query/provider-set match. Offline or broker-unavailable snapshots are explicitly labeled cached and retain their original provider evidence and capture time. They are never merged with speculative or live-looking placeholder results.

The provider evidence surface distinguishes contract eligibility, Edge adapter readiness, the last locally observed evidence state/count/time, known Cloudflare-vantage conditions, and direct-search fallback availability. “Last observed” is local evidence, not a global uptime claim.

Derived snapshot/observation stores stay browser-local and are intentionally excluded from the normal GayCast JSON backup. Existing media, collections, creators, saved searches, inbox, and settings remain the portable user-authored backup payload.
