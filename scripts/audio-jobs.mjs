// The texts that get audio: every word/phrase (spoken slightly slower for learners) and every example sentence.
// Run directly to print them as JSON for scripts/generate-audio-piper.py.
import { ITEMS } from "../web/js/content.js";

export function jobsFor(lang) {
  const jobs = [];
  for (const it of ITEMS) {
    if (it[lang]) jobs.push({ key: it.id, text: it[lang], rate: "-10%" });
    if (it.ex && it.ex[lang]) jobs.push({ key: it.id + ".ex", text: it.ex[lang], rate: "-5%" });
  }
  return jobs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(JSON.stringify({ de: jobsFor("de"), en: jobsFor("en"), ne: jobsFor("ne"), ko: jobsFor("ko") }));
}
