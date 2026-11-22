# Aqil Computers

Offline inventory, costing, sales and customer ledger for Aqil Computers.
One self-contained HTML file, plus an Android app built with Capacitor.

- **Web app / PWA:** https://khalilgemini214-boop.github.io/aqil-computers/
- **Standalone file:** [`aqil-computers.html`](aqil-computers.html) — open it in any browser, fully offline
- **Android APK:** https://github.com/khalilgemini214-boop/aqil-computers/releases/latest/download/aqil-computers.apk

All data is stored on the device (`localStorage`). Nothing is uploaded.

## How updates work

The app checks `version.json` on GitHub when it starts.

| What changed | What the app does |
| --- | --- |
| Web build only (the HTML) | Downloads the new file in the background and swaps it in on the **next app restart**. No reinstall, no data loss. |
| Android shell (native code, permissions, icons) | It cannot replace itself, so it shows a **“New app version required”** modal with a direct APK download button. |

Version numbers:

- `APP_VERSION` inside `aqil-computers.html` — the web build. Bump it for every release.
- `shell` in `release.json` — the Android app itself. Bump it only when `android/` changed, so every phone is told to install the new APK.

## Releasing

```bash
# 1. change the app, then bump the version in aqil-computers.html and release.json
node sync.js            # generates dist/ (Pages) and www/ (Capacitor)
git add -A
git commit -m "Release 1.1.0"
git push                # GitHub Actions deploys the web build to Pages

# 2. Android APK (only when you want a new APK)
git tag v1.1.0
git push --tags         # Actions builds the APK and attaches it to the release
```

Push to `main` → **Web app** workflow deploys `dist/` to GitHub Pages.
Push tag `v*` → **Android APK** workflow builds `aqil-computers.apk` and attaches it to that release.

The APK is a debug build, signed with the standard Android debug key. It installs fine and updates fine; it is not meant for the Play Store.

## Local development

```bash
npm install
npm run preview        # http://127.0.0.1:4177 — the real Pages build with the service worker
npm run android:sync   # regenerate www/ and copy it into the Android project
npm run android:open   # open android/ in Android Studio
npm run android:apk    # build a debug APK (needs JDK 21 + Android SDK)
```

Files:

```
aqil-computers.html      the whole app (source of truth)
release.json             repo, shell version, release notes
sync.js                  builds dist/ and www/, syncs the Android version code
static/                  service worker, manifest, icons
native/loader.html       Android update loader (downloads, verifies, swaps bundles, rolls back)
android/                 Capacitor Android project
.github/workflows/       Pages deploy + APK build
```

## Notes

- The Android app runs the bundle from local storage, so it opens instantly and works offline. If a downloaded update fails to start, the loader automatically rolls back to the previous working bundle.
- Browser data is per-origin: the `file://` copy and the GitHub Pages copy have separate storage. Use **Backup & data → Export backup** and then **Import backup** when moving.
- The APK download opens in Chrome. Android may ask once for permission to install apps from the browser.
