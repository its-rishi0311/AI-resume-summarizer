# 📱 ElevateCV - Mobile App Installation & Packaging Guide

ElevateCV is fully configured as a **Progressive Web App (PWA)** and can be installed directly on any smartphone (Android or iPhone) as a standalone app with an icon on your home screen, offline caching, and full-screen native behavior.

You can also package it as a standalone **Android `.apk`** file for distribution or publishing to the Google Play Store.

---

## ⚡ Option 1: Instant Install on Your Phone (Zero Setup, 30 Seconds)

Because ElevateCV includes a Web App Manifest (`manifest.json`) and an offline Service Worker (`sw.js`), your phone recognizes it as a native application.

### A. How to Test on Your Phone Right Now (Over Local Wi-Fi)
1. Ensure your phone and computer are on the same Wi-Fi network.
2. Find your computer's local IP address:
   - On Windows, open PowerShell and run: `ipconfig`
   - Look for **IPv4 Address** (e.g. `192.168.1.15`).
3. On your phone's browser, open:
   ```
   http://YOUR_COMPUTER_IP:8085
   ```
   *(e.g. `http://192.168.1.15:8085`)*

---

### B. Installing on Android (Google Chrome / Brave / Edge)
1. Open the app link in **Chrome**.
2. An **"Install ElevateCV App"** banner will automatically slide up at the bottom.
3. Tap **Install**, or tap the **three dots menu (⋮)** in the top right and select **"Install app"** or **"Add to Home screen"**.
4. Tap **Install**.
5. ElevateCV will now appear in your Android app drawer and home screen. When you tap it, it launches in **full-screen native mode** (without any browser search bars).

---

### C. Installing on iPhone & iPad (Safari)
1. Open the app link in **Safari**.
2. Tap the **Share icon** (the square with an arrow pointing up at the bottom of the screen).
3. Scroll down in the share sheet and tap **Add to Home Screen**.
4. Confirm the name **ElevateCV** and tap **Add** in the top right.
5. The ElevateCV icon will now appear on your iOS home screen! Tapping it opens the app in full-screen standalone mode with native safe-area notch adaptation.

---

## 📦 Option 2: Build a Standalone Android `.apk` File

If you want a physical `.apk` installer file to send to friends or publish to the Google Play Store, choose one of the two methods below:

### Method A: 1-Click APK Generator (PWABuilder - Recommended)
1. Host your `project/` folder on a free static host (such as GitHub Pages, Vercel, Netlify, or Cloudflare Pages) in 1 click.
2. Go to [PWABuilder.com](https://www.pwabuilder.com).
3. Enter your URL and click **Start**.
4. PWABuilder checks your manifest and service worker (both will pass with 100% score).
5. Click **Package for Android** -> Download your signed **`.apk`** or **`.aab`** file ready to install on any Android phone!

---

### Method B: Build `.apk` using Capacitor & Android Studio (Developer Way)

If you have Node.js and Android Studio installed, you can generate an Android Studio project in 3 minutes:

1. In the `project/` directory, open PowerShell or Terminal and run:
   ```bash
   # 1. Initialize npm project
   npm init -y

   # 2. Install Capacitor core dependencies
   npm install @capacitor/core @capacitor/cli @capacitor/android

   # 3. Initialize Capacitor app
   npx cap init "ElevateCV" "com.elevatecv.app" --web-dir .

   # 4. Add Android native platform
   npx cap add android

   # 5. Sync web assets
   npx cap sync

   # 6. Open in Android Studio
   npx cap open android
   ```

2. When Android Studio opens:
   - Click **Build** in the top menu bar.
   - Select **Build Bundle(s) / APK(s) > Build APK(s)**.
   - Android Studio compiles the project into an installable `.apk` file (located in `android/app/build/outputs/apk/debug/app-debug.apk`).
   - Transfer this `.apk` to your phone and install it directly!

---

## 📱 Mobile Features Included in ElevateCV

- **Bottom Navigation Bar**: One-thumb switching between Bullets, Bio, ATS, and History on mobile screens.
- **Haptic Feedback**: Gentle tactile vibration pulses when tapping buttons (`navigator.vibrate`).
- **Offline Mode**: Works 100% offline with no internet connection via client-side NLP and caching.
- **Safe Area Support**: Automatically adapts to iPhone dynamic islands, notches, and Android navigation bars.
- **Install Banner**: Native installation prompts for Android and interactive guide for iOS.
