// Numbers in words for German, English, Spanish, Nepali and Korean, 0 to 1,000,000.
// A number is returned as parts [{k, t, r}] – k: audio key, t: text, r: romanisation (Nepali, Korean).
// Each part has its own recorded clip, so 347 plays "three hundred and" + "forty-seven".

/* ---------- German ---------- */
const DE1 = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf",
  "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const DE10 = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
function de99(n) {
  if (n < 20) return DE1[n];
  const u = n % 10, t = Math.floor(n / 10);
  return u ? (u === 1 ? "ein" : DE1[u]) + "und" + DE10[t] : DE10[t];
}
const deH = (h) => (h === 1 ? "hundert" : DE1[h] + "hundert");
function de999(n) { const h = Math.floor(n / 100), r = n % 100; return (h ? deH(h) : "") + (r || !h ? de99(r) : ""); }
function deThousands(t) { return t === 1 ? "tausend" : de999(t).replace(/eins$/, "ein") + "tausend"; }

/* ---------- English (British: "and" after hundred) ---------- */
const EN1 = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN10 = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function en99(n) { if (n < 20) return EN1[n]; const u = n % 10, t = Math.floor(n / 10); return EN10[t] + (u ? "-" + EN1[u] : ""); }
function en999(n) { const h = Math.floor(n / 100), r = n % 100; if (!h) return en99(r); return EN1[h] + " hundred" + (r ? " and " + en99(r) : ""); }

/* ---------- Spanish ---------- */
const ES1 = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
  "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const ES10 = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const ES100 = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
function es99(n) { if (n < 30) return ES1[n]; const u = n % 10, t = Math.floor(n / 10); return ES10[t] + (u ? " y " + ES1[u] : ""); }
const esH = (h, rest) => (h === 1 && !rest ? "cien" : ES100[h]);
function es999(n) { const h = Math.floor(n / 100), r = n % 100; if (!h) return es99(r); return esH(h, r) + (r ? " " + es99(r) : ""); }
function esThousands(t) { return t === 1 ? "mil" : es999(t).replace(/uno$/, "ún").replace(/veintiún$/, "veintiún") + " mil"; }

/* ---------- Nepali (every number up to 99 has its own word; lakh = 100,000) ---------- */
const NE = ("शून्य|एक|दुई|तीन|चार|पाँच|छ|सात|आठ|नौ|दस|एघार|बाह्र|तेह्र|चौध|पन्ध्र|सोह्र|सत्र|अठार|उन्नाइस|" +
  "बीस|एक्काइस|बाइस|तेइस|चौबीस|पच्चीस|छब्बीस|सत्ताइस|अट्ठाइस|उनन्तीस|" +
  "तीस|एकतीस|बत्तीस|तेत्तीस|चौंतीस|पैंतीस|छत्तीस|सैंतीस|अठतीस|उनन्चालीस|" +
  "चालीस|एकचालीस|बयालीस|त्रिचालीस|चवालीस|पैंतालीस|छयालीस|सतचालीस|अठचालीस|उनन्पचास|" +
  "पचास|एकाउन्न|बाउन्न|त्रिपन्न|चवन्न|पचपन्न|छपन्न|सन्ताउन्न|अन्ठाउन्न|उनन्साठी|" +
  "साठी|एकसट्ठी|बयसट्ठी|त्रिसट्ठी|चौसट्ठी|पैंसट्ठी|छयसट्ठी|सतसट्ठी|अठसट्ठी|उनन्सत्तरी|" +
  "सत्तरी|एकहत्तर|बहत्तर|त्रिहत्तर|चौहत्तर|पचहत्तर|छयहत्तर|सतहत्तर|अठहत्तर|उनासी|" +
  "असी|एकासी|बयासी|त्रियासी|चौरासी|पचासी|छयासी|सतासी|अठासी|उनान्नब्बे|" +
  "नब्बे|एकान्नब्बे|बयान्नब्बे|त्रियान्नब्बे|चौरान्नब्बे|पन्चानब्बे|छयान्नब्बे|सन्तान्नब्बे|अन्ठान्नब्बे|उनान्सय").split("|");
const NE_R = ("shunya|ek|dui|tin|char|panch|chha|saat|aath|nau|das|eghaar|baahra|tehra|chaudha|pandhra|sohra|satra|athaar|unnaais|" +
  "bis|ekkaais|baais|teis|chaubis|pachchis|chhabbis|sattaais|atthaais|unantis|" +
  "tis|ektis|battis|tettis|chauntis|paintis|chhattis|saintis|athtis|unanchaalis|" +
  "chaalis|ekchaalis|bayaalis|trichaalis|chawaalis|paintaalis|chhayaalis|satchaalis|athchaalis|unanpachaas|" +
  "pachaas|ekaaunna|baaunna|tripanna|chawanna|pachpanna|chhapanna|santaaunna|anthaaunna|unansaathi|" +
  "saathi|eksatthi|bayasatthi|trisatthi|chausatthi|painsatthi|chhayasatthi|satsatthi|athsatthi|unansattari|" +
  "sattari|ekhattar|bahattar|trihattar|chauhattar|pachahattar|chhayahattar|satahattar|athahattar|unaasi|" +
  "asi|ekaasi|bayaasi|triyaasi|chauraasi|pachaasi|chhayaasi|sataasi|athaasi|unaannabbe|" +
  "nabbe|ekaannabbe|bayaannabbe|triyaannabbe|chauraannabbe|panchaanabbe|chhayaannabbe|santaannabbe|anthaannabbe|unaansaya").split("|");
const NE_DIG = "०१२३४५६७८९";
export const neDigits = (s) => String(s).replace(/[0-9]/g, (d) => NE_DIG[d]);

/* ---------- Korean (Sino-Korean numbers; 만 = 10,000) ---------- */
const KO1 = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const KO1_R = ["yeong", "il", "i", "sam", "sa", "o", "yuk", "chil", "pal", "gu"];
// Units: 1 is left out before 십, 백, 천 and 만 (십, not 일십).
function ko9999(n) {
  const out = [], rom = [];
  for (const [v, u, ur] of [[1000, "천", "cheon"], [100, "백", "baek"], [10, "십", "sip"]]) {
    const d = Math.floor(n / v) % 10;
    if (d) { out.push((d === 1 ? "" : KO1[d]) + u); rom.push((d === 1 ? "" : KO1_R[d] + "-") + ur); }
  }
  const u = n % 10;
  if (u) { out.push(KO1[u]); rom.push(KO1_R[u]); }
  return { t: out.join(""), r: rom.join("-") };
}

/* ---------- Parts ---------- */
const P = (k, t, r) => (r ? { k, t, r } : { k, t });
/** The words for n (0–1,000,000) as audio parts. */
export function numParts(n, lang) {
  if (!Number.isInteger(n) || n < 0 || n > 1e6) throw new RangeError("0–1,000,000 only");
  if (lang === "de") {
    if (n === 1e6) return [P("n1000000", "eine Million")];
    const th = Math.floor(n / 1000), rest = n % 1000, h = Math.floor(rest / 100), r = rest % 100, out = [];
    if (th) out.push(P("n" + th * 1000, deThousands(th)));
    if (h) out.push(P("n" + h * 100, deH(h)));
    if (r || !out.length) out.push(P("n" + r, de99(r)));
    return out;
  }
  if (lang === "en") {
    if (n === 1e6) return [P("n1000000", "one million")];
    const th = Math.floor(n / 1000), rest = n % 1000, h = Math.floor(rest / 100), r = rest % 100, out = [];
    if (th) out.push(P("n" + th * 1000, en999(th) + " thousand"));
    if (h) out.push(r ? P("n" + h * 100 + "a", EN1[h] + " hundred and") : P("n" + h * 100, EN1[h] + " hundred"));
    else if (th && r) out.push(P("and", "and"));
    if (r || !out.length) out.push(P("n" + r, en99(r)));
    return out;
  }
  if (lang === "es") {
    if (n === 1e6) return [P("n1000000", "un millón")];
    const th = Math.floor(n / 1000), rest = n % 1000, h = Math.floor(rest / 100), r = rest % 100, out = [];
    if (th) out.push(P("n" + th * 1000, esThousands(th)));
    if (h) out.push(P("n" + h * 100 + (h === 1 && r ? "c" : ""), esH(h, r)));
    if (r || !out.length) out.push(P("n" + r, es99(r)));
    return out;
  }
  if (lang === "ne") {
    const out = [];
    const lakh = Math.floor(n / 1e5), th = Math.floor((n % 1e5) / 1000), h = Math.floor((n % 1000) / 100), r = n % 100;
    if (lakh) out.push(P("n" + lakh * 1e5, NE[lakh] + " लाख", NE_R[lakh] + " laakh"));
    if (th) out.push(P("n" + th * 1000, NE[th] + " हजार", NE_R[th] + " hajaar"));
    if (h) out.push(P("n" + h * 100, NE[h] + " सय", NE_R[h] + " saya"));
    if (r || !out.length) out.push(P("n" + r, NE[r], NE_R[r]));
    return out;
  }
  if (lang === "ko") {
    if (n === 0) return [P("n0", "영", "yeong")];
    const out = [], man = Math.floor(n / 10000), rest = n % 10000;
    if (man) { const m = man === 1 ? { t: "", r: "" } : ko9999(man); out.push(P("n" + man * 10000, m.t + "만", (m.r ? m.r + "-" : "") + "man")); }
    const th = Math.floor(rest / 1000), r = rest % 1000, h = Math.floor(r / 100), r2 = r % 100;
    if (th) { const x = ko9999(th * 1000); out.push(P("n" + th * 1000, x.t, x.r)); }
    if (h) { const x = ko9999(h * 100); out.push(P("n" + h * 100, x.t, x.r)); }
    if (r2) { const x = ko9999(r2); out.push(P("n" + r2, x.t, x.r)); }
    return out;
  }
  throw new Error("unknown language " + lang);
}
/** Written form: German joins parts without spaces below a million; Korean puts a space after 만. */
export function numWords(n, lang) {
  const p = numParts(n, lang);
  if (lang === "de") return p.map((x) => x.t).join("");
  if (lang === "ko") return p.map((x) => x.t).join("").replace(/만(?=.)/, "만 ");
  return p.map((x) => x.t).join(" ");
}
export function numRom(n, lang) {
  const p = numParts(n, lang);
  return p.every((x) => x.r) ? p.map((x) => x.r).join(" ") : "";
}
/** Digits with the language's grouping, e.g. 1.000 (de), 1,000 (en), 1.000 (es), 10,00,000 (ne), 1,000 (ko). */
export function numDigits(n, lang) {
  if (lang === "ne") { const s = String(n); if (s.length <= 3) return s; const last = s.slice(-3), head = s.slice(0, -3); return head.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last; }
  if (n < 10000 && lang === "es") return String(n);
  const sep = lang === "de" || lang === "es" ? "." : ",";
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/* ---------- Curriculum ---------- */
/** Steps from a thousand to a million: by 1,000 to 10,000, by 10,000 to 100,000, by 100,000 to 1,000,000. */
export const STEPS = [...Array(10).keys()].map((i) => (i + 1) * 1000)
  .concat([...Array(9).keys()].map((i) => (i + 2) * 10000), [...Array(9).keys()].map((i) => (i + 2) * 100000));
export const NUM_LEVELS = [
  { id: "n1", from: 0, to: 20 },
  { id: "n2", from: 21, to: 100 },
  { id: "n3", from: 100, to: 1000 },
  { id: "n4", from: 1000, to: 1000000 },
];
/** A practice number for a level: level 4 combines a step with whole hundreds (e.g. 20,500). */
export function practiceNumber(level, rand = Math.random) {
  const L = NUM_LEVELS.find((l) => l.id === level) || NUM_LEVELS[0];
  if (L.id === "n4") {
    const s = STEPS[Math.floor(rand() * STEPS.length)];
    const extra = s < 1e6 && rand() < 0.5 ? Math.floor(rand() * 9 + 1) * 100 : 0;
    return s + extra;
  }
  return L.from + Math.floor(rand() * (L.to - L.from + 1));
}
/** Every number whose parts must be recorded: 0–1000, all steps, and every step plus whole hundreds. */
export function curriculumNumbers() {
  const s = new Set([...Array(1001).keys()]);
  for (const st of STEPS) { s.add(st); if (st < 1e6) for (let h = 1; h <= 9; h++) s.add(st + h * 100); }
  return [...s].sort((a, b) => a - b);
}
/** Unique audio parts per language, for the audio generator. */
export function numberAudioParts(lang) {
  const m = new Map();
  for (const n of curriculumNumbers()) for (const p of numParts(n, lang)) if (!m.has(p.k)) m.set(p.k, p.t);
  return [...m].map(([k, t]) => ({ key: "num/" + k, text: t }));
}
