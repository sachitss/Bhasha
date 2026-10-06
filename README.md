# Bhasha · भाषा

Learn **German, English and Nepali** in any direction, with native-speaker audio (female and male), spaced repetition, pronunciation practice, travel phrases and a progress dashboard. The interface is available in English, German and Nepali, independent of the language you learn.

One web codebase ships everywhere:

| Platform | How | Output |
|---|---|---|
| Web / PWA | GitHub Pages | Installable, works offline |
| Android | Capacitor | APK (sideload) and AAB (Play Store) |
| iOS | Capacitor | Unsigned IPA + simulator build (sign with your Apple account) |
| Windows, macOS, Linux | Tauri | MSI/EXE, DMG, DEB/RPM/AppImage |

## Features

- **Daily plan** sized to 10–60 minutes and your focus (vocabulary, listening, pronunciation, words in context). It adapts: fewer new words when accuracy drops or reviews pile up.
- **Spaced repetition** with five visible states (New, Learning, Familiar, Mastered, Needs review). Every card says why it is shown.
- **Task types**: study cards, multiple choice, recall, typing, listen-and-identify, fill-in-the-blank, pronunciation.
- **Native audio** for every word, phrase and example sentence in German (de-DE), English (en-GB) and Nepali (ne-NP), with a **Female / Male** voice setting. Slow playback keeps the pitch natural.
- **Pronunciation practice**: listen, record, play back, compare with the reference length; tempo, volume and pause feedback, labelled as a practice estimate. Recordings never leave the device.
- **Travel pack** with situations (airport, hotel, restaurant, emergency…) and a "Learn before my trip" course.
- Word/Phrase of the day, saved items, search, progress dashboard, pause and resume, data export.
- Devanagari with optional romanisation, German noun gender badges, light and dark themes, keyboard and screen-reader support.

## Run locally

```bash
npm install
npm start            # http://localhost:5173
npm test             # unit tests
npm run test:e2e     # browser tests (phone + desktop)
```

## Native voices (one-time setup)

Audio is generated with Azure Neural TTS and committed to `web/audio/`, so the app plays the same native voices on every device and offline:

| | Female | Male |
|---|---|---|
| German | de-DE-Katja | de-DE-Conrad |
| English | en-GB-Sonia | en-GB-Ryan |
| Nepali | ne-NP-Hemkala | ne-NP-Sagar |

1. Create a free Azure **Speech** resource (the free tier covers this content many times over).
2. In this repository: **Settings → Secrets and variables → Actions** add `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` (e.g. `westeurope`).
3. **Actions → Generate native audio → Run workflow.** It commits the audio and redeploys the web app.

After that, audio regenerates automatically for any changed words when `web/js/content.js` changes. Until audio exists, the app falls back to the best native voice on the device (in Microsoft Edge: Katja/Conrad, Sonia/Ryan, Hemkala/Sagar).

## Release

Push a version tag and every platform is built and attached to a GitHub release:

```bash
npm version 1.0.1 && git push --follow-tags
```

See [docs/RELEASE.md](docs/RELEASE.md) for signing (Google Play, Apple App Store, macOS/Windows code signing) and store submission.

## Project layout

```
web/                 the app (HTML, CSS, JS modules, fonts, icons, audio, service worker)
  js/content.js      all learning content – edit here
  js/core.js         spaced repetition, session builder, pronunciation scoring (unit-tested)
  js/i18n.js         interface text in en / de / ne
android/ ios/        Capacitor native projects
src-tauri/           desktop app
scripts/             audio generation, font copy, version stamping
tests/               unit and browser tests
docs/                architecture, release, privacy, test report
```

## Documentation

- [Architecture and technology decision](docs/ARCHITECTURE.md)
- [Release guide](docs/RELEASE.md)
- [Privacy](docs/PRIVACY.md)
- [Test report](docs/TEST-REPORT.md)
