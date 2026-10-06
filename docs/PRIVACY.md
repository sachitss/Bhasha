# Privacy

- **No account, no tracking, no analytics.** Bhasha makes no requests to third-party servers at runtime. Fonts and audio are bundled.
- **Learning data** (profile, progress, saved words, activity) is stored only on your device (browser storage or the app's local storage). You can export it as JSON or reset it under Profile.
- **Voice recordings** are processed on your device to show the waveform and practice estimate. They are kept only in memory, never uploaded or stored, and are gone when the page or app is closed.
- **Microphone permission** is requested only when you tap Record. You can deny it and add a recording file instead.
- **Native audio** is generated ahead of time by the project maintainer with Azure Neural TTS: only the learning content (words and sentences in `web/js/content.js`) is sent to Azure, when the "Generate native audio" workflow runs. No learner data is ever sent.
