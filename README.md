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

## Built-in voices

Every package (web, Android, iOS, desktop) contains audio for every word, phrase and example sentence in German, English and Nepali, female and male, so pronunciation works offline and on devices without any installed voices. The **Generate native audio** workflow creates it:

| | Female | Male | Engine |
|---|---|---|---|
| German | Kerstin | Thorsten | Piper (default) |
| English (UK) | Cori | Alan | Piper (default) |
| Nepali | Nepali female (Google dataset) | Chitwan | Piper (default) |
| all three | Katja / Sonia / Hemkala | Conrad / Ryan / Sagar | Azure Neural TTS (optional, higher quality) |

Piper needs no account. To switch to Azure: add repository secrets `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` (e.g. `westeurope`), then run **Actions → Generate native audio** with "Regenerate all files" ticked. Voice credits and licences: [web/audio/CREDITS.md](web/audio/CREDITS.md).

When a file is missing, the app falls back to the device's speech engine (Android/iOS through the native speech service, browsers through the Web Speech API).

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
