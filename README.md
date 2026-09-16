# GayCast PWA

GayCast's installable browser client, hosted on GitHub Pages. It keeps its library and curation state locally in IndexedDB and is designed to remain useful offline after the app shell has been cached.

## Browser feature set

- Persistent local library with favorites, watched state, playback progress, bookmarks, tags, notes, creators, collections, saved searches, and a review inbox.
- Local deterministic discovery from the user's own library state.
- Verified provider search launchers with recent-search and saved-search workflows. The PWA never invents cross-site search results that the browser cannot verify.
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
