// The texts that get audio: every word/phrase (spoken slightly slower for learners), every example sentence,
// every reading text, the number parts (0–99, hundreds, thousands … a million), every conversation line and the
// phrases of the grammar tables. Run directly to print them as JSON for scripts/generate-audio-piper.py.
import { ITEMS, READ } from "../web/js/content.js";
import { numberAudioParts } from "../web/js/numbers.js";
import { DIALOGS, grammarAudioJobs } from "../web/js/practice.js";

export const AUDIO_LANGS = ["de", "en", "ne", "ko", "es"];

export function jobsFor(lang) {
  const jobs = [];
  for (const it of ITEMS) {
    if (it[lang]) jobs.push({ key: it.id, text: it[lang], rate: "-10%" });
    if (it.ex && it.ex[lang]) jobs.push({ key: it.id + ".ex", text: it.ex[lang], rate: "-5%" });
  }
  for (const r of READ) if (r.text[lang]) jobs.push({ key: r.id, text: r.text[lang].join(" "), rate: "-8%" });
  for (const p of numberAudioParts(lang)) jobs.push({ key: p.key.replace("num/", "nm."), text: p.text, rate: "-5%" });
  for (const d of DIALOGS) for (const l of d.lines) jobs.push({ key: l.id, text: l[lang], rate: "-5%" });
  for (const g of grammarAudioJobs(lang)) jobs.push({ ...g, rate: "-8%" });
  return jobs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(JSON.stringify(Object.fromEntries(AUDIO_LANGS.map((l) => [l, jobsFor(l)]))));
}
