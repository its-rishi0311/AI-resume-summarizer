# ElevateCV — Android APK Build Guide

This repository contains the ElevateCV web app packaged for Android with **Capacitor**. The original project is a Progressive Web App with offline caching, mobile navigation, install support, and client-side resume/bio processing.

## What this setup builds

- Android application ID: `com.elevatecv.app`
- App name: `ElevateCV`
- Web source: repository root (`index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`)
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk` after signing configuration

## 1. Requirements

Install:

- Node.js 20+
- npm
- Android Studio
- Android SDK
- JDK 17

For a local Android build, make sure Android Studio has an Android SDK installed and that Gradle can access it.

## 2. Build the APK locally

From the repository root:

```bash
npm install
npx cap add android
npx cap sync android
cd android
```

On macOS/Linux:

```bash
./gradlew assembleDebug
```

On Windows PowerShell:

```powershell
.\gradlew.bat assembleDebug
```

The debug APK will be created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

You can copy that APK to an Android phone and install it for testing.

## 3. Open the project in Android Studio

After creating/syncing the Android platform:

```bash
npx cap open android
```

Then use Android Studio to run the app on an emulator or connected Android device.

## 4. Rebuild after web changes

Whenever you change `index.html`, `style.css`, `app.js`, `manifest.json`, or other web assets:

```bash
npx cap sync android
```

Then rebuild:

```bash
cd android
./gradlew assembleDebug
```

On Windows:

```powershell
cd android
.\gradlew.bat assembleDebug
```

## 5. Build automatically with GitHub Actions

The repository includes:

```text
.github/workflows/build-apk.yml
```

The workflow:

1. Checks out the repository.
2. Installs Node.js.
3. Installs Capacitor dependencies.
4. Creates the Android platform.
5. Syncs the web application.
6. Builds `assembleDebug`.
7. Uploads `app-debug.apk` as a GitHub Actions artifact.

### Run it

Push the project to GitHub and open:

**GitHub → Actions → Build ElevateCV APK → Run workflow**

You can also trigger it by pushing to the `main` branch.

After the workflow completes, open the workflow run and download the **elevatecv-debug-apk** artifact.

## 6. Create a release APK

A release APK should be signed before distributing it outside development/testing.

First build the release variant:

```bash
cd android
./gradlew assembleRelease
```

The unsigned/unconfigured release output depends on the Android Gradle configuration. Configure a proper Android signing key in Android Studio or Gradle before publishing.

**Never commit `.jks`, `.keystore`, passwords, or API keys to GitHub.** The included `.gitignore` excludes common signing-key files.

For Google Play distribution, prefer an **Android App Bundle (`.aab`)** rather than an APK.

```bash
cd android
./gradlew bundleRelease
```

## 7. GitHub Pages / web deployment

The Android build uses the web files directly from this repository, so the same project can also be deployed as a PWA. The manifest points to `index.html`, and the service worker caches the application shell for offline use.

## 8. Important: API keys

ElevateCV supports optional live AI integrations. API credentials are handled by the application locally. Do not put a real Gemini/OpenAI key into source files, GitHub Actions YAML, screenshots, or committed configuration.

For a production mobile app, consider moving provider API calls behind a secure backend rather than shipping a long-lived provider secret inside the APK.

## 9. Project structure

```text
ElevateCV/
├── .github/
│   └── workflows/
│       └── build-apk.yml
├── index.html
├── style.css
├── app.js
├── manifest.json
├── sw.js
├── icon.svg
├── icon.png
├── icon-512x512.png
├── package.json
├── capacitor.config.json
├── README.md
├── README_APK.md
└── .gitignore
```

## 10. One-command debug build

After dependencies and the Android platform have been initialized:

```bash
npm run build:apk
```

On Windows, the underlying Gradle command uses `gradlew.bat` when run manually.

## Troubleshooting

### `npx cap add android` says Android already exists

That is normal if the `android/` directory is already present. Run:

```bash
npx cap sync android
```

### Gradle cannot find Java

Install JDK 17 and configure `JAVA_HOME`, then retry the build.

### Web changes are not visible in Android

Run:

```bash
npx cap sync android
```

before rebuilding the APK.

### GitHub Actions fails during Android build

Check the workflow log for the exact Gradle error. Java/Android SDK compatibility is usually the first thing to verify.

---

**ElevateCV** — polish your experience, strengthen your story, elevate your CV.
