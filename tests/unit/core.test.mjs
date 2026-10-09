import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAY, applyGrade, itemState, nextInterval, planNumbers, buildSession, scoreRecording,
  speechStats, envelope, voiceScore, voiceGender, coreWord, blankable, streakFrom, dayKey, newProgress,
  normPrio, pickTaskType, canOrder, shuffledOrder, answerOk, usesWord, overlapScore, passiveDeck, lockTimes, SKILLS, TASK_SKILL, FOCUS_PRESETS,
} from "../../web/js/core.js";
import { ITEMS, WORDS, BY, ALL_TRV, ALL_PHR, READ, READ_BY } from "../../web/js/content.js";
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

test("content is complete in all five languages", () => {
  const ids = new Set();
  for (const it of ITEMS) {
    assert.ok(!ids.has(it.id), `duplicate id ${it.id}`); ids.add(it.id);
    for (const l of ["de", "en", "ne", "ko", "es"]) assert.ok(it[l] && it[l].trim(), `${it.id} missing ${l}`);
    assert.ok(it.rom.ne && it.rom.ko, `${it.id} missing romanisation`);
    assert.match(it.ko, /[\uAC00-\uD7A3]/, `${it.id} Korean not Hangul`);
    assert.match(it.ne, /[ऀ-ॿ]/, `${it.id} Nepali not Devanagari`);
    if (it.ex) for (const l of ["de", "en", "ne", "ko", "es"]) assert.ok(it.ex[l], `${it.id} example missing ${l}`);
  }
  assert.ok(ALL_TRV.length >= 40 && ALL_PHR.length >= 15 && WORDS.length >= 170, `${ALL_TRV.length}/${ALL_PHR.length}/${WORDS.length}`);
});

test("reading texts: aligned sentences in every language and answerable questions", () => {
  assert.ok(READ.length >= 6);
  for (const r of READ) {
    assert.equal(READ_BY[r.id], r);
    const n = r.text.en.length;
    for (const l of ["de", "en", "ne", "ko", "es"]) {
      assert.ok(r.title[l], `${r.id} title ${l}`);
      assert.equal(r.text[l].length, n, `${r.id} ${l} sentence count`);
      for (const q of r.q) { assert.ok(q.q[l], `${r.id} question ${l}`); for (const o of q.o) assert.ok(o[l], `${r.id} option ${l}`); }
    }
    for (const q of r.q) assert.ok(q.a >= 0 && q.a < q.o.length);
  }
});

test("every interface string exists in all five interface languages", () => {
  for (const k of Object.keys(S.en)) for (const l of ["de", "ne", "ko", "es"]) assert.ok(S[l][k], `${l} missing ${k}`);
  for (const k of SKILLS) assert.ok(S.en["sk_" + k]);
});

test("focus: old profiles move 'context' to reading; presets sum to 100", () => {
  const p = normPrio({ vocab: 40, listen: 20, speak: 25, context: 15 });
  assert.deepEqual(p, { vocab: 40, listen: 20, speak: 25, read: 15, write: 15 });
  for (const [k, v] of Object.entries(FOCUS_PRESETS)) assert.equal(SKILLS.reduce((s, x) => s + v[x], 0), 100, k);
  for (const ty of Object.keys(TASK_SKILL)) assert.ok(SKILLS.includes(TASK_SKILL[ty]));
});

test("task type follows the skill focus and the item's data", () => {
  const count = (prio, item) => { const c = {}; for (let i = 0; i < 400; i++) { const ty = pickTaskType(item, false, prio, "de", () => i / 400); c[ty] = (c[ty] || 0) + 1; } return c; };
  const w = count(FOCUS_PRESETS.write, BY.d1), l = count(FOCUS_PRESETS.listen, BY.d1);
  assert.ok((w.type || 0) + (w.translate || 0) + (w.write || 0) > (l.type || 0) + (l.translate || 0) + (l.write || 0));
  assert.ok((l.audio || 0) + (l.dictation || 0) > (w.audio || 0) + (w.dictation || 0));
  assert.equal(pickTaskType(BY.d1, true, FOCUS_PRESETS.balanced, "de"), "study");
  const noEx = { ...BY.d1, ex: null };
  const c = count(FOCUS_PRESETS.write, noEx);
  assert.ok(!c.translate && !c.write && !c.order && !c.fill);
});

test("word order: shuffle never returns the original order", () => {
  for (let n = 2; n < 9; n++) for (let k = 0; k < 20; k++) { const o = shuffledOrder(n); assert.ok(o.some((v, i) => v !== i)); assert.equal(new Set(o).size, n); }
  assert.ok(WORDS.filter((w) => canOrder(w, "de")).length > 40);
});

test("reviews include matching and reading when reading is in focus", () => {
  const prog = {};
  for (const id of ["d1", "d2", "d3", "d4", "f1", "f2"]) prog[id] = { ...applyGrade(newProgress(), 3, now - 5 * DAY), due: now - 1 };
  const p2 = { ...profile, prio: FOCUS_PRESETS.read };
  const tasks = buildSession({ items: ITEMS, words: WORDS, prog, profile: p2, now, wotdId: "g1", dueIds: Object.keys(prog), accuracy: 0.9, readId: "rd1", rand: () => 0.4 });
  const m = tasks.find((x) => x.type === "match");
  assert.ok(m && m.ids.length === 4);
  assert.ok(tasks.some((x) => x.type === "read" && x.rid === "rd1"));
  const none = buildSession({ items: ITEMS, words: WORDS, prog, profile: { ...p2, prio: { vocab: 60, listen: 20, speak: 20, read: 0, write: 0 } }, now, wotdId: "g1", dueIds: Object.keys(prog), accuracy: 0.9, readId: "rd1", rand: () => 0.4 });
  assert.ok(!none.some((x) => x.type === "read"));
});

test("answer checking: articles, accents and romanisation are optional", () => {
  assert.ok(answerOk("Mutter", BY.d1, "de") || answerOk(BY.d1.de, BY.d1, "de"));
  assert.ok(answerOk(BY.d1.de.toUpperCase(), BY.d1, "de"));
  assert.ok(answerOk(BY.d1.rom.ne, BY.d1, "ne"));
  assert.ok(answerOk(BY.d1.rom.ko, BY.d1, "ko"));
  const es = BY.d1.es; assert.ok(answerOk(es.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""), BY.d1, "es"));
  assert.ok(!answerOk("", BY.d1, "de"));
  assert.ok(!answerOk("xyz", BY.d1, "de"));
  assert.ok(usesWord("Meine Mutter ist nett.", { de: "die Mutter" }, "de"));
  assert.ok(!usesWord("Mein Vater ist nett.", { de: "die Mutter" }, "de"));
  assert.equal(overlapScore("Ich trinke Kaffee", "Ich trinke Kaffee."), 1);
  assert.ok(overlapScore("Ich esse", "Ich trinke Kaffee") < 0.5);
});

test("passive exposure: due words first, mastered words left out; lock times within hours", () => {
  const prog = { d2: { ...applyGrade(newProgress(), 3, now - 5 * DAY), due: now - 1 } };
  let m = newProgress(); let t0 = now - 400 * DAY; for (let i = 0; i < 8; i++) { m = applyGrade(m, 4, t0); t0 = m.due; }
  prog.d3 = { ...m, due: now + 50 * DAY };
  const d = passiveDeck({ items: ITEMS, prog, profile, now, n: 10, wotdId: "g1" });
  assert.equal(d[0], "g1"); assert.equal(d[1], "d2"); assert.ok(!d.includes("d3")); assert.equal(d.length, 10);
  for (const id of d) assert.notEqual(BY[id].kind, "phrase");
  const base = new Date(2026, 9, 6, 0, 1).getTime();
  const times = lockTimes({ perDay: 6, from: 8, to: 21, days: 2, now: base });
  assert.equal(times.length, 12);
  for (const x of times) { const h = new Date(x).getHours(); assert.ok(h >= 8 && h < 21, `hour ${h}`); }
  assert.ok(lockTimes({ perDay: 6, from: 8, to: 21, days: 1, now: new Date(2026, 9, 6, 20).getTime() }).length < 6);
});

test("built-in audio covers every word, phrase and example in every voice", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const { jobsFor } = await import("../../scripts/audio-jobs.mjs");
  const index = JSON.parse(readFileSync("web/audio/index.json", "utf8"));
  if (!Object.keys(index.files || {}).length) return; // audio not generated yet
  const slots = ["de-f", "de-m", "en-f", "en-m", "ne-f", "ne-m"].concat(index.engine === "azure" ? ["ko-f", "ko-m", "es-f", "es-m"] : []);
  for (const slot of slots) {
    const have = new Set(index.files[slot] || []);
    for (const j of jobsFor(slot.slice(0, 2))) {
      assert.ok(have.has(j.key), `${slot} missing ${j.key}`);
      assert.ok(existsSync(`web/audio/${slot}/${j.key}.mp3`), `${slot}/${j.key}.mp3 missing on disk`);
    }
  }
});
