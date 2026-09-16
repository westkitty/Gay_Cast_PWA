# Operational State: GayCast PWA

## Project identity
- Canonical repository: `westkitty/Gay_Cast_PWA`.
- Product: installable browser/PWA edition of GayCast.
- Hosting: `https://westkitty.github.io/Gay_Cast_PWA/` through GitHub Pages.
- Android GayCast remains a separate private repository and is not exposed here.

## Current parity baseline
- Browser persistence uses versioned IndexedDB stores for media, collections, creators, saved searches, inbox, and settings.
- Media records support favorite, watched, progress, duration, bookmarks, tags, notes, creator, collection, and timestamps.
- Search supports verified provider handoffs, search history, quick terms, and saved searches without fabricated aggregate results.
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
- Full multi-provider result aggregation requires a trusted backend or provider APIs with suitable CORS; static Pages alone cannot supply it reliably.
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
