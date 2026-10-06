# Architecture and technology decision

## Decision

One dependency-free web app (HTML, CSS, ES modules) is the single codebase. It is published as a **PWA**, wrapped by **Capacitor** for Android and iOS, and by **Tauri** for Windows, macOS and Linux. There is no server in version 1: content and audio are static files, and learner data stays on the device.

## Why

| Need | Choice | Reason |
|---|---|---|
| One codebase for web, mobile, desktop | Web app + thin native shells | Capacitor and Tauri load the same `web/` folder; no per-platform UI. |
| Audio recording and playback | Web Audio, MediaRecorder | Supported in all target browsers and both shells (with mic permissions declared). |
| Offline | Service worker (web), bundled files (native) | Lessons, fonts and audio work without a connection. |
| Native voices on every device | Pre-generated Azure Neural TTS files | Device voices vary and Nepali is usually missing; files give identical, native audio everywhere and offline. |
| Small, fast, low cost | No framework, no backend | ~1 MB app shell; Tauri desktop installers ~3 MB; hosting is free on GitHub Pages. |
| Accessibility | Semantic HTML, ARIA, visible focus, text + symbol for status | Not colour-only; scalable text; keyboard operable. |

### Alternatives considered

- **Flutter**: strong for mobile, but web output is heavier and less accessible; a second language (Dart) for the team.
- **React Native**: good native feel, but web and desktop need extra layers; more dependencies to maintain.
- **Next.js + backend**: needed later for accounts and sync, not for version 1.
- **Electron** instead of Tauri: 80–150 MB installers versus ~3 MB.

## Modules

- `content.js` – words, travel phrases, phrases of the day (German, English, Nepali, romanisation, examples, notes).
- `core.js` – pure logic: SM-2 style scheduling, adaptive daily plan, session builder, pronunciation scoring, voice ranking. Unit-tested.
- `i18n.js` – interface strings in three languages.
- `app.js` – rendering, state, audio playback, recording.

## Data model (version 1, on device)

```
profile   { name, ui, known, target, level, minutes, prio{vocab,listen,speak,context}, rom, gender }
prog      { [targetLang]: { [itemId]: { reps, ease, ivl, due, lapses, seen, last, ok, bad, lapseAt, pron[] } } }
favs      [itemId]
act       { [YYYY-MM-DD]: { min, xp, ok, n } }
session   { tasks[{id,type,why}], i, ok, xp, mode }   // pause and resume
```

Progress is kept per target language, so switching languages never loses progress.

## Path to version 2 (server)

When accounts, sync, teacher accounts or a content-management system are needed, add a small API (Node or Python) with PostgreSQL. Suggested tables: `users`, `languages`, `items`, `translations`, `examples`, `audio_assets`, `review_states (user_id, item_id, lang) unique`, `review_log`, `sessions`, `recordings` (private storage, signed URLs), `achievements`, `reminders`. Sync uses per-record `updated_at` with last-writer-wins for settings and merge-by-max-review for scheduling, so offline edits never duplicate.
