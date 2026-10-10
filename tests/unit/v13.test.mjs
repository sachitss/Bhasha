import { test } from "node:test";
import assert from "node:assert/strict";
import { numParts, numWords, numRom, numDigits, neDigits, STEPS, practiceNumber, curriculumNumbers, numberAudioParts } from "../../web/js/numbers.js";
import { DIALOGS, LINE_BY, replyOptions, GRAMMAR, grammarQuiz, grammarAudioJobs, hasBatchim } from "../../web/js/practice.js";
import { ITEMS } from "../../web/js/content.js";
import { jobsFor } from "../../scripts/audio-jobs.mjs";

const LANGS = ["de", "en", "es", "ne", "ko"];

test("numbers: known spellings in every language", () => {
  const cases = {
    de: { 0: "null", 1: "eins", 16: "sechzehn", 21: "einundzwanzig", 30: "dreißig", 101: "hunderteins", 347: "dreihundertsiebenundvierzig", 1000: "tausend", 2350: "zweitausenddreihundertfünfzig", 100000: "hunderttausend", 1000000: "eine Million" },
    en: { 15: "fifteen", 40: "forty", 99: "ninety-nine", 115: "one hundred and fifteen", 2050: "two thousand and fifty", 20500: "twenty thousand five hundred", 1000000: "one million" },
    es: { 16: "dieciséis", 22: "veintidós", 31: "treinta y uno", 100: "cien", 101: "ciento uno", 500: "quinientos", 700: "setecientos", 900: "novecientos", 1000: "mil", 100000: "cien mil", 200000: "doscientos mil", 1000000: "un millón" },
    ne: { 0: "शून्य", 11: "एघार", 19: "उन्नाइस", 25: "पच्चीस", 50: "पचास", 99: "उनान्सय", 100: "एक सय", 347: "तीन सय सतचालीस", 1000: "एक हजार", 100000: "एक लाख", 1000000: "दस लाख" },
    ko: { 0: "영", 10: "십", 11: "십일", 20: "이십", 100: "백", 347: "삼백사십칠", 1000: "천", 10000: "만", 20500: "이만 오백", 100000: "십만", 1000000: "백만" },
  };
  for (const [l, m] of Object.entries(cases)) for (const [n, w] of Object.entries(m)) assert.equal(numWords(+n, l), w, `${l} ${n}`);
  assert.equal(numRom(347, "ne"), "tin saya satchaalis");
  assert.equal(numRom(347, "ko"), "sam-baek sa-sip-chil");
  assert.equal(numRom(5, "de"), "");
});

test("numbers: every value 0–1,000,000 in the curriculum has words, unique audio parts, romanisation for ne/ko", () => {
  const nums = curriculumNumbers();
  assert.ok(nums.length > 1200 && nums.includes(1000000) && nums.includes(20500));
  for (const l of LANGS) {
    const seen = new Map();
    for (const n of nums) {
      const p = numParts(n, l);
      assert.ok(p.length >= 1 && p.every((x) => x.t && x.k), `${l} ${n}`);
      if (l === "ne" || l === "ko") assert.ok(p.every((x) => x.r), `${l} ${n} rom`);
      for (const x of p) { if (seen.has(x.k)) assert.equal(seen.get(x.k), x.t, `${l} key ${x.k} has two texts`); seen.set(x.k, x.t); }
    }
    // Different numbers read differently.
    const words = new Set(nums.map((n) => numWords(n, l)));
    assert.equal(words.size, nums.length, `${l} duplicate words`);
    assert.ok(numberAudioParts(l).length < 160, `${l} too many audio parts`);
  }
  assert.throws(() => numParts(1000001, "de"));
});

test("numbers: steps to a million, grouping, practice ranges", () => {
  assert.equal(STEPS.length, 28);
  assert.deepEqual([STEPS[0], STEPS[9], STEPS[10], STEPS[18], STEPS[19], STEPS[27]], [1000, 10000, 20000, 100000, 200000, 1000000]);
  assert.equal(numDigits(1000000, "de"), "1.000.000");
  assert.equal(numDigits(1000000, "en"), "1,000,000");
  assert.equal(numDigits(1000000, "ne"), "10,00,000");
  assert.equal(numDigits(2500, "es"), "2500");
  assert.equal(neDigits("347"), "३४७");
  let r = 0; const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 300; i++) {
    const a = practiceNumber("n1", rand), b = practiceNumber("n2", rand), c = practiceNumber("n3", rand), d = practiceNumber("n4", rand);
    assert.ok(a >= 0 && a <= 20 && b >= 21 && b <= 100 && c >= 100 && c <= 1000 && d >= 1000 && d <= 1000000);
    assert.ok(curriculumNumbers().includes(d), `n4 ${d} has audio`);
  }
});

test("conversations: complete in five languages, alternating turns, plausible options", () => {
  assert.ok(DIALOGS.length >= 6);
  for (const d of DIALOGS) {
    for (const l of LANGS) assert.ok(d.title[l], `${d.id} title ${l}`);
    d.lines.forEach((ln, i) => {
      assert.equal(ln.who, i % 2 ? "m" : "b", `${ln.id} turn order`);
      for (const l of LANGS) assert.ok(ln[l] && ln[l].trim(), `${ln.id} ${l}`);
      assert.match(ln.ne, /[ऀ-ॿ]/); assert.match(ln.ko, /[가-힣]/);
      assert.ok(ln.rom.ne && ln.rom.ko, `${ln.id} rom`);
    });
    for (let i = 1; i < d.lines.length; i += 2) {
      const o = replyOptions(d.id, i);
      assert.equal(o.length, 3); assert.ok(o.includes(d.lines[i].id));
      assert.equal(new Set(o).size, 3);
      for (const id of o) assert.ok(LINE_BY[id] && LINE_BY[id].who === "m");
    }
  }
});

test("grammar: every target language has topics with rules in five languages and a working quiz", () => {
  for (const tl of LANGS) {
    const topics = GRAMMAR.filter((g) => g.lang === tl);
    assert.ok(topics.length >= 2, `${tl} topics`);
    for (const g of topics) {
      for (const l of LANGS) { assert.ok(g.title[l], `${g.id} title ${l}`); assert.ok(g.rule[l], `${g.id} rule ${l}`); }
      const q = grammarQuiz(g, ITEMS, 8, Math.random);
      assert.ok(q.length >= 5, `${g.id} quiz ${q.length}`);
      for (const x of q) { assert.ok(x.o.includes(x.a), `${g.id} answer in options`); assert.equal(new Set(x.o).size, x.o.length); assert.ok(x.q.includes("___")); }
      if (g.table) { const w = g.table[0].length; for (const r of g.table) assert.equal(r.length, w, `${g.id} row width`); }
    }
  }
  assert.ok(hasBatchim("책") && !hasBatchim("의자") && hasBatchim("형") && !hasBatchim("사과"));
  const art = grammarQuiz(GRAMMAR.find((g) => g.id === "g_de_art"), ITEMS, 8);
  for (const x of art) assert.ok(["der", "die", "das"].includes(x.a));
});

test("audio jobs include number parts, conversation lines and grammar phrases, with unique keys", () => {
  for (const l of LANGS) {
    const jobs = jobsFor(l), keys = jobs.map((j) => j.key);
    assert.equal(new Set(keys).size, keys.length, `${l} duplicate keys`);
    assert.ok(keys.includes("nm.n47") && keys.includes("c1.0"), l);
    assert.ok(grammarAudioJobs(l).every((j) => keys.includes(j.key)), `${l} grammar jobs`);
    for (const j of jobs) assert.ok(j.text && j.text.trim() && !/[\/\\]/.test(j.key), `${l} ${j.key}`);
  }
});
