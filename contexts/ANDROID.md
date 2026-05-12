# Android Application Specification: "Chatty"

This document is the authoritative spec for the Android client of Chatty. The
Android app is a thin Capacitor shell that wraps the existing React 19 web app
(`frontend/`) and adds the native capabilities required for production release
on Google Play (push notifications, deep links, splash, signing).

Read `contexts/PROJECT_PROPOSAL.md`, `contexts/API_DOCUMENTATION.md`, and
`contexts/SCHEMA.md` for the system-level context.

---

## 1. Objectives & Non-Goals

### 1.1 Objectives

- Ship a usable, Play-Store-ready Android app for v1 with **minimal native code**.
- Reuse the React 19 + Vite + PWA frontend verbatim — bundled into the APK.
- Support member (JWT) **and** guest sessions (`POST /api/auth/guest-session`),
  matching the web app.
- Deliver reliable push notifications via Firebase Cloud Messaging (FCM),
  reusing the existing Firebase project.
- Provide a frictionless local development loop on the Android emulator with
  the local Nest backend.

### 1.2 Non-Goals (v1)

- iOS support. Capacitor leaves the door open, but only `android/` is generated.
- Native UI screens. Everything renders inside the WebView; the only native
  surfaces are the splash screen, the system status bar, and OS-level
  notifications.
- In-app purchases, ads, or any paid features. The v1 app is **free**.
- Offline message editing/sync. The app requires network for live messaging.
- Background sync workers, widgets, Wear OS, or tablets-as-first-class.

---

## 2. Tech Stack

| Layer            | Choice                                               |
| ---------------- | ---------------------------------------------------- |
| App shell        | Capacitor 6+ (`@capacitor/core`, `@capacitor/android`) |
| Web payload      | React 19 + Vite (existing `frontend/`)               |
| Min / Target SDK | minSdk **24** (Android 7.0) / targetSdk **35** (Android 15, Play requirement as of 2025-08) |
| Language         | Java/Kotlin only where Capacitor scaffolds it; no custom modules in v1 |
| Push             | FCM via `@capacitor/push-notifications` + `google-services.json` |
| Storage          | `@capacitor/preferences` (JWT, FCM token cache)      |
| Deep links       | Android App Links (verified `https://` intent filter) |
| Build            | Gradle (Android Studio Koala or newer)               |
| Signing          | Local upload keystore + **Play App Signing** (Play-managed app key) |
| CI/CD            | **Local builds only** for v1 (no GitHub Actions for Android) |

Plugin allowlist (install only what we use — keep Gradle lean):

```
@capacitor/core
@capacitor/cli
@capacitor/android
@capacitor/app                 // back button & app lifecycle events
@capacitor/preferences         // JWT + FCM token cache
@capacitor/push-notifications  // FCM
@capacitor/splash-screen       // controlled splash dismissal
@capacitor/status-bar          // status bar color sync with theme
```

Anything beyond this list (camera, filesystem, geolocation, etc.) is out of
scope for v1 and must be added through an explicit spec change.

---

## 3. App Identity

| Field               | Value                                     |
| ------------------- | ----------------------------------------- |
| Application ID      | `com.chatty.app`                          |
| Display name        | `Chatty`                                  |
| Package (Capacitor) | `com.chatty.app`                          |
| App icon            | Reuse `frontend/public/pwa/icon.svg` + `maskable-icon.svg` (regenerate adaptive icons via Image Asset Studio) |
| Brand color         | `#ffffff` background (matches PWA manifest) |
| Default orientation | Portrait (`screenOrientation="portrait"`) |

Changing the application ID after the first Play Store upload requires a new
listing — pick this once and never change it.

### 3.1 Version scheme

- `versionName` = same as `frontend/package.json` `version` (semver, e.g. `0.1.0`).
- `versionCode` = monotonic integer, bumped on every Play upload. Suggested
  formula for clarity later: `MAJOR * 10000 + MINOR * 100 + PATCH`, e.g.
  `0.1.0` → `100`.
- Bumping is **manual** for v1. A `scripts/bump-android-version.mjs` helper may
  be added later if release cadence grows.

---

## 4. Environments

Only **two** environments are supported:

| Env       | Build type | `VITE_API_URL`                 | Notes                                                |
| --------- | ---------- | ------------------------------ | ---------------------------------------------------- |
| local-dev | `debug`    | `http://10.0.2.2:8081`         | `10.0.2.2` is the Android emulator's alias for host `localhost`. Cleartext HTTP allowed **only** for `debug`. |
| prod      | `release`  | `https://<production-host>`    | HTTPS required by Capacitor (`usesCleartextTraffic="false"`). |

Environment selection happens **at web build time** (Vite env vars) — there are
no Gradle `productFlavors` in v1. To produce a build:

```bash
# debug build for emulator
cd frontend
VITE_API_URL=http://10.0.2.2:8081 npm run build
npx cap copy android

# release build for Play Store
cd frontend
VITE_API_URL=https://<production-host> npm run build
npx cap copy android
```

`network_security_config.xml` permits cleartext **only** for `10.0.2.2` so that
release builds cannot accidentally talk to a non-TLS host.

---

## 5. WebView Loading Strategy

The Vite production bundle is **packaged inside the APK** (`webDir: "dist"`
in `capacitor.config.ts`). The WebView loads `file:///android_asset/public/index.html`
through Capacitor's local server.

Implications and trade-offs the operator must accept:

- Every frontend change requires a new Play Store release (Internal Testing or
  Production track). There is no remote OTA update mechanism in v1.
- Offline cold start works (HTML/JS/CSS are local). Live data (messages,
  socket.io) still requires network.
- The service-worker-based PWA caching is **disabled inside the Capacitor
  WebView**; FCM background delivery is handled natively via
  `@capacitor/push-notifications`, not the `firebase-messaging-sw.js` worker.

---

## 6. Project Layout

```
chatty/
├── frontend/                  # existing React 19 + Vite app
│   ├── capacitor.config.ts    # NEW — Capacitor configuration
│   └── android/               # NEW — generated by `npx cap add android`
│       ├── app/
│       │   ├── build.gradle
│       │   ├── google-services.json   # gitignored, see §7
│       │   └── src/main/AndroidManifest.xml
│       ├── build.gradle
│       └── gradle.properties
└── contexts/ANDROID.md        # this document
```

Rationale for nesting `android/` inside `frontend/`: Capacitor expects to live
next to `package.json` so `npx cap copy` can resolve `webDir: "dist"` cleanly.
A top-level `android/` directory would force custom `cap.config` paths and
brittle CI scripts.

`capacitor.config.ts` skeleton:

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.chatty.app',
  appName: 'Chatty',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    PushNotifications: { presentationOptions: ['alert', 'badge', 'sound'] },
    SplashScreen: { launchAutoHide: false, backgroundColor: '#ffffff' },
  },
}

export default config
```

### 6.1 Gitignore additions

```
frontend/android/app/google-services.json
frontend/android/keystore/*.jks
frontend/android/keystore/*.keystore
frontend/android/.gradle/
frontend/android/local.properties
frontend/android/app/build/
frontend/android/build/
```

---

## 7. Push Notifications (FCM, native)

### 7.1 Firebase setup

- **Reuse the same Firebase project** as the web app.
- In Firebase Console → *Project settings → Your apps → Add app → Android*,
  register `com.chatty.app` and download `google-services.json` into
  `frontend/android/app/`. **This file is gitignored**; share via 1Password or
  the team's secret manager.
- No SHA-1 fingerprint is required unless we add native Google Sign-In (out of
  scope for v1).

### 7.2 Token registration flow

1. After successful auth (member or guest), the web app reads
   `Capacitor.isNativePlatform()` and, on Android, dispatches to a native
   bridge module instead of the existing Web Push registration.
2. The Android path calls `PushNotifications.requestPermissions()` (Android 13+
   shows the `POST_NOTIFICATIONS` runtime prompt) → `register()` → on
   `registration` event, sends the FCM token to the backend:

   ```http
   POST /api/notifications/register
   Authorization: Bearer <accessToken>
   Content-Type: application/json

   { "deviceToken": "<fcm-token>" }
   ```
3. Token is cached in `Preferences` keyed by user/guest session ID so we only
   re-register on token rotation (`registration` fires again) or sign-out.
4. Backend endpoint already accepts either principal (member or guest) per
   `API_DOCUMENTATION.md §4.1` — **no backend changes required** for v1.

### 7.3 Foreground vs. background

- `pushNotificationReceived` (foreground) → show an in-app toast and update the
  TanStack Query cache for the affected chatroom; **do not** post a system
  notification.
- Background delivery is handled by the OS using the FCM `notification` payload
  rendered by Android directly.
- `pushNotificationActionPerformed` (notification tap) → parse `data.chatroomId`
  and `router.navigate(\`/chatrooms/\${id}\`)`.

### 7.4 Channels

One channel only for v1: `chat_messages` (default importance: `HIGH`,
vibration on). Channel is created lazily by the Capacitor plugin on first
notification. We do not pre-declare it in code.

---

## 8. Authentication & Guest Sessions

The Android app reuses the existing JWT flow with no native screens:

- **Member login**: existing email/password React form posts to
  `POST /api/auth/login`; token stored via `@capacitor/preferences`.
- **Guest mode**: on first launch (no cached token), call
  `POST /api/auth/guest-session` and cache the returned guest token + session
  ID. Guests get full chatroom/messaging access per §0.2 of the API doc.
- **Guest → Member upgrade**: when a guest later logs in/registers, call
  `POST /api/auth/merge-guest` with `X-Guest-Token` header so their chatrooms,
  memories, and FCM tokens migrate to the new member.
- **Sign out**: clear `Preferences` → next launch falls back into guest mode.

Storage keys (centralize in `frontend/src/lib/storage.ts`):

| Key                   | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `auth.token`          | Active access token (member or guest)                |
| `auth.principal`      | Discriminated JSON: `{ mode: "user" \| "guest", id }` |
| `push.fcmToken`       | Last FCM token successfully registered with backend  |
| `push.permissionDecided` | `"granted" \| "denied" \| "pending"`              |

> **Security note**: `@capacitor/preferences` writes to SharedPreferences,
> which is sandboxed per-app but **not** encrypted at rest. Rooted devices can
> read the JWT. This is acceptable for v1; if the threat model tightens, swap
> for `capacitor-secure-storage-plugin` or EncryptedSharedPreferences.

---

## 9. Deep Links (Android App Links)

Goal: tapping a notification, an email link, or a web link of the form
`https://<production-host>/r/:chatroomId` opens the app directly into that
chatroom (or falls back to the browser if the app is not installed).

### 9.1 Manifest intent filter

In `AndroidManifest.xml` (inside the main `MainActivity` entry):

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https"
        android:host="<production-host>"
        android:pathPrefix="/r/" />
</intent-filter>
```

### 9.2 Domain verification

Publish a Digital Asset Links file at
`https://<production-host>/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.chatty.app",
      "sha256_cert_fingerprints": ["<sha256 of upload key + Play app signing key>"]
    }
  }
]
```

Both fingerprints (local upload key **and** the Play-managed app-signing key,
visible in *Play Console → Setup → App integrity*) must be listed.

### 9.3 In-app routing

`@capacitor/app` emits `appUrlOpen` with the full URL. The handler in
`frontend/src/lib/deepLinks.ts` parses the path and calls
`router.navigate(...)`. If the chatroom is not accessible to the current
principal, render the existing 404 / not-authorized state — do not crash.

---

## 10. Permissions

Declared in `AndroidManifest.xml`:

| Permission              | Why                                                                     |
| ----------------------- | ----------------------------------------------------------------------- |
| `INTERNET`              | Required for API + socket.io traffic (auto-added by Capacitor).         |
| `POST_NOTIFICATIONS`    | Required on Android 13+; prompted at runtime via push plugin.           |
| `ACCESS_NETWORK_STATE`  | Used by Capacitor to detect offline state and pause socket reconnects.  |

Profile-image upload uses the standard `<input type="file" accept="image/*">`
in the WebView, which delegates to the Android system photo picker — **no
storage permission required**.

No camera, microphone, contacts, location, or background permission is
requested. This keeps the Play *Data Safety* and *Permissions* declarations
short and auditable.

---

## 11. Splash & Theming

- Use Android 12+'s built-in `SplashScreen` API via `@capacitor/splash-screen`.
- Background `#ffffff`, brand icon scaled to 60% of the smaller viewport
  dimension.
- Status bar: light content on white in light mode; dark content on neutral
  surface in dark mode (mirrors the existing CSS theme variables).
- Splash auto-hides after the first `App.appStateChange → active` event from
  Capacitor or after a 1.5s safety timeout, whichever comes first. No long
  branded splash — Play reviewers dislike them.

---

## 12. Build & Signing

### 12.1 Keystore

Generate **once**, locally:

```bash
mkdir -p frontend/android/keystore
keytool -genkey -v \
  -keystore frontend/android/keystore/chatty-upload.jks \
  -alias chatty-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store the password and alias in `~/.gradle/gradle.properties` (NOT in repo):

```properties
CHATTY_UPLOAD_STORE_FILE=/absolute/path/to/chatty-upload.jks
CHATTY_UPLOAD_KEY_ALIAS=chatty-upload
CHATTY_UPLOAD_STORE_PASSWORD=<password>
CHATTY_UPLOAD_KEY_PASSWORD=<password>
```

`frontend/android/app/build.gradle` reads these properties and applies the
`release` signing config. The keystore file itself is gitignored.

**Strongly enable Play App Signing** on first upload — the local keystore
becomes only the *upload* key, and Google manages the long-lived app-signing
key. Losing the upload key is recoverable; losing a non-managed app-signing
key bricks the app.

### 12.2 Output

- Local debug: `./gradlew assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`.
- Release for Play: `./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab` (AAB, not APK).
- Manually upload the AAB through Play Console → *Internal testing* track for
  the first few iterations, then promote to *Production*.

---

## 13. Local Development Workflow

Prerequisites (one-time):

1. Install Android Studio (Koala or newer); accept all SDK licenses.
2. Install SDK Platform 35 + Build Tools 35.x + Android Emulator + a system
   image for Pixel 7 / API 35 (Google Play image).
3. Create AVD: `Pixel_7_API_35`.
4. Ensure the Nest backend is running locally on port `8081` (see
   `.cursor/skills/run-local-dev/SKILL.md`).
5. Place `google-services.json` (Firebase debug app) at `frontend/android/app/`.

Per-session loop:

```bash
# 1. Run backend + frontend dev infra (or use docker-compose.dev.yml)
# 2. Build the web bundle for the emulator host alias
cd frontend
VITE_API_URL=http://10.0.2.2:8081 npm run build

# 3. Sync the bundle into the Android project
npx cap copy android

# 4. Launch the emulator and install the debug APK
npx cap open android         # opens Android Studio → Run ▶
# or, headless:
cd android && ./gradlew installDebug && adb shell monkey -p com.chatty.app 1
```

Hot reload for native development is **not** supported because we bundle the
build. For tight UI iteration, keep using `npm run dev` in a desktop browser;
only run the emulator path when validating Capacitor-specific behavior (push,
deep links, status bar, splash).

### 13.1 Emulator networking cheatsheet

| You want to reach…                | Use this from inside the emulator     |
| --------------------------------- | ------------------------------------- |
| Host machine `localhost:8081`     | `http://10.0.2.2:8081`                |
| Another container on host network | `http://10.0.2.2:<port>`              |
| A Cloudflare tunnel URL           | the `https://*.trycloudflare.com` URL |

---

## 14. Testing Strategy

Per the project guideline ("keep Android code simple"), v1 testing is
**deliberately minimal**:

- **Web-level tests** (`frontend/`): existing Vitest + React Testing Library
  suite already covers components, hooks, and API integration. This is the
  primary regression net — Capacitor does not change web logic.
- **Manual emulator smoke test** before every Play release. The runbook in
  §15.3 covers it.
- **No** Espresso / Appium / Detox / Capacitor e2e in v1. Revisit if the app
  surfaces real native logic later.

---

## 15. Play Store Release Checklist

### 15.1 Pre-launch (one-time)

- [ ] Google Play Developer account created ($25 one-time).
- [ ] App created in Play Console with package `com.chatty.app`.
- [ ] Play App Signing enrolled (upload-only key local).
- [ ] Privacy policy URL published and reachable on production domain.
- [ ] Data Safety form completed (see §16).
- [ ] App content questionnaire (ads, target audience, news, COVID, etc.) filled.
- [ ] Content rating questionnaire completed (likely **Teen** due to AI chat
      open-ended content; confirm with IARC tool).
- [ ] 2 phone screenshots + 1 feature graphic (1024×500) + 512×512 icon
      uploaded.
- [ ] Short description (≤80 chars) + full description (≤4000 chars).
- [ ] **Account deletion mechanism** — flagged in §17 as a launch blocker.

### 15.2 Per-release

- [ ] Bump `versionCode` and `versionName` in `app/build.gradle`.
- [ ] Build production web bundle (`VITE_API_URL=https://...`).
- [ ] `npx cap copy android` → `./gradlew bundleRelease`.
- [ ] Upload AAB to *Internal testing* track.
- [ ] Run §15.3 smoke test on emulator + at least one physical device.
- [ ] Promote to *Production*.

### 15.3 Manual smoke test (emulator)

1. Cold start as a fresh install → splash dismisses ≤2 s → app lands on guest
   chat list.
2. Create a chatroom, send a message, observe AI streamed reply.
3. Trigger `POST /api/notifications/test` from a separate terminal →
   notification appears in the status bar → tap it → app deep-links into the
   correct chatroom.
4. Tap the system back button on the chatroom list → app exits (not just
   "back-stack-pops to white screen").
5. Toggle airplane mode → app shows the existing offline UI; restoring network
   reconnects the socket without a relaunch.
6. Sign in to a member account from guest mode → verify chatrooms migrated
   (proves `merge-guest` works on Android).

---

## 16. Privacy & Compliance

### 16.1 Data Safety declaration (Play Console)

Collected and **sent off device** (to our own backend):

- Email address (member sign-in only; not collected from guests).
- User-generated chat messages.
- App interactions and crash logs (only if/when we add an analytics SDK; not in v1).
- Device-generated FCM token (Approximate device identifier).

Not collected: contacts, location, photos beyond what the user explicitly
attaches, microphone, financial info, health, web browsing history.

All collected data is encrypted in transit (HTTPS/WSS). Users can request
deletion **once §17 is unblocked**.

### 16.2 Privacy policy URL

Must be live at a stable URL (e.g. `https://<production-host>/privacy`)
before Play submission. Out of scope to author here; mark as a launch task.

---

## 17. Launch Blockers (must resolve before Play submission)

These items are **explicitly deferred** but are required by Play policy:

1. **Account deletion mechanism.** Play Console requires both an in-app
   delete option *and* a publicly reachable web URL where users (including
   uninstalled users) can request deletion. Backend currently has no
   `DELETE /api/users/me` route — design and ship before submission.
2. **Privacy policy + Terms of Service URLs.** See §16.2.
3. **Production domain + TLS certificate** for App Links verification
   (`assetlinks.json`) and the production `VITE_API_URL`.
4. **Firebase Android app entry** with `google-services.json` distributed to
   builders.

---

## 18. Future Work (out of scope for v1)

- iOS target via `npx cap add ios`. Capacitor config is already iOS-friendly.
- Monetization: subscription via Play Billing (`@revenuecat/purchases-capacitor`
  is the simplest path) or AdMob banners.
- Native Google Sign-In (requires SHA-1 fingerprint + OAuth client; reuses
  existing JWT issuer on the backend).
- Crash reporting & analytics (Firebase Crashlytics + GA4) — gated on the
  Data Safety form being updated first.
- Background-fetch / WorkManager-driven proactive sync; today the backend's
  slow-start scheduler + FCM is sufficient.
- Encrypted local storage for JWT (`capacitor-secure-storage-plugin`).
- GitHub Actions / Fastlane release pipeline. Justified once release cadence
  exceeds ~one upload per week.
- Tablet, foldable, and Wear OS layouts.

---

## 19. Risks

| Risk                                                                        | Mitigation                                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Play reviewers flag the app as a "low-quality WebView wrapper".             | Bundle the build (offline-capable), implement native push + deep links + splash, ship adaptive icons. |
| Lost upload keystore.                                                       | Enroll in Play App Signing (recoverable via Google support).                              |
| FCM token rotation not handled → users stop receiving notifications.        | Always re-register on the `registration` plugin event; don't gate on cached-token equality. |
| Backend HTTP-only endpoint accidentally used in release build.              | `network_security_config.xml` allows cleartext only for `10.0.2.2`.                       |
| Account-deletion policy violation → app pulled from Play.                   | §17 lists it as a hard blocker; do not submit until shipped.                              |
| Capacitor major-version upgrade breaks the build between releases.          | Pin Capacitor versions in `package.json`; upgrade in a dedicated PR with smoke test.      |

---

## 20. Glossary

- **AAB** — Android App Bundle, Play's required upload format since Aug 2021.
- **App Links** — Verified HTTPS deep links (`autoVerify="true"` + `assetlinks.json`).
- **Capacitor** — Ionic's runtime that bridges a WebView to native APIs.
- **FCM** — Firebase Cloud Messaging.
- **Play App Signing** — Google manages the app-signing key; developers keep
  only an upload key.
- **`10.0.2.2`** — Special IP inside the Android emulator that maps to the
  host machine's loopback interface.
