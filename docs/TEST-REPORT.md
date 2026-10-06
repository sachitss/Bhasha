# Test report – v1.0.0

Date: 2026-10-06. Status legend: ✅ pass · ⏳ runs in CI on GitHub · ⚠️ known limitation.

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
| Browser: microphone denied → file upload → analysis and score shown | ✅ | – | – | – | – |
| Desktop: Linux release build (.deb) and launch on virtual display | ✅ | – | – | – | – |
| Desktop: Windows and macOS builds | ⏳ | | | | |
| Android APK/AAB build | ⏳ | | | | |
| iOS device and simulator builds | ⏳ | | | | |

## Manual checks still needed on real devices

| Area | What to check |
|---|---|
| Microphone | Permission prompt, record, playback on Android, iPhone, Windows, macOS; Bluetooth and wired headphones; deny and re-allow |
| Audio | Native files play at normal and slow speed; offline after first use |
| Install | PWA install on Android Chrome, iOS Safari (Add to Home Screen), Edge/Chrome desktop |
| Accessibility | Screen reader (TalkBack, VoiceOver, NVDA) through one session |

## Known limitations (v1)

- ⚠️ Native audio appears after the Azure secrets are added and the audio workflow has run; until then device voices are used.
- ⚠️ Pronunciation feedback is an educational estimate (tempo, volume, pauses), not phoneme-level assessment.
- ⚠️ No accounts or cross-device sync; reminders are not included in v1 (need native notifications or a server).
- ⚠️ Builds are unsigned until store accounts and signing secrets are set up (see RELEASE.md).
