// The texts that get audio: every word/phrase (spoken slightly slower for learners), every example sentence
// and every reading text (read as a whole). Run directly to print them as JSON for scripts/generate-audio-piper.py.
import { ITEMS, READ } from "../web/js/content.js";

export const AUDIO_LANGS = ["de", "en", "ne", "ko", "es"];

export function jobsFor(lang) {
  const jobs = [];
  for (const it of ITEMS) {
    if (it[lang]) jobs.push({ key: it.id, text: it[lang], rate: "-10%" });
    if (it.ex && it.ex[lang]) jobs.push({ key: it.id + ".ex", text: it.ex[lang], rate: "-5%" });
  }
  for (const r of READ) if (r.text[lang]) jobs.push({ key: r.id, text: r.text[lang].join(" "), rate: "-8%" });
  return jobs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(JSON.stringify(Object.fromEntries(AUDIO_LANGS.map((l) => [l, jobsFor(l)]))));
}
