// Bhasha core engine: pure functions with no DOM access, so they can be unit-tested in Node.
export const DAY = 864e5;
export const LEVEL_RANK = { b: 0, i: 1, a: 2 };
export const SESSION_SIZE = { 10: 8, 20: 14, 30: 20, 45: 28, 60: 36 };
export const NEW_PER_SESSION = { 10: 3, 20: 5, 30: 7, 45: 9, 60: 12 };

/* ---------- Spaced repetition (SM-2 family) ---------- */
export function newProgress() {
  return { reps: 0, ease: 2.5, ivl: 0, due: 0, lapses: 0, seen: 0, ok: 0, bad: 0, pron: [] };
}

/** Next interval in days for a grade (1 again, 2 hard, 3 good, 4 easy), without changing anything. */
export function nextInterval(p, g) {
  p = p || newProgress();
  if (g === 1) return 10 / (24 * 60);
  if (!p.reps) return [0, 0, 0.5, 1, 3][g];
  if (p.reps === 1) return [0, 0, 2, 3, 6][g];
  return Math.max(1, p.ivl * p.ease * (g === 2 ? 0.6 : g === 4 ? 1.3 : 1));
}

/** Apply a grade to a progress record (mutates and returns it). */
export function applyGrade(p, g, now = Date.now()) {
  p = p || newProgress();
  p.last = now;
  if (!p.seen) p.seen = now;
  if (g === 1) {
    p.lapses++; p.bad++; p.reps = 0; p.ivl = 0; p.due = now + 10 * 60e3;
    p.ease = Math.max(1.3, p.ease - 0.2); p.lapseAt = now;
  } else {
    p.ok++;
    p.ivl = nextInterval(p, g);
    p.ease = Math.max(1.3, p.ease + (g === 4 ? 0.15 : g === 2 ? -0.15 : 0));
    p.reps++;
    p.due = now + p.ivl * DAY;
  }
  return p;
}

/** Learning state shown to the learner: new, learning, familiar, mastered, review. */
export function itemState(p, now = Date.now()) {
  if (!p || !p.seen) return "new";
  if (p.ivl < 1) return "learning";
  if (p.due <= now) return "review";
  if (p.ivl >= 21) return "mastered";
  return "familiar";
}

export function formatInterval(days) {
  if (days < 1 / 24) return Math.round(days * 24 * 60) + " m";
  if (days < 1) return Math.round(days * 24) + " h";
  return Math.round(days) + " d";
}

/* ---------- Daily plan (adaptive) ---------- */
/**
 * How big today's session is. New words are halved when recent accuracy is below 70 %,
 * and capped at 2 when more than 15 reviews are waiting, so reviews never pile up.
 */
export function planNumbers({ minutes, prio, dueCount, accuracy }) {
  const n = SESSION_SIZE[minutes] || 14;
  let nNew = NEW_PER_SESSION[minutes] || 5;
  if (accuracy !== null && accuracy !== undefined && accuracy < 0.7) nNew = Math.ceil(nNew / 2);
  if (dueCount > 15) nNew = Math.min(nNew, 2);
  const nDue = Math.min(dueCount, Math.ceil(n * 0.6));
  const tot = (prio.vocab + prio.listen + prio.speak + prio.context) || 1;
  const nPron = Math.max(1, Math.round((n * prio.speak) / tot));
  return { n, nNew, nDue, nPron };
}

export function coreWord(s) {
  return s.replace(/^(der|die|das|to|sich)\s+/i, "").replace(/[?!.]/g, "").trim();
}
export function blankable(item, lang) {
  const ex = item.ex && item.ex[lang];
  if (!ex) return false;
  const core = coreWord(item[lang]);
  return core.length > 1 && ex.toLowerCase().includes(core.toLowerCase());
}

/** Weighted choice of task type for a review item, following the learner's focus. */
export function pickTaskType(item, isNew, prio, lang, rand = Math.random) {
  if (isNew) return "study";
  const w = [
    ["mcq", prio.vocab * 0.5],
    ["reverse", prio.vocab * 0.5],
    ["audio", prio.listen],
    ["fill", blankable(item, lang) ? prio.context : 0],
    ["type", prio.vocab * 0.25],
  ];
  const tot = w.reduce((s, x) => s + x[1], 0) || 1;
  let r = rand() * tot;
  for (const [k, v] of w) { if ((r -= v) <= 0) return k; }
  return "mcq";
}

/**
 * Build a session. ctx: { items, words, prog, profile, now, wotdId, dueIds, accuracy, mode, rand }
 * Returns tasks [{id, type, why}]. Due reviews come first (recently missed before oldest),
 * then new words (as study cards, checked again later in the session), then pronunciation.
 */
export function buildSession(ctx) {
  const { items, words, prog, profile, now = Date.now(), wotdId, dueIds, accuracy, mode, rand = Math.random } = ctx;
  const st = (id) => itemState(prog[id], now);
  const lang = profile.target;
  const tasks = [], used = new Set();
  const add = (id, type, why) => { tasks.push({ id, type, why }); used.add(id); };

  if (mode === "trip") {
    const pool = items.filter((i) => i.kind === "travel");
    const sorted = pool.filter((i) => st(i.id) === "review")
      .concat(pool.filter((i) => st(i.id) === "new"), pool.filter((i) => !["new", "review"].includes(st(i.id))));
    sorted.slice(0, 6).forEach((i, k) => add(i.id, st(i.id) === "new" ? "study" : (k % 2 ? "audio" : "mcq"), "whyTrip"));
    sorted.slice(0, 3).forEach((i) => tasks.push({ id: i.id, type: "pron", why: "whyPron" }));
    return tasks;
  }

  const { n, nNew, nDue, nPron } = planNumbers({ minutes: profile.minutes, prio: profile.prio, dueCount: dueIds.length, accuracy });
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  if (wotdId && st(wotdId) === "new") add(wotdId, "study", "whyWotd");
  dueIds.slice(0, nDue).forEach((id) => {
    const p = prog[id];
    add(id, pickTaskType(byId[id], false, profile.prio, lang, rand), p.lapseAt && now - p.lapseAt < 3 * DAY ? "whyLapse" : "whyDue");
  });
  const lvl = LEVEL_RANK[profile.level];
  const fresh = words
    .filter((i) => !used.has(i.id) && st(i.id) === "new" && LEVEL_RANK[i.level] <= lvl)
    .sort((a, b) => (LEVEL_RANK[b.level] === lvl) - (LEVEL_RANK[a.level] === lvl));
  fresh.slice(0, nNew).forEach((i) => add(i.id, "study", "whyNew"));

  const newIds = tasks.filter((x) => x.type === "study").map((x) => x.id);
  const late = [];
  newIds.forEach((id) => { if (tasks.length + late.length < n - nPron) late.push({ id, type: rand() < 0.5 ? "mcq" : "audio", why: "whyNew" }); });
  Object.keys(prog).filter((id) => byId[id] && !used.has(id) && st(id) === "learning").forEach((id) => {
    if (tasks.length + late.length < n - nPron) add(id, pickTaskType(byId[id], false, profile.prio, lang, rand), "whyLapse");
  });
  for (const i of words) {
    if (tasks.length + late.length >= n - nPron) break;
    if (!used.has(i.id) && st(i.id) === "new" && LEVEL_RANK[i.level] <= lvl) add(i.id, "study", "whyNew");
  }
  const ids = [...used];
  const pron = [];
  for (let k = 0; k < nPron && ids.length; k++) pron.push({ id: ids[(k * 3) % ids.length], type: "pron", why: "whyPron" });

  // Interleave reviews and study cards; checks of today's new words and pronunciation come after.
  const studies = tasks.filter((x) => x.type === "study"), checks = tasks.filter((x) => x.type !== "study");
  const out = [];
  while (checks.length || studies.length) { if (checks.length) out.push(checks.shift()); if (studies.length) out.push(studies.shift()); }
  return out.concat(late, pron);
}

/* ---------- Pronunciation analysis ---------- */
/** RMS envelope in 20 ms frames plus peak amplitude. */
export function envelope(data, sampleRate) {
  const hop = Math.max(1, Math.floor(sampleRate * 0.02)), env = [];
  let peak = 0;
  for (let i = 0; i + hop <= data.length; i += hop) {
    let s = 0;
    for (let j = i; j < i + hop; j++) { const v = data[j]; s += v * v; const a = Math.abs(v); if (a > peak) peak = a; }
    env.push(Math.sqrt(s / hop));
  }
  return { env, peak };
}

/** Speech span, duration and pause count from an envelope. */
export function speechStats(env) {
  const mx = Math.max(...env, 1e-6), th = Math.max(0.012, mx * 0.14);
  let first = env.findIndex((v) => v > th);
  let last = env.length - 1 - [...env].reverse().findIndex((v) => v > th);
  if (first < 0) { first = 0; last = -1; }
  const dur = Math.max(0, (last - first + 1) * 0.02);
  let pauses = 0, run = 0;
  for (let i = first; i <= last; i++) { if (env[i] <= th) run++; else { if (run * 0.02 >= 0.25) pauses++; run = 0; } }
  return { first, last, dur, pauses };
}

export function expectedDuration(text, romanised) {
  const t = (romanised || text).toLowerCase();
  const syl = (t.match(/[aeiouyäöüāīūēō]+/g) || []).length || 1;
  return 0.25 + syl * 0.24;
}

/**
 * Educational estimate (not a linguistic assessment): tempo vs. reference length,
 * volume, and unexpected pauses. Learners may be up to 35 % slower without penalty.
 */
export function scoreRecording({ dur, expected, peak, pauses, words }) {
  const ratio = dur / expected;
  const tempo = Math.round(Math.max(0, 100 - Math.max(0, ratio > 1 ? ratio - 1.35 : 0.8 - ratio) * 160));
  const volume = Math.round(peak < 0.05 ? (peak / 0.05) * 60 : peak > 0.98 ? 70 : 100);
  const extraP = Math.max(0, pauses - (words - 1));
  const flow = Math.max(0, 100 - extraP * 25);
  const score = dur < 0.15 ? 0 : Math.round(tempo * 0.45 + volume * 0.25 + flow * 0.3);
  const fb = [];
  if (dur >= 0.15) {
    if (ratio > 1.35) fb.push("fbSlow"); else if (ratio < 0.8) fb.push("fbFast");
    if (peak < 0.05) fb.push("fbQuiet");
    if (peak > 0.98) fb.push("fbLoud");
    if (extraP) fb.push("fbPause");
    if (!fb.length) fb.push("fbGood");
  } else fb.push("fbQuiet");
  return { tempo, volume, flow, score, fb, ratio };
}

/* ---------- Device voice choice (fallback when no generated audio exists) ---------- */
// Native Microsoft "Online (Natural)" voices ship with Microsoft Edge; the same voices are used for generated audio.
export const PREFERRED_VOICE = {
  de: { f: /katja|seraphina|amala/, m: /conrad|killian|florian/ },
  en: { f: /sonia|libby|maisie/, m: /ryan|thomas/ },
  ne: { f: /hemkala/, m: /sagar/ },
};
const GENDER_HINT = {
  f: /female|weiblich|katja|seraphina|amala|hedda|anna|petra|helena|vicki|marlene|sonia|libby|maisie|hazel|susan|kate|serena|samantha|karen|moira|tessa|fiona|zira|aria|jenny|hemkala|lekha|swara/,
  m: /\bmale|männlich|conrad|killian|florian|stefan|markus|yannick|hans|ryan|thomas|daniel|oliver|george|arthur|alfie|david|mark\b|guy|sagar|rishi|madhur/,
};
const NATIVE_LOCALE = { de: "de-de", en: "en-gb", ne: "ne-np" };

export function voiceGender(name) {
  const n = (name || "").toLowerCase();
  if (/female|weiblich/.test(n)) return "f";
  if (GENDER_HINT.m.test(n)) return "m";
  if (GENDER_HINT.f.test(n)) return "f";
  return null;
}

/** Score a speechSynthesis voice for a language and preferred gender; -1 means unusable. */
export function voiceScore(v, lang, gender = "f") {
  const l = (v.lang || "").replace("_", "-").toLowerCase(), n = (v.name || "").toLowerCase();
  let s;
  if (l === NATIVE_LOCALE[lang]) s = 100;
  else if (lang === "en" && l === "en-us") s = 85;
  else if (l.startsWith(lang)) s = 60;
  else if (lang === "ne" && l.startsWith("hi")) s = 20;
  else return -1;
  if (/natural|neural|premium|enhanced|erweitert|online|wavenet|studio|siri/.test(n)) s += 30;
  if (/google/.test(n)) s += 15;
  if (v.localService === false) s += 3;
  const pref = PREFERRED_VOICE[lang] && PREFERRED_VOICE[lang][gender];
  if (pref && pref.test(n)) s += 60;
  const g = voiceGender(n);
  if (g && g !== gender) s -= 25;
  if (/compact|espeak|eloquence|grandma|grandpa|eddy|flo\b|reed|rocko|sandy|shelley|bad news|bells|bubbles|jester|organ|trinoids|whisper|zarvox|albert|bahh|boing|cellos|good news|superstar|wobble/.test(n)) s -= 60;
  return s;
}
export const isHighQualityVoice = (v, lang, gender) => !!v && voiceScore(v, lang, gender) >= 130;

/* ---------- Day helpers ---------- */
export function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
export function dayKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function streakFrom(act, today = new Date()) {
  let n = 0; const d = new Date(today);
  if (!(act[dayKey(d)]?.xp > 0)) d.setDate(d.getDate() - 1);
  while (act[dayKey(d)]?.xp > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
