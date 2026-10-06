# Release guide

## Make a release

```bash
npm version 1.0.1          # updates package.json and creates tag v1.0.1
git push --follow-tags
```

The **Release** workflow tests everything, then builds and attaches:

| File | Platform | Notes |
|---|---|---|
| `Bhasha-vX-web.zip` | Any web host | The PWA, ready to upload anywhere |
| `Bhasha-vX-android.apk` | Android 6+ | Installs directly (allow "install unknown apps") |
| `Bhasha-vX-play-store*.aab` | Google Play | Signed when the Android secrets below exist |
| `Bhasha-vX-ios-unsigned.ipa` | iPhone/iPad | Needs signing with your Apple account before installing |
| `Bhasha-vX-ios-simulator.zip` | Xcode Simulator | Drag App.app onto a running simulator |
| `.msi` / `-setup.exe` | Windows 10/11 | Unsigned: SmartScreen shows "More info → Run anyway" |
| `.dmg` | macOS 11+ (Intel and Apple silicon) | Unsigned: right-click → Open the first time |
| `.deb` / `.rpm` / `.AppImage` | Linux | |

The web app also deploys to GitHub Pages on every push to `main`.

## Signing and stores (when you are ready)

### Google Play
1. Create an upload key once: `keytool -genkey -v -keystore bhasha.jks -alias bhasha -keyalg RSA -keysize 2048 -validity 10000`
2. Add repository secrets: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 bhasha.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
3. The next release produces a signed `.aab`. Upload it in the Play Console (one-time fee, data-safety form: microphone used on device only, no data collected).

### Apple App Store / TestFlight
Requires an Apple Developer account and a Mac (or a macOS CI runner with signing secrets).
1. Open `ios/App/App.xcworkspace` in Xcode (after `npm ci && npx cap sync ios`).
2. Select your team under Signing & Capabilities; set the bundle id (`com.sachitss.bhasha` or your own).
3. Product → Archive → Distribute App → App Store Connect.

### Desktop code signing (optional)
- Windows: an Authenticode certificate removes the SmartScreen warning. Configure `bundle.windows.certificateThumbprint` in `src-tauri/tauri.conf.json`.
- macOS: Developer ID signing and notarisation via Tauri's `APPLE_*` environment variables in the release workflow.

## Bundle identifier

`com.sachitss.bhasha` is used for Android, iOS and desktop. Change it in `capacitor.config.json`, `android/app/build.gradle` (namespace and applicationId), the iOS project, and `src-tauri/tauri.conf.json` **before** the first store upload; it cannot change afterwards.
