# Test report – v1.3.0

Date: 2026-10-10. Status legend: ✅ pass · ⚠️ needs action or known limitation. Release v1.0.0 built all platforms on the first run.

## Automated

| Test | Result | Issue | Severity | Fix | Retest |
|---|---|---|---|---|---|
| Unit: scheduling (new → familiar → review, again resets, intervals grow to mastered) | ✅ | – | – | – | – |
| Unit: adaptive plan (accuracy < 70 % halves new words; backlog > 15 caps at 2) | ✅ | – | – | – | – |
| Unit: session builder (WOTD first, study before check, trip mode travel-only) | ✅ | Session could exceed planned length by 2 | Low | Cap late checks at n − pronunciation tasks | ✅ |
| Unit: due order (recently missed first) | ✅ | – | – | – | – |
| Unit: pronunciation estimate and envelope/pause detection on synthetic audio | ✅ | – | – | – | – |
| Unit: voice ranking (Katja/Conrad, Hemkala/Sagar by gender; wrong language rejected) | ✅ | – | – | – | – |
| Unit: content complete in de/en/ne, Devanagari, unique ids; all UI strings translated | ✅ | – | – | – | – |
| Browser (phone 412 px + desktop 1366 px): home, full session, pause/resume after reload | ✅ | Test selector clicked disabled options | Test bug | Selector fixed | ✅ |
| Browser: UI language switch (ne, de) independent of target language | ✅ | – | – | – | – |
| Browser: native audio file chosen by gender (`audio/de-m/g1.mp3`) | ✅ | – | – | – | – |
| Browser: every tab without horizontal overflow; trip course starts | ✅ | – | – | – | – |
| Unit: built-in audio covers all 145 texts × 6 voices (870 files) | ✅ | – | – | – | – |
| Audio check: no silent files; word length 0.8–1.0 s median in every voice | ✅ | – | – | – | – |
| Azure audio: 870 clips, Katja/Conrad, Sonia/Ryan, Hemkala/Sagar | ✅ | Clips padded with ~1.4 s silence | Medium (wrong reference length, delayed playback) | Trim + loudness normalisation; CI now requires ffmpeg | ✅ word median 0.8–1.0 s |
| Browser: powered-by footer on all 6 pages, logo aspect ratio within 2 % of the original, right-aligned, light/dark | ✅ | – | – | – | – |
| Unit: Korean content for all 86 items (Hangul, romanisation, examples); Korean UI has every string | ✅ | – | – | – | – |
| Audio: Korean SunHi/InJoon, 290 clips, trimmed (word median 0.8–0.9 s), no silent files | ✅ | – | – | – | – |
| Browser: Korean interface + Korean learning session end to end | ✅ | – | – | – | – |
| Browser: real audio plays for all six voices; voice label follows Female/Male | ✅ | – | – | – | – |
| Android device (Samsung S23 Ultra, v1.0.0): no speech, "no voice installed" | ✅ fixed | Android web view has no speech synthesis | High | Audio bundled in package + native speech engine backup | Pending device |
| Android device (v1.0.0): header under the status bar | ✅ fixed | Edge-to-edge layout on Android 15 | Medium | Capacitor margin adjustment, themed system bars | Pending device |
| Browser: microphone denied → file upload → analysis and score shown | ✅ | – | – | – | – |
| Unit: Spanish and expanded content complete in 5 languages (227 items, 172 words, 40 travel, 15 phrases), unique ids | ✅ | – | – | – | – |
| Unit: 6 reading texts aligned sentence by sentence in 5 languages; questions answerable | ✅ | – | – | – | – |
| Unit: every UI string in en/de/ne/ko/es (283 keys) | ✅ | – | – | – | – |
| Unit: skill focus – old "context" moves to reading, presets sum to 100, task types follow focus and available data | ✅ | – | – | – | – |
| Unit: matching and reading tasks added only when due words / reading focus exist; word order never starts solved | ✅ | – | – | – | – |
| Unit: answer check accepts missing articles/accents and romanisation (Nepali, Korean) | ✅ | – | – | – | – |
| Unit: passive deck (due first, mastered left out) and lock-screen times inside the chosen hours | ✅ | – | – | – | – |
| Browser: onboarding (languages, level, focus, time) sets profile; not shown again | ✅ | – | – | – | – |
| Browser: Spanish interface + Spanish learning session end to end | ✅ | – | – | – | – |
| Browser: review session with match, order, write, translate, fill and reading; per-skill progress card | ✅ | Duplicate isNative declaration broke the app | High | Removed old declaration | ✅ |
| Browser: reading text, tap-to-translate, questions; notebook notes, own word, CSV export; Glance mode | ✅ | Dictionary link rendered as underlined link | Low | Link styled as button | ✅ |
| Unit: number words 0–1,000,000 in 5 languages (known spellings, unique words, unique audio parts, romanisation) | ✅ | – | – | – | – |
| Unit: steps to a million, digit grouping (1.000.000 / 1,000,000 / 10,00,000), practice ranges have audio | ✅ | – | – | – | – |
| Unit: 6 conversations complete in 5 languages, alternating turns, 3 distinct reply options | ✅ | – | – | – | – |
| Unit: 16 grammar topics – rules in 5 languages, quizzes with answer among options, Korean batchim rule | ✅ | – | – | – | – |
| Unit: audio jobs for number parts, conversation lines, grammar phrases; unique keys | ✅ | – | – | – | – |
| Browser: numbers – explore, type 347, 28 steps to a million, 10/10 practice | ✅ | Long German number words overflowed options on phones | Medium | Words wrap inside options | ✅ |
| Browser: games – speed round + new best, memory solved in 6 moves, spelling, number rush | ✅ | – | – | – | – |
| Browser: conversation – wrong reply marked, all turns answered, 3/4 score, translations toggle | ✅ | – | – | – | – |
| Browser: grammar – German, Spanish, Korean rule, table and full practice round | ✅ | Korean options showed romanisation only for the right answer | Medium (gave answer away) | Romanisation only when every option has it | ✅ |
| Android: widget provider, widget plugin, notifications plugin compile in CI (assembleRelease) | ✅ | – | – | – | – |
| Android/iOS lock-screen notifications and widget on a real device | ⚠️ | Not testable here | – | Check on the S23 Ultra after install | Pending device |

| Desktop: Linux release build (.deb) and launch on virtual display | ✅ | – | – | – | – |
| Desktop: Windows (MSI, EXE) and macOS universal (DMG) builds in CI | ✅ | – | – | – | – |
| Android APK and AAB build in CI (Java 21, SDK 35) | ✅ | – | – | – | – |
| iOS device (unsigned IPA) and simulator builds in CI (Xcode, macOS 15) | ✅ | – | – | – | – |
| GitHub CI: unit + browser tests on push | ✅ | – | – | – | – |
| GitHub Pages deploy | ⚠️ | Pages not yet enabled in repo settings | Medium | Owner enables Settings → Pages → Source: GitHub Actions | Pending |

## Manual checks still needed on real devices

| Area | What to check |
|---|---|
| Microphone | Permission prompt, record, playback on Android, iPhone, Windows, macOS; Bluetooth and wired headphones; deny and re-allow |
| Audio | Native files play at normal and slow speed; offline after first use |
| Install | PWA install on Android Chrome, iOS Safari (Add to Home Screen), Edge/Chrome desktop |
| Accessibility | Screen reader (TalkBack, VoiceOver, NVDA) through one session |

## Known limitations (v1)

- Built-in voices: Azure neural (Katja/Conrad, Sonia/Ryan, Hemkala/Sagar); Piper is the automatic fallback if the Azure key is removed.
- ⚠️ Pronunciation feedback is an educational estimate (tempo, volume, pauses), not phoneme-level assessment.
- ⚠️ No accounts or cross-device sync; reminders are not included in v1 (need native notifications or a server).
- ⚠️ Builds are unsigned until store accounts and signing secrets are set up (see RELEASE.md).
