# GayCast PWA

The browser edition of GayCast. It is installable, works as an offline shell, keeps its saved state in the browser, plays local files and direct media URLs, and launches query-specific searches on supported providers.

GitHub Pages is static hosting, so this edition does not claim Android-only capabilities such as cross-origin provider scraping, Media3 playback, native casting, foreground downloads, LAN discovery, or watch-party sockets. Provider results stay on the provider site instead of being fabricated inside the PWA.

## Local test

Serve this directory over HTTP rather than opening `index.html` directly so the service worker can register.

```sh
python3 -m http.server 4173
```
