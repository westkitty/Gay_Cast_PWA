# Operational State: GayCast PWA

## Project identity
- Canonical repository: `westkitty/Gay_Cast_PWA`.
- Product: installable browser/PWA edition of GayCast.
- Hosting: GitHub Pages at `https://westkitty.github.io/Gay_Cast_PWA/`.
- Current baseline: `36092f22f41db9d1bd0ebd1e37e577be0af01e16`.
- Android GayCast remains a separate private repository and is not exposed here.

## Verified capabilities
- GitHub Pages deployment workflow completed successfully.
- Live Pages root returns HTTP 200 over HTTPS.
- Live page exposes the GayCast title and current hero content.
- Live manifest is valid JSON and declares standalone display plus 192px/512px PNG icons.
- JavaScript and service-worker source pass `node --check`.
- Static PWA validation and `git diff --check` passed before publication.
- Public visible copy passed the deterministic public-copy lint gate.

## Active invariants
- Never fabricate provider search results.
- Provider searches open the provider's real query URL when browser cross-origin rules prevent reliable aggregation.
- Local history and saved URL state remain browser-local.
- Local file selections are session-only and never uploaded by the PWA.
- Ordinary page URLs must not be reported as successful direct-media playback.
- Android-only capabilities must remain clearly identified rather than simulated in the PWA.

## Known limits
- Static GitHub Pages cannot reliably scrape third-party provider HTML across origins.
- Android Media3, foreground downloads, native casting, LAN discovery, Room storage, scoped-media permissions, and watch-party sockets are not browser capabilities here.
- Local-file persistence across sessions is intentionally not claimed; browser file selections are ephemeral.
- Direct media playback depends on browser codec support, provider CORS policy, and whether the URL actually resolves to playable media.

## Deployment contract
- `.github/workflows/pages.yml` deploys the repository root with official GitHub Pages actions.
- Pages uses HTTPS and workflow-based deployment.
- Any future claim of browser feature parity must be backed by browser-path evidence, not Android evidence.

## Revision log
- 2026-09-16: Initial public PWA repository created and published. GitHub Pages enabled with workflow deployment. Live root and manifest verified over HTTPS. Initial browser feature set includes installability, offline shell, provider search handoffs, browser-local history/saved URLs/favorites, local-file session playback, and direct-media playback with honest failure reporting.
