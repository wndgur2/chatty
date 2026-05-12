# Android Implementation Plan

Step-by-step plan to deliver the Chatty Android client described in
[`contexts/ANDROID.md`](../ANDROID.md). Each phase produces a verifiable
artifact; do not advance until the "Verify" step passes.

> **Scope contract.** Anything not in `contexts/ANDROID.md` is out of scope.
> If a step seems to require it, stop and amend the spec first.

---

## Phase 0 — Prerequisites (no code)

Goal: collect external assets so later phases never block on someone else.

| # | Task | Owner | Blocking later phase |
| - | ---- | ----- | -------------------- |
| 0.1 | Confirm production hostname (e.g. `chatty.app`) | Product | Phases 6, 7, 9 |
| 0.2 | Create Firebase **Android** app in the existing project; package `com.chatty.app`; download `google-services.json` | Operator | Phase 5 |
| 0.3 | Install Android Studio Koala+; accept SDK licenses; install SDK 35, Build Tools 35.x, Pixel 7 API 35 (Google Play) system image; create AVD `Pixel_7_API_35` | Engineer | Phase 2 |
| 0.4 | Verify local Nest backend runs on `http://localhost:8081` (see [`run-local-dev` SKILL](../../.cursor/skills/run-local-dev/SKILL.md)) | Engineer | Phase 2 |

**Exit criterion**: `google-services.json` is on disk and the emulator boots
to the launcher.

---

## Phase 1 — Capacitor scaffolding

Goal: a `frontend/android/` Gradle project that wraps the existing Vite
build. No app behavior changes yet.

### Steps

1. **Pin Capacitor deps** in `frontend/package.json`:

   ```bash
   cd frontend
   npm install --save \
     @capacitor/core \
     @capacitor/android \
     @capacitor/app \
     @capacitor/preferences \
     @capacitor/push-notifications \
     @capacitor/splash-screen \
     @capacitor/status-bar
   npm install --save-dev @capacitor/cli
   ```

2. **Create `frontend/capacitor.config.ts`** with the skeleton from
   [`ANDROID.md §6`](../ANDROID.md#6-project-layout).

3. **Generate the Android project**:

   ```bash
   cd frontend
   npm run build               # produces dist/
   npx cap add android
   ```

4. **Update `.gitignore`** with the entries from
   [`ANDROID.md §6.1`](../ANDROID.md#61-gitignore-additions).

5. **Sanity-check Gradle wrapper** opens without error:

   ```bash
   cd frontend/android
   ./gradlew tasks --no-daemon
   ```

### Verify

- `frontend/android/app/build.gradle` exists with `applicationId "com.chatty.app"`.
- `./gradlew tasks` lists `assembleDebug` and `bundleRelease`.
- `git status` shows no tracked files under `frontend/android/app/build/`,
  `.gradle/`, or `local.properties`.

### Deliverable commit

`feat(android): scaffold Capacitor android project (com.chatty.app)`

---

## Phase 2 — First emulator run (debug)

Goal: the existing React app renders inside the Android WebView on the
emulator and talks to the local Nest backend.

### Steps

1. **Boot the AVD** from Android Studio (Device Manager → ▶) or:

   ```bash
   $ANDROID_HOME/emulator/emulator -avd Pixel_7_API_35 -netdelay none -netspeed full &
   ```

2. **Build the web bundle pointed at the emulator-host alias**:

   ```bash
   cd frontend
   VITE_API_URL=http://10.0.2.2:8081 npm run build
   npx cap copy android
   ```

3. **Install debug APK**:

   ```bash
   cd frontend/android
   ./gradlew installDebug
   adb shell monkey -p com.chatty.app 1
   ```

### Verify (smoke checklist)

- App launches and lands on the React entry route (no white screen, no
  "webpage not available").
- A fresh install with no cached token automatically issues a guest session
  (`POST /api/auth/guest-session` visible in backend logs).
- Sending a message to a chatroom returns a streamed AI reply.
- `adb logcat -s Capacitor` shows no plugin errors.

### Deliverable commit

`docs(android): record local emulator run procedure` (only if the
[`run-local-dev` SKILL](../../.cursor/skills/run-local-dev/SKILL.md) needs an Android section).

---

## Phase 3 — Storage & platform abstraction

Goal: a single typed module that reads/writes JWTs in `localStorage` on the
web and `@capacitor/preferences` on Android, with no `if (isNative)` calls
scattered through components.

### Steps

1. Create `frontend/src/lib/platform.ts`:

   ```ts
   import { Capacitor } from '@capacitor/core'
   export const isNativeAndroid = () =>
     Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
   ```

2. Create `frontend/src/lib/storage.ts` — async, typed by key:

   ```ts
   import { Preferences } from '@capacitor/preferences'
   import { isNativeAndroid } from './platform'

   type Key = 'auth.token' | 'auth.principal' | 'push.fcmToken' | 'push.permissionDecided'
   export async function get(key: Key): Promise<string | null> { /* ... */ }
   export async function set(key: Key, value: string): Promise<void> { /* ... */ }
   export async function remove(key: Key): Promise<void> { /* ... */ }
   ```

3. Migrate **only** the auth token reader/writer in existing auth code to
   `storage.ts`. Leave other web-only state where it is.

4. Update Vitest setup to mock `@capacitor/preferences` (web tests must still pass).

### Verify

- `npm run test` passes in `frontend/`.
- On emulator: log in once → kill app from recents → relaunch → still logged
  in (token survives via Preferences).
- On `npm run dev` in a desktop browser: log in → reload → still logged in
  (token survives via localStorage). No regression.

### Deliverable commit

`feat(frontend): abstract auth token storage behind platform-aware module`

---

## Phase 4 — Splash & status bar

Goal: a non-jarring cold-start experience. ≤2s splash, status bar tracks
theme.

### Steps

1. Configure `SplashScreen` and `StatusBar` plugins in
   `capacitor.config.ts` per [`ANDROID.md §11`](../ANDROID.md#11-splash--theming).
2. In `frontend/src/main.tsx` (or app bootstrap), call
   `SplashScreen.hide()` after the first render commit; add a 1500ms safety
   timeout.
3. On theme changes, call `StatusBar.setStyle({ style: 'LIGHT' | 'DARK' })`.

### Verify

- Cold start: splash visible ≤2s, no flash of white before React mounts.
- Status bar text legible against background in both light and dark mode.

### Deliverable commit

`feat(android): wire splash screen and status bar to app lifecycle`

---

## Phase 5 — Push notifications (FCM, native)

Goal: backend `POST /api/notifications/register` accepts the native FCM
token for both member and guest principals; test pushes deliver and tap-to-open
routes correctly.

> **Prerequisite**: Phase 0.2 (`google-services.json`) **must** be done.

### Steps

1. **Place `google-services.json`** at `frontend/android/app/google-services.json`.
2. **Apply Google Services plugin** in Gradle:
   - `frontend/android/build.gradle`: classpath `com.google.gms:google-services:4.4.2`.
   - `frontend/android/app/build.gradle`: `apply plugin: 'com.google.gms.google-services'`.
3. **Create `frontend/src/hooks/useNativePushRegistration.ts`**:
   - On mount, if `isNativeAndroid()`, call `requestPermissions()` → `register()`.
   - On `registration` event: `POST /api/notifications/register { deviceToken }` with the current bearer (member or guest).
   - Cache last-registered token in `storage` keyed `push.fcmToken`; re-register on event re-fire (don't skip — tokens rotate).
4. **Foreground handler** (`pushNotificationReceived`): invalidate the
   relevant TanStack Query keys (`chatroomKeys.messages(chatroomId)`);
   do not raise a system notification.
5. **Tap handler** (`pushNotificationActionPerformed`): read
   `data.chatroomId`, call `router.navigate(\`/chatrooms/\${id}\`)`.
6. Mount the hook **once** in the authenticated layout (not at app root,
   so it only fires after a principal exists).

### Verify

```bash
# From any terminal with backend access:
curl -sS -X POST http://localhost:8081/api/notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chatroomId":"<id>"}'
```

- Foreground: app's chatroom view re-fetches messages and shows the new one;
  no system tray notification.
- Background (home button → trigger curl above): system notification appears
  in the tray.
- Tap the notification: app opens directly into `/chatrooms/<id>`.
- `adb logcat -s FirebaseMessaging` shows token registration.

### Deliverable commit

`feat(android): native FCM push with foreground/tap routing`

---

## Phase 6 — Deep links (Android App Links)

Goal: `https://<production-host>/r/:chatroomId` opens the app directly into
the chatroom; falls back to browser if not installed.

> **Note**: domain verification (`autoVerify=true`) requires
> `assetlinks.json` to be live at `https://<production-host>/.well-known/assetlinks.json`.
> Until Phase 0.1 (production domain) lands, links will still work via the
> "Open with" chooser — just not auto-verified.

### Steps

1. Add the `<intent-filter>` from [`ANDROID.md §9.1`](../ANDROID.md#91-manifest-intent-filter) to `MainActivity` in `AndroidManifest.xml`.
2. Create `frontend/src/lib/deepLinks.ts`:
   - Subscribe to `App.addListener('appUrlOpen', ...)`.
   - Parse `/r/:id` and call `router.navigate(...)`.
   - Render the existing 404/forbidden state if the chatroom isn't accessible
     to the current principal.
3. Initialize the listener once in the app shell (after Phase 3 storage is ready, so we don't navigate before auth resolves).
4. **Defer to Phase 9**: publish `assetlinks.json` containing both the local
   upload-key SHA-256 and the Play-managed app-signing key SHA-256.

### Verify

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://<production-host>/r/1" com.chatty.app
```

- App opens directly into `/chatrooms/1` (or shows the not-authorized state if
  the current principal can't access it).
- Pressing back exits the app cleanly (does not back-stack into a white screen).

### Deliverable commit

`feat(android): handle App Link intents for chatroom deep linking`

---

## Phase 7 — Release signing & network security

Goal: a signed, release-mode AAB that refuses cleartext HTTP.

### Steps

1. **Generate the upload keystore** locally per
   [`ANDROID.md §12.1`](../ANDROID.md#121-keystore). Store path/passwords in
   `~/.gradle/gradle.properties` (NEVER in repo).
2. **Wire the signing config** in `frontend/android/app/build.gradle`:

   ```groovy
   signingConfigs {
     release {
       storeFile file(CHATTY_UPLOAD_STORE_FILE)
       storePassword CHATTY_UPLOAD_STORE_PASSWORD
       keyAlias CHATTY_UPLOAD_KEY_ALIAS
       keyPassword CHATTY_UPLOAD_KEY_PASSWORD
     }
   }
   buildTypes {
     release {
       signingConfig signingConfigs.release
       minifyEnabled false           // WebView shell — nothing to shrink
     }
   }
   ```

3. **Add `frontend/android/app/src/main/res/xml/network_security_config.xml`** allowing cleartext **only** for `10.0.2.2` (debug). Reference it from
   `<application>` in `AndroidManifest.xml` and set
   `android:usesCleartextTraffic="false"` on the application.
4. **Print SHA-256 fingerprints** (needed in Phase 9 for `assetlinks.json`):

   ```bash
   keytool -list -v -keystore frontend/android/keystore/chatty-upload.jks \
     -alias chatty-upload | grep "SHA-256"
   ```

   Save this for the operator runbook.

### Verify

- `./gradlew bundleRelease` succeeds and produces
  `app/build/outputs/bundle/release/app-release.aab`.
- `bundletool build-apks --bundle app-release.aab ...` extracts a universal
  APK that installs on the emulator.
- Release build with `VITE_API_URL=http://example.com` (intentional cleartext) **fails** to connect; switching to HTTPS works.

### Deliverable commit

`feat(android): release signing config and TLS-only network policy`

---

## Phase 8 — App identity polish

Goal: icons, naming, and version metadata ready for a Play listing.

### Steps

1. Generate adaptive icons from `frontend/public/pwa/icon.svg` and
   `maskable-icon.svg` via Android Studio → *Image Asset* tool. Overwrite
   `frontend/android/app/src/main/res/mipmap-*/`.
2. Confirm `applicationId`, `versionCode = 1`, `versionName = "0.1.0"` in
   `app/build.gradle`.
3. Document the version-bump procedure inline (one line in `app/build.gradle`
   header comment): bump both fields on every Play upload.
4. Update `frontend/android/app/src/main/res/values/strings.xml` so the app
   label is `Chatty`.

### Verify

- Launcher shows the adaptive icon with the correct foreground/background and
  no aliasing on round masks.
- Long-press the icon → app info → name is "Chatty".
- `aapt2 dump badging app-release.aab` (via bundletool) shows
  `package: name='com.chatty.app' versionCode='1' versionName='0.1.0'`.

### Deliverable commit

`chore(android): adaptive icons, app label, and initial version metadata`

---

## Phase 9 — Pre-submission gates (blocked on §17 of spec)

Goal: clear every blocker listed in [`ANDROID.md §17`](../ANDROID.md#17-launch-blockers-must-resolve-before-play-submission) **before** uploading to Play.

> This phase is intentionally split out because none of it is Android-side
> code — but the spec is non-submittable until each item is checked.

### Tasks

- [ ] **Account deletion**: ship `DELETE /api/users/me` on the backend (cascade
      cleanup) **and** a public web URL (e.g. `/delete-account`) describing
      how to request deletion. Tracked separately from this plan; this file
      depends on it.
- [ ] **Privacy policy + Terms**: publish at stable URLs on the production domain.
- [ ] **Production domain + TLS**: hostname resolves, cert valid, app reachable.
- [ ] **`assetlinks.json` live** at `https://<production-host>/.well-known/assetlinks.json`, including **both** the upload-key SHA-256 (Phase 7.4) and the Play-managed app-signing-key SHA-256 (visible in Play Console → *Setup → App integrity* after first upload — chicken-and-egg, see §9.2 workflow).

### Verify

- `curl -sS https://<production-host>/.well-known/assetlinks.json | jq .`
  returns valid JSON with both fingerprints.
- `adb shell pm verify-app-links --re-verify com.chatty.app` reports the
  domain as `verified`.

---

## Phase 10 — Play Store submission (Internal testing track)

Goal: a closed-track release running on a real device.

### Steps

1. **Google Play Developer account** registered ($25 one-time).
2. **Create app in Play Console** with package `com.chatty.app`. **Enroll in
   Play App Signing** when prompted (do not opt out).
3. Fill metadata:
   - Short description, full description, screenshots (≥2 phone), 1024×500 feature graphic, 512×512 icon.
   - Privacy policy URL (Phase 9).
   - Data Safety form per [`ANDROID.md §16.1`](../ANDROID.md#161-data-safety-declaration-play-console).
   - Content rating questionnaire (IARC).
   - Target audience + ads questionnaires.
4. Upload `app-release.aab` to **Internal testing** track; add test
   accounts.
5. After Play assigns the app-signing key, **update `assetlinks.json`** with
   the second SHA-256 fingerprint and re-deploy.
6. Run the **smoke test from [`ANDROID.md §15.3`](../ANDROID.md#153-manual-smoke-test-emulator)** on at least one physical device pulled from the internal test track.

### Verify

- Test users on the internal track can install from the Play Store link.
- Smoke checklist (§15.3) passes end-to-end on a physical device.
- App Links auto-verification confirmed (`pm verify-app-links` on a device).

### Deliverable

Play Console release record + tag the repo (`v0.1.0-android`).

---

## Risk-driven branch points

| Trigger                                                  | Action                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npx cap add android` produces unexpected directory tree | Stop. Re-read [`ANDROID.md §6`](../ANDROID.md#6-project-layout) and re-run; do **not** hand-edit Gradle to fit a different layout. |
| Vitest fails after Phase 3                               | Fix the mock for `@capacitor/preferences` before continuing — web parity is non-negotiable. |
| Phase 5 push tokens never register                       | Check `google-services.json` package matches `com.chatty.app` and SHA-256 isn't required (we don't use Google Sign-In). |
| Play reviewer flags "low-quality WebView wrapper"        | Confirm Phases 4, 5, 6, 8 all shipped (splash, push, deep links, adaptive icons). These are the four signals reviewers check. |
| Need a feature outside the plugin allowlist              | Update `contexts/ANDROID.md §2` first; do not silently add dependencies. |

---

## Estimated effort

| Phase                   | Rough effort (engineer-hours) |
| ----------------------- | ----------------------------- |
| 0 — Prerequisites       | 2                             |
| 1 — Capacitor scaffold  | 1                             |
| 2 — First emulator run  | 1                             |
| 3 — Storage abstraction | 3                             |
| 4 — Splash + status bar | 1                             |
| 5 — FCM native push     | 4                             |
| 6 — Deep links          | 2                             |
| 7 — Release signing     | 2                             |
| 8 — Identity polish     | 1                             |
| 9 — Pre-submission gates | **depends on backend work**  |
| 10 — Play submission    | 4 (mostly Play Console paperwork) |

Total Android-side engineering: **~21 hours**, excluding Phase 9 backend work
and Play Console review wait time.

---

## Progress tracker (mark as you go)

- [ ] Phase 0 — Prerequisites
- [ ] Phase 1 — Capacitor scaffolding
- [ ] Phase 2 — First emulator run
- [ ] Phase 3 — Storage & platform abstraction
- [ ] Phase 4 — Splash & status bar
- [ ] Phase 5 — Push notifications (native FCM)
- [ ] Phase 6 — Deep links (Android App Links)
- [ ] Phase 7 — Release signing & network security
- [ ] Phase 8 — App identity polish
- [ ] Phase 9 — Pre-submission gates (blockers)
- [ ] Phase 10 — Play Store submission (Internal testing)
