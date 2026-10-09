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

/* ---------- Learning focus: the four skills plus vocabulary ---------- */
export const SKILLS = ["vocab", "listen", "read", "speak", "write"];
/** Which skill each exercise trains. Vocabulary drives all four skills; these are the main targets. */
export const TASK_SKILL = {
  study: "vocab", mcq: "vocab", reverse: "vocab", match: "vocab",
  audio: "listen", dictation: "listen",
  fill: "read", order: "read", read: "read",
  pron: "speak",
  type: "write", translate: "write", write: "write",
};
/** Normalise focus weights; older profiles had "context", which becomes reading. */
export function normPrio(p = {}) {
  const out = {
    vocab: p.vocab ?? 30, listen: p.listen ?? 20, speak: p.speak ?? 20,
    read: p.read ?? p.context ?? 15, write: p.write ?? 15,
  };
  for (const k of SKILLS) out[k] = Math.max(0, Math.min(100, +out[k] || 0));
  return out;
}
export const FOCUS_PRESETS = {
  balanced: { vocab: 30, listen: 20, speak: 20, read: 15, write: 15 },
  listen: { vocab: 25, listen: 40, speak: 15, read: 10, write: 10 },
  read: { vocab: 25, listen: 10, speak: 10, read: 40, write: 15 },
  speak: { vocab: 25, listen: 15, speak: 40, read: 10, write: 10 },
  write: { vocab: 25, listen: 10, speak: 10, read: 15, write: 40 },
};
const share = (prio, k) => { const p = normPrio(prio); const tot = SKILLS.reduce((s, x) => s + p[x], 0) || 1; return p[k] / tot; };

/* ---------- Daily plan (adaptive) ---------- */
/**
 * How big today's session is. New words are halved when recent accuracy is below 70 %,
 * and capped at 2 when more than 15 reviews are waiting, so reviews never pile up.
 * A reading text is added when reading has at least 15 % of the focus (30 % in a 10-minute plan).
 */
export function planNumbers({ minutes, prio, dueCount, accuracy }) {
  const n = SESSION_SIZE[minutes] || 14;
  let nNew = NEW_PER_SESSION[minutes] || 5;
  if (accuracy !== null && accuracy !== undefined && accuracy < 0.7) nNew = Math.ceil(nNew / 2);
  if (dueCount > 15) nNew = Math.min(nNew, 2);
  const nDue = Math.min(dueCount, Math.ceil(n * 0.6));
  const nPron = Math.max(1, Math.round(n * share(prio, "speak")));
  const nRead = share(prio, "read") >= (minutes <= 10 ? 0.3 : 0.15) ? 1 : 0;
  return { n, nNew, nDue, nPron, nRead };
}

export function coreWord(s) {
  return s.replace(/^(der|die|das|to|sich|el|la|los|las)\s+/i, "").replace(/[¿¡?!.]/g, "").trim();
}
export function blankable(item, lang) {
  const ex = item.ex && item.ex[lang];
  if (!ex) return false;
  const core = coreWord(item[lang]);
  return core.length > 1 && ex.toLowerCase().includes(core.toLowerCase());
}
/** Sentence split into tokens for the word-order exercise. */
export const tokens = (sentence) => sentence.trim().split(/\s+/).filter(Boolean);
export function canOrder(item, lang) {
  const ex = item.ex && item.ex[lang];
  if (!ex) return false;
  const n = tokens(ex).length;
  return n >= 3 && n <= 9 && new Set(tokens(ex)).size === n;
}
/** A shuffled order of token indices that is never the original order. */
export function shuffledOrder(n, rand = Math.random) {
  const idx = [...Array(n).keys()];
  for (let tries = 0; tries < 20; tries++) {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    if (n < 2 || idx.some((v, i) => v !== i)) return idx;
  }
  return idx.reverse();
}
const short = (item, lang) => tokens(coreWord(item[lang] || "")).length <= 3;

/** Weighted choice of task type for a review item, following the learner's focus. */
export function pickTaskType(item, isNew, prio, lang, rand = Math.random) {
  if (isNew) return "study";
  const p = normPrio(prio);
  const hasEx = !!(item.ex && item.ex[lang]);
  const w = [
    ["mcq", p.vocab * 0.35],
    ["reverse", p.vocab * 0.3],
    ["audio", p.listen * 0.5],
    ["dictation", short(item, lang) ? p.listen * 0.5 : 0],
    ["fill", blankable(item, lang) ? p.read * 0.5 : 0],
    ["order", canOrder(item, lang) ? p.read * 0.5 : 0],
    ["type", short(item, lang) ? p.write * 0.35 : 0],
    ["translate", hasEx ? p.write * 0.35 : 0],
    ["write", hasEx && item.kind !== "travel" ? p.write * 0.3 : 0],
  ];
  const tot = w.reduce((s, x) => s + x[1], 0) || 1;
  let r = rand() * tot;
  for (const [k, v] of w) { if ((r -= v) <= 0) return k; }
  return "mcq";
}

/**
 * Build a session. ctx: { items, words, prog, profile, now, wotdId, dueIds, accuracy, mode, readId, rand }
 * Returns tasks [{id, type, why}] plus group tasks {type:"match", ids} and {type:"read", rid}.
 * Due reviews come first (recently missed before oldest), then new words (as study cards, checked again later
 * in the session), a matching round, a reading text when reading is part of the focus, then pronunciation.
 */
export function buildSession(ctx) {
  const { items, words, prog, profile, now = Date.now(), wotdId, dueIds, accuracy, mode, readId, rand = Math.random } = ctx;
  const st = (id) => itemState(prog[id], now);
  const lang = profile.target;
  const prio = normPrio(profile.prio);
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

  const { n, nNew, nDue, nPron, nRead } = planNumbers({ minutes: profile.minutes, prio, dueCount: dueIds.length, accuracy });
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  if (wotdId && st(wotdId) === "new") add(wotdId, "study", "whyWotd");
  dueIds.slice(0, nDue).forEach((id) => {
    const p = prog[id];
    add(id, pickTaskType(byId[id], false, prio, lang, rand), p.lapseAt && now - p.lapseAt < 3 * DAY ? "whyLapse" : "whyDue");
  });
  const lvl = LEVEL_RANK[profile.level];
  const fresh = words
    .filter((i) => !used.has(i.id) && st(i.id) === "new" && LEVEL_RANK[i.level] <= lvl)
    .sort((a, b) => (b.kind === "custom") - (a.kind === "custom") || (LEVEL_RANK[b.level] === lvl) - (LEVEL_RANK[a.level] === lvl));
  fresh.slice(0, nNew).forEach((i) => add(i.id, "study", "whyNew"));

  const newIds = tasks.filter((x) => x.type === "study").map((x) => x.id);
  const late = [];
  newIds.forEach((id) => { if (tasks.length + late.length < n - nPron) late.push({ id, type: rand() < 0.5 ? "mcq" : "audio", why: "whyNew" }); });
  Object.keys(prog).filter((id) => byId[id] && !used.has(id) && st(id) === "learning").forEach((id) => {
    if (tasks.length + late.length < n - nPron) add(id, pickTaskType(byId[id], false, prio, lang, rand), "whyLapse");
  });
  for (const i of words) {
    if (tasks.length + late.length >= n - nPron) break;
    if (!used.has(i.id) && st(i.id) === "new" && LEVEL_RANK[i.level] <= lvl) add(i.id, "study", "whyNew");
  }

  // Matching round: four words the learner has already met, with distinct target text.
  const seen = [...new Set([...used, ...Object.keys(prog)])]
    .filter((id) => byId[id] && st(id) !== "new" && byId[id][lang] && byId[id].kind !== "phrase");
  const matchIds = [];
  for (const id of seen) { if (matchIds.length < 4 && !matchIds.some((m) => byId[m][lang] === byId[id][lang])) matchIds.push(id); }
  const extras = [];
  if (matchIds.length === 4) extras.push({ type: "match", ids: matchIds, why: "whyMatch" });
  if (nRead && readId) extras.push({ type: "read", rid: readId, why: "whyRead" });

  const ids = [...used];
  const pron = [];
  for (let k = 0; k < nPron && ids.length; k++) pron.push({ id: ids[(k * 3) % ids.length], type: "pron", why: "whyPron" });

  // Interleave reviews and study cards; checks of today's new words, matching, reading and pronunciation come after.
  const studies = tasks.filter((x) => x.type === "study"), checks = tasks.filter((x) => x.type !== "study");
  const out = [];
  while (checks.length || studies.length) { if (checks.length) out.push(checks.shift()); if (studies.length) out.push(studies.shift()); }
  return out.concat(late, extras, pron);
}

/* ---------- Answer checking ---------- */
/** Lower-case, NFC, Latin accents removed (Devanagari and Hangul unchanged), punctuation and spaces removed. */
export function looseText(s) {
  return String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, "");
}
/** Typed or dictated answer: the target word (articles and accents optional) or, for Nepali and Korean, its romanisation. */
export function answerOk(input, item, lang) {
  const v = looseText(input);
  if (!v) return false;
  if (v === looseText(coreWord(item[lang] || "")) || v === looseText(item[lang])) return true;
  const rom = item.rom && item.rom[lang];
  return !!rom && v === looseText(rom);
}
/** Writing check (a hint, not a verdict): does the learner's sentence contain the word or its stem? */
export function usesWord(sentence, item, lang) {
  const s = String(sentence || "").toLowerCase();
  const core = coreWord(item[lang] || "").toLowerCase().split(/\s+/)[0] || "";
  if (!core) return false;
  let stem = core;
  if (lang === "ko") stem = core.replace(/(하다|다)$/, "") || core;
  else if (lang === "ne") stem = core.replace(/नु$/, "") || core;
  else if (core.length > 4) stem = core.slice(0, core.length - 2);
  return s.includes(stem);
}
/** Share of the model sentence's words that appear in the learner's translation (0–1). */
export function overlapScore(answer, model) {
  const m = tokens(model).map(looseText).filter(Boolean);
  const a = new Set(tokens(answer).map(looseText).filter(Boolean));
  if (!m.length) return 0;
  return m.filter((w) => a.has(w)).length / m.length;
}

/* ---------- Passive exposure (lock screen, widget, Glance mode) ---------- */
/**
 * Words to show without studying: due reviews first, then words being learnt, then familiar words seen least recently,
 * then upcoming new words at the learner's level (pre-exposure). Mastered words are left out.
 */
export function passiveDeck({ items, prog, profile, now = Date.now(), n = 24, wotdId }) {
  const lang = profile.target, known = profile.known, lvl = LEVEL_RANK[profile.level];
  const ok = (i) => i[lang] && (i[known] || i.mean) && i.kind !== "phrase";
  const st = (i) => itemState(prog[i.id], now);
  const pool = items.filter(ok);
  const by = (s) => pool.filter((i) => st(i) === s);
  const familiar = by("familiar").sort((a, b) => (prog[a.id].last || 0) - (prog[b.id].last || 0));
  const fresh = pool.filter((i) => st(i) === "new" && LEVEL_RANK[i.level] <= lvl);
  const first = wotdId ? pool.filter((i) => i.id === wotdId) : [];
  const out = [];
  for (const i of [...first, ...by("review"), ...by("learning"), ...familiar, ...fresh]) {
    if (out.length >= n) break;
    if (!out.includes(i.id)) out.push(i.id);
  }
  return out;
}
/**
 * Lock-screen word times: perDay moments spread evenly between hours from and to, for the next `days` days,
 * skipping times already past.
 */
export function lockTimes({ perDay = 6, from = 8, to = 21, days = 2, now = Date.now() }) {
  const out = [];
  const span = Math.max(1, to - from);
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  for (let d = 0; d < days; d++) {
    for (let k = 0; k < perDay; k++) {
      const t = new Date(d0); t.setDate(d0.getDate() + d);
      const minutes = Math.round((from + (span * (k + 0.5)) / perDay) * 60);
      t.setHours(0, minutes, 0, 0);
      if (t.getTime() > now + 60e3) out.push(t.getTime());
    }
  }
  return out;
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
  ko: { f: /sunhi/, m: /injoon/ },
  es: { f: /elvira|ximena|abril|laura|helena|monica|paulina/, m: /alvaro|jorge|pablo|diego/ },
};
const GENDER_HINT = {
  f: /female|weiblich|katja|seraphina|amala|hedda|anna|petra|helena|vicki|marlene|sonia|libby|maisie|hazel|susan|kate|serena|samantha|karen|moira|tessa|fiona|zira|aria|jenny|hemkala|lekha|swara|sunhi|yuna|jimin|seoyeon|soonbok|yujin|heami|elvira|ximena|abril|laura|helena|monica|paulina/,
  m: /\bmale|männlich|conrad|killian|florian|stefan|markus|yannick|hans|ryan|thomas|daniel|oliver|george|arthur|alfie|david|mark\b|guy|sagar|rishi|madhur|injoon|hyunsu|bongjin|gookmin|minsu|alvaro|jorge|pablo|diego/,
};
const NATIVE_LOCALE = { de: "de-de", en: "en-gb", ne: "ne-np", ko: "ko-kr", es: "es-es" };

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
