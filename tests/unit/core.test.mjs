import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAY, applyGrade, itemState, nextInterval, planNumbers, buildSession, scoreRecording,
  speechStats, envelope, voiceScore, voiceGender, coreWord, blankable, streakFrom, dayKey, newProgress,
} from "../../web/js/core.js";
import { ITEMS, WORDS, BY, TRV, PHR } from "../../web/js/content.js";
import { S } from "../../web/js/i18n.js";

const now = Date.UTC(2026, 9, 6, 10);
const profile = { target: "de", known: "en", level: "b", minutes: 20, prio: { vocab: 40, listen: 20, speak: 25, context: 15 } };

test("new item is new; good grade schedules next day", () => {
  assert.equal(itemState(undefined, now), "new");
  const p = applyGrade(newProgress(), 3, now);
  assert.equal(p.ivl, 1);
  assert.equal(p.due, now + DAY);
  assert.equal(itemState(p, now), "familiar");
  assert.equal(itemState(p, now + DAY + 1), "review");
});

test("again resets and comes back in 10 minutes", () => {
  let p = applyGrade(newProgress(), 3, now);
  p = applyGrade(p, 3, now + DAY);
  p = applyGrade(p, 1, now + 2 * DAY);
  assert.equal(p.reps, 0);
  assert.equal(p.lapses, 1);
  assert.equal(p.due, now + 2 * DAY + 10 * 60e3);
  assert.equal(itemState(p, now + 2 * DAY), "learning");
  assert.ok(p.ease < 2.5);
});

test("intervals grow and reach mastered", () => {
  let p = newProgress(), t = now;
  for (let i = 0; i < 6; i++) { p = applyGrade(p, 3, t); t = p.due; }
  assert.ok(p.ivl >= 21, `ivl ${p.ivl}`);
  assert.equal(itemState(p, p.due - 1), "mastered");
  assert.ok(nextInterval(p, 4) > nextInterval(p, 3));
  assert.ok(nextInterval(p, 2) < nextInterval(p, 3));
});

test("plan adapts to accuracy and backlog", () => {
  const base = planNumbers({ minutes: 20, prio: profile.prio, dueCount: 0, accuracy: null });
  assert.equal(base.nNew, 5);
  assert.equal(planNumbers({ minutes: 20, prio: profile.prio, dueCount: 0, accuracy: 0.5 }).nNew, 3);
  assert.equal(planNumbers({ minutes: 20, prio: profile.prio, dueCount: 30, accuracy: 0.9 }).nNew, 2);
  assert.ok(planNumbers({ minutes: 60, prio: profile.prio, dueCount: 0, accuracy: null }).n > base.n);
});

test("first session teaches new words and checks them, with pronunciation", () => {
  const tasks = buildSession({ items: ITEMS, words: WORDS, prog: {}, profile, now, wotdId: "g1", dueIds: [], accuracy: null, rand: () => 0.3 });
  assert.ok(tasks.length >= 8 && tasks.length <= 14, `length ${tasks.length}`);
  assert.equal(tasks[0].why, "whyWotd");
  const studies = tasks.filter((t) => t.type === "study").map((t) => t.id);
  const checks = tasks.filter((t) => t.why === "whyNew" && t.type !== "study").map((t) => t.id);
  for (const id of checks) assert.ok(studies.indexOf(id) > -1 && tasks.findIndex((t) => t.id === id && t.type === "study") < tasks.findIndex((t) => t.id === id && t.type !== "study"));
  assert.ok(tasks.some((t) => t.type === "pron"));
  for (const t of tasks) assert.ok(BY[t.id], t.id);
});

test("due reviews come first, recently missed before older ones", () => {
  const prog = {
    g2: applyGrade(newProgress(), 3, now - 5 * DAY),
    g3: applyGrade(applyGrade(newProgress(), 3, now - 3 * DAY), 1, now - DAY),
  };
  prog.g3.due = now - 1;
  const tasks = buildSession({ items: ITEMS, words: WORDS, prog, profile, now, wotdId: "g1", dueIds: ["g3", "g2"], accuracy: 0.9, rand: () => 0.1 });
  const firstReview = tasks.find((t) => t.why === "whyDue" || t.why === "whyLapse");
  assert.equal(firstReview.id, "g3");
  assert.equal(firstReview.why, "whyLapse");
});

test("trip mode uses only travel phrases", () => {
  const tasks = buildSession({ items: ITEMS, words: WORDS, prog: {}, profile, now, dueIds: [], mode: "trip", rand: () => 0.5 });
  assert.ok(tasks.length > 0);
  for (const t of tasks) assert.equal(BY[t.id].kind, "travel");
});

test("fill-in-the-blank only where the word appears in the example", () => {
  assert.equal(coreWord("die Mutter"), "Mutter");
  assert.equal(coreWord("to eat"), "eat");
  assert.ok(blankable(BY.d1, "de"));
  assert.ok(!blankable(BY.x1, "de"));
});

test("pronunciation estimate: matching tempo scores high, silence scores zero", () => {
  const good = scoreRecording({ dur: 1.0, expected: 0.9, peak: 0.5, pauses: 0, words: 1 });
  assert.ok(good.score >= 90, `score ${good.score}`);
  assert.deepEqual(good.fb, ["fbGood"]);
  const slow = scoreRecording({ dur: 3, expected: 1, peak: 0.5, pauses: 0, words: 1 });
  assert.ok(slow.fb.includes("fbSlow") && slow.score < good.score);
  assert.equal(scoreRecording({ dur: 0.05, expected: 1, peak: 0.01, pauses: 0, words: 1 }).score, 0);
  const pausy = scoreRecording({ dur: 1, expected: 1, peak: 0.5, pauses: 3, words: 1 });
  assert.ok(pausy.fb.includes("fbPause"));
});

test("envelope and speech span from a synthetic signal", () => {
  const sr = 8000, data = new Float32Array(sr * 2);
  for (let i = sr * 0.5; i < sr * 1.5; i++) data[i] = 0.5 * Math.sin((2 * Math.PI * 200 * i) / sr);
  const { env, peak } = envelope(data, sr);
  const st = speechStats(env);
  assert.ok(Math.abs(st.dur - 1) < 0.06, `dur ${st.dur}`);
  assert.equal(st.pauses, 0);
  assert.ok(peak > 0.49);
});

test("voice choice prefers native Edge voices by gender", () => {
  const V = (name, lang, local = false) => ({ name, lang, localService: local });
  const de = [V("Microsoft Hedda - German (Germany)", "de-DE", true), V("Microsoft Katja Online (Natural) - German (Germany)", "de-DE"),
    V("Microsoft Conrad Online (Natural) - German (Germany)", "de-DE"), V("Microsoft Jonas Online (Natural) - German (Austria)", "de-AT")];
  const best = (list, lang, g) => list.slice().sort((a, b) => voiceScore(b, lang, g) - voiceScore(a, lang, g))[0].name;
  assert.match(best(de, "de", "f"), /Katja/);
  assert.match(best(de, "de", "m"), /Conrad/);
  const ne = [V("Microsoft Hemkala Online (Natural) - Nepali (Nepal)", "ne-NP"), V("Microsoft Sagar Online (Natural) - Nepali (Nepal)", "ne-NP"), V("Lekha", "hi-IN", true)];
  assert.match(best(ne, "ne", "f"), /Hemkala/);
  assert.match(best(ne, "ne", "m"), /Sagar/);
  const ko = [V("Microsoft SunHi Online (Natural) - Korean (Korea)", "ko-KR"), V("Microsoft InJoon Online (Natural) - Korean (Korea)", "ko-KR"), V("Microsoft Heami - Korean (Korean)", "ko-KR", true)];
  assert.match(best(ko, "ko", "f"), /SunHi/);
  assert.match(best(ko, "ko", "m"), /InJoon/);
  assert.equal(voiceScore(V("Google français", "fr-FR"), "de", "f"), -1);
  assert.equal(voiceGender("Google UK English Male"), "m");
  assert.equal(voiceGender("Google UK English Female"), "f");
});

test("streak counts consecutive days", () => {
  const d = new Date(2026, 9, 6), act = {};
  for (let i = 0; i < 3; i++) { const x = new Date(d); x.setDate(d.getDate() - i); act[dayKey(x)] = { xp: 10 }; }
  assert.equal(streakFrom(act, d), 3);
  assert.equal(streakFrom({}, d), 0);
});

test("content is complete in all three languages", () => {
  const ids = new Set();
  for (const it of ITEMS) {
    assert.ok(!ids.has(it.id), `duplicate id ${it.id}`); ids.add(it.id);
    for (const l of ["de", "en", "ne", "ko"]) assert.ok(it[l] && it[l].trim(), `${it.id} missing ${l}`);
    assert.ok(it.rom.ne && it.rom.ko, `${it.id} missing romanisation`);
    assert.match(it.ko, /[\uAC00-\uD7A3]/, `${it.id} Korean not Hangul`);
    assert.match(it.ne, /[ऀ-ॿ]/, `${it.id} Nepali not Devanagari`);
    if (it.ex) for (const l of ["de", "en", "ne", "ko"]) assert.ok(it.ex[l], `${it.id} example missing ${l}`);
  }
  assert.ok(TRV.length >= 20 && PHR.length >= 5 && WORDS.length >= 50);
});

test("every interface string exists in German and Nepali", () => {
  for (const k of Object.keys(S.en)) {
    assert.ok(S.de[k], `de missing ${k}`);
    assert.ok(S.ne[k], `ne missing ${k}`);
  }
});

test("built-in audio covers every word, phrase and example in every voice", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const { jobsFor } = await import("../../scripts/audio-jobs.mjs");
  const index = JSON.parse(readFileSync("web/audio/index.json", "utf8"));
  if (!Object.keys(index.files || {}).length) return; // audio not generated yet
  const slots = ["de-f", "de-m", "en-f", "en-m", "ne-f", "ne-m"].concat(index.engine === "azure" ? ["ko-f", "ko-m"] : []);
  for (const slot of slots) {
    const have = new Set(index.files[slot] || []);
    for (const j of jobsFor(slot.slice(0, 2))) {
      assert.ok(have.has(j.key), `${slot} missing ${j.key}`);
      assert.ok(existsSync(`web/audio/${slot}/${j.key}.mp3`), `${slot}/${j.key}.mp3 missing on disk`);
    }
  }
});
