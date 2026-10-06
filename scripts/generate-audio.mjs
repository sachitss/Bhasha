#!/usr/bin/env node
// Generates native-speaker audio for every word, phrase and example sentence with Azure Neural TTS.
// Output: web/audio/<lang>-<f|m>/<id>.mp3 and <id>.ex.mp3, plus web/audio/index.json for the app.
//
//   AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=westeurope node scripts/generate-audio.mjs
//   node scripts/generate-audio.mjs --dry-run      (counts files and characters, no network)
//   node scripts/generate-audio.mjs --force        (regenerate everything)
//
// Only changed texts are regenerated (hashes in web/audio/hashes.json). Text is sent to Azure only
// when this script runs; the app itself never sends anything to Azure.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { ITEMS } from "../web/js/content.js";

const OUT = "web/audio";
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run"), FORCE = args.has("--force");
const KEY = process.env.AZURE_SPEECH_KEY, REGION = process.env.AZURE_SPEECH_REGION || "westeurope";

// Native neural voices per language and gender. Override with e.g. VOICE_DE_F=de-DE-SeraphinaMultilingualNeural.
const LOCALE = { de: "de-DE", en: "en-GB", ne: "ne-NP" };
const VOICES = {
  "de-f": process.env.VOICE_DE_F || "de-DE-KatjaNeural",
  "de-m": process.env.VOICE_DE_M || "de-DE-ConradNeural",
  "en-f": process.env.VOICE_EN_F || "en-GB-SoniaNeural",
  "en-m": process.env.VOICE_EN_M || "en-GB-RyanNeural",
  "ne-f": process.env.VOICE_NE_F || "ne-NP-HemkalaNeural",
  "ne-m": process.env.VOICE_NE_M || "ne-NP-SagarNeural",
};

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const sha = (s) => createHash("sha1").update(s).digest("hex").slice(0, 16);

// What to speak: the item itself (slightly slower, for learners) and its example sentence.
function jobsFor(lang) {
  const jobs = [];
  for (const it of ITEMS) {
    if (it[lang]) jobs.push({ key: it.id, text: it[lang], rate: "-10%" });
    if (it.ex && it.ex[lang]) jobs.push({ key: it.id + ".ex", text: it.ex[lang], rate: "-5%" });
  }
  return jobs;
}

function ssml(voice, locale, text, rate) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    `<voice name="${voice}"><prosody rate="${rate}">${esc(text)}</prosody></voice></speak>`;
}

async function listVoices() {
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
    headers: { "Ocp-Apim-Subscription-Key": KEY },
  });
  if (!r.ok) throw new Error(`Voice list failed (${r.status}). Check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.`);
  return r.json();
}

// Use the configured voice if the region offers it, otherwise the first neural voice of that locale and gender.
function resolveVoices(available) {
  const names = new Set(available.map((v) => v.ShortName));
  for (const [slot, name] of Object.entries(VOICES)) {
    if (names.has(name)) continue;
    const [lang, g] = slot.split("-");
    const alt = available.find((v) => v.Locale === LOCALE[lang] && v.Gender === (g === "f" ? "Female" : "Male") && /Neural/.test(v.VoiceType || v.ShortName));
    if (!alt) throw new Error(`No ${g === "f" ? "female" : "male"} ${LOCALE[lang]} neural voice in region ${REGION}.`);
    console.warn(`${name} not available in ${REGION}; using ${alt.ShortName}.`);
    VOICES[slot] = alt.ShortName;
  }
}

async function synth(voice, locale, text, rate, attempt = 1) {
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": KEY,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "bhasha-audio-generator",
    },
    body: ssml(voice, locale, text, rate),
  });
  if ((r.status === 429 || r.status >= 500) && attempt < 6) {
    await new Promise((res) => setTimeout(res, 1000 * 2 ** attempt));
    return synth(voice, locale, text, rate, attempt + 1);
  }
  if (!r.ok) throw new Error(`TTS failed (${r.status}) for "${text}" with ${voice}: ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

async function pool(tasks, n) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < tasks.length) await tasks[i++](); }));
}

async function main() {
  const hashesPath = `${OUT}/hashes.json`;
  const hashes = existsSync(hashesPath) && !FORCE ? JSON.parse(readFileSync(hashesPath, "utf8")) : {};
  const plan = [];
  let chars = 0;
  for (const slot of Object.keys(VOICES)) {
    const [lang] = slot.split("-");
    for (const j of jobsFor(lang)) {
      const h = sha(VOICES[slot] + "|" + j.rate + "|" + j.text);
      const file = `${OUT}/${slot}/${j.key}.mp3`;
      if (!FORCE && hashes[`${slot}/${j.key}`] === h && existsSync(file)) continue;
      plan.push({ slot, lang, ...j, h, file });
      chars += j.text.length;
    }
  }
  console.log(`${plan.length} files to generate (${chars} characters).`);
  if (DRY) return;
  if (!KEY) throw new Error("Set AZURE_SPEECH_KEY (and AZURE_SPEECH_REGION) to generate audio.");

  resolveVoices(await listVoices());
  for (const slot of Object.keys(VOICES)) mkdirSync(`${OUT}/${slot}`, { recursive: true });
  let done = 0;
  await pool(plan.map((p) => async () => {
    const h = sha(VOICES[p.slot] + "|" + p.rate + "|" + p.text);
    writeFileSync(p.file, await synth(VOICES[p.slot], LOCALE[p.lang], p.text, p.rate));
    hashes[`${p.slot}/${p.key}`] = h;
    if (++done % 50 === 0) console.log(`  ${done}/${plan.length}`);
  }), 4);

  // Index for the app, and removal of audio for deleted content.
  const index = { generated: new Date().toISOString(), voices: VOICES, files: {} };
  for (const slot of Object.keys(VOICES)) {
    const [lang] = slot.split("-");
    const keys = new Set(jobsFor(lang).map((j) => j.key));
    if (existsSync(`${OUT}/${slot}`)) {
      for (const f of readdirSync(`${OUT}/${slot}`)) {
        const k = f.replace(/\.mp3$/, "");
        if (!keys.has(k)) { unlinkSync(`${OUT}/${slot}/${f}`); delete hashes[`${slot}/${k}`]; }
      }
    }
    index.files[slot] = [...keys].filter((k) => existsSync(`${OUT}/${slot}/${k}.mp3`)).sort();
  }
  writeFileSync(`${OUT}/index.json`, JSON.stringify(index) + "\n");
  writeFileSync(hashesPath, JSON.stringify(hashes, null, 1) + "\n");
  console.log(`Done: ${done} new files. Index written.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
