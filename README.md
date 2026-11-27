# Aqil Computers

Offline inventory, costing, sales and customer ledger for Aqil Computers.
One self-contained HTML file, plus an Android app built with Capacitor.

- **Web app / PWA:** https://khalilgemini214-boop.github.io/aqil-computers/
- **Standalone file:** [`aqil-computers.html`](aqil-computers.html) — open it in any browser, fully offline
- **Android APK:** https://github.com/khalilgemini214-boop/aqil-computers/releases/latest/download/aqil-computers.apk

All data is stored on the device (`localStorage`). Nothing is uploaded.

## How updates work

Every build gets an automatic timestamp (`build` in `version.json`), so **you do not bump a version number to ship a change** — push the code and the app notices.

| What changed | What happens |
| --- | --- |
| HTML / CSS / JS (the app itself) | On start the app fetches `version.json`. If the build stamp is newer, the Android app downloads the new bundle in the background, verifies it and swaps it in on the **next restart**. No reinstall, no data loss. In a browser the service worker fetches the new build on reload. |
| Android shell (`android/`, permissions, icons, plugins) | It cannot replace itself, so it shows a **“New app version required”** modal with **Download APK** and **Release page** buttons. Data stays on the phone. |

A downloaded bundle that fails to start is automatically rolled back to the previous working one.

Versions:

- `APP_VERSION` in `aqil-computers.html` — human release number.
- `APP_BUILD` — stamped by `sync.js` on every build (do not edit).
- `shell` in `release.json` — the Android apk itself. Bump it only when `android/` or the loader changed, so phones are told to install a new APK.

## Releasing

```bash
# normal app change: no version bump needed
node sync.js
git add -A && git commit -m "Ledger tweaks" && git push   # phones update on next start

# new APK (only when native code / loader / icons change)
# 1. bump "shell" (and optionally "version") in release.json
# 2. bump APP_VERSION in aqil-computers.html if the number shown should change
node sync.js
git add -A && git commit -m "Release 1.1.0" && git push
git tag v1.1.0 && git push --tags
```

- Push to `main` → **Web app** workflow deploys `dist/` to GitHub Pages.
- Push tag `v*` → **Android APK** workflow builds `aqil-computers.apk` and attaches it to the release.

The APK is debug-signed: it installs and updates normally, but it is not meant for the Play Store.

## Deploying to Cloudflare (optional)

The repo ships `wrangler.jsonc`, so Cloudflare serves the generated `dist/` folder as static assets.
In **Workers & Pages → aqil-computers → Settings → Build** set:

| Setting | Value |
| --- | --- |
| Build command | `node sync.js` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Or deploy from this machine with `npm run deploy`.

Cloudflare is a **second copy** of the app with its own browser storage. Keep one URL as the main app (the GitHub Pages URL is what the APK uses for updates) and use the other only for testing.

## Local development

```bash
npm install
npm run preview        # http://127.0.0.1:4177 — the real Pages build with the service worker
npm run android:sync   # regenerate www/ and copy it into the Android project
npm run android:open   # open android/ in Android Studio
npm run android:apk    # build a debug APK (needs JDK 21 + Android SDK)
npm run deploy         # deploy dist/ to Cloudflare
```

Files:

```
aqil-computers.html      the whole app (source of truth)
release.json             repo, shell version, release notes
sync.js                  builds dist/ and www/, stamps the build, syncs the Android version code
static/                  service worker, manifest, icons
native/loader.html       Android update loader (downloads, verifies, swaps bundles, rolls back)
wrangler.jsonc           Cloudflare static-assets config
android/                 Capacitor Android project
.github/workflows/       Pages deploy + APK build
```

## Notes

- The Android app runs from local storage, so it opens instantly and works offline.
- Browser data is per-origin: the `file://` copy, GitHub Pages and Cloudflare each have separate storage. Use **Backup & data → Export backup** / **Import backup** to move records.
- The APK download opens in Chrome. Android may ask once for permission to install apps from the browser.
