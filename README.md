# Bhasha · भाषा

Learn **German, English, Nepali, Korean and Spanish** in any direction, with native-speaker audio (female and male), spaced repetition, pronunciation practice, travel phrases and a progress dashboard. The interface is available in English, German, Nepali, Korean and Spanish, independent of the language you learn.

One web codebase ships everywhere:

| Platform | How | Output |
|---|---|---|
| Web / PWA | GitHub Pages | Installable, works offline |
| Android | Capacitor | APK (sideload) and AAB (Play Store) |
| iOS | Capacitor | Unsigned IPA + simulator build (sign with your Apple account) |
| Windows, macOS, Linux | Tauri | MSI/EXE, DMG, DEB/RPM/AppImage |

## Features

- **First-run questions**: which language you speak, which you learn, your level, which skill to focus on and how much time you have.
- **Daily plan** sized to 10–60 minutes and your focus across the **four skills** – listening, reading, speaking, writing – with vocabulary as the core. It adapts: fewer new words when accuracy drops or reviews pile up. Progress shows accuracy per skill.
- **Spaced repetition** with five visible states (New, Learning, Familiar, Mastered, Needs review). Every card says why it is shown.
- **Exercises** (active recall first): study cards, multiple choice, recall, typing, dictation, listen-and-identify, matching pairs, fill-in-the-blank, word order, sentence translation, writing your own sentence, graded reading texts with tap-to-translate and questions, pronunciation.
- **Numbers 0 – 1,000,000**: explore and hear every number up to 1,000, type any number up to a million, "Steps to a million" (thousands → ten thousands → hundred thousands) and practice rounds. Nepali with lakh grouping and Devanagari digits, Korean with 만.
- **Interactive conversations**: six everyday situations (café, meeting someone, hotel, directions, market, doctor) – the native speaker talks, you answer by choosing or by speaking.
- **Grammar**: 16 short topics with a rule in your language, a table with native audio and generated practice (verb forms, der/die/das, el/la, ser/estar, Korean particles, Nepali verb endings).
- **Vocabulary games**: speed round, memory pairs, spelling and number rush, with best scores.
- **Learn in context and read widely**: every word comes with an example sentence; six reading texts from beginner to advanced.
- **Active notebook**: meaning, your own sentence, synonyms and notes for any word; add your own words (they join the review cycle); dictionary lookup (Oxford Learner's Dictionaries for English, Duden, RAE, Naver); CSV export.
- **Passive exposure**: Android home-screen/lock-screen widget with a changing word, quiet lock-screen word notifications (Android/iOS, 3–10 a day in your chosen hours) and Glance mode, a full-screen slideshow on any device.
- **Native audio** for every word, phrase and example sentence in German (de-DE), English (en-GB), Nepali (ne-NP), Korean (ko-KR) and Spanish (es-ES), with a **Female / Male** voice setting. Slow playback keeps the pitch natural.
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

Every package (web, Android, iOS, desktop) contains audio for every word, phrase, example sentence and reading text in all five languages, female and male, so pronunciation works offline and on devices without any installed voices. The **Generate native audio** workflow creates it:

| | Female | Male |
|---|---|---|
| German | Katja | Conrad |
| English (UK) | Sonia | Ryan |
| Nepali | Hemkala | Sagar |
| Korean | SunHi | InJoon |
| Spanish (Spain) | Elvira | Alvaro |

Generated with **Azure Neural TTS** (repository secrets `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`). Without those secrets the workflow falls back to **Piper** (open source): Kerstin/Thorsten, Cori/Alan, Nepali female/Chitwan.

After changing content, the audio for changed texts regenerates automatically. Voice credits and licences: [web/audio/CREDITS.md](web/audio/CREDITS.md).

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

- [Mondly analysis](docs/MONDLY-ANALYSIS.md) – what Bhasha 1.3 adopted and why

- [Architecture and technology decision](docs/ARCHITECTURE.md)
- [Release guide](docs/RELEASE.md)
- [Privacy](docs/PRIVACY.md)
- [Test report](docs/TEST-REPORT.md)

---

Powered by **Team Nepal Solutions** · © Ing.-Büro Sachit Shrestha · support@medtec24.com
