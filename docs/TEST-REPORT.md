# Test report – v1.0.2

Date: 2026-10-06. Status legend: ✅ pass · ⚠️ needs action or known limitation. Release v1.0.0 built all platforms on the first run.

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
| Browser: real audio plays for all six voices; voice label follows Female/Male | ✅ | – | – | – | – |
| Android device (Samsung S23 Ultra, v1.0.0): no speech, "no voice installed" | ✅ fixed | Android web view has no speech synthesis | High | Audio bundled in package + native speech engine backup | Pending device |
| Android device (v1.0.0): header under the status bar | ✅ fixed | Edge-to-edge layout on Android 15 | Medium | Capacitor margin adjustment, themed system bars | Pending device |
| Browser: microphone denied → file upload → analysis and score shown | ✅ | – | – | – | – |
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
