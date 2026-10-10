// Interactive conversations (chatbot-style dialogues) and grammar topics for all five languages.
// Dialogue line: [who, de, en, es, ne, neRom, ko, koRom] – "b" = the app's character speaks, "m" = the learner answers.

const L5 = (de, en, es, ne, ko) => ({ de, en, es, ne, ko });

const RAW_DIALOGS = [
  { id: "c1", sit: "cafe", level: "b",
    title: L5("Im Café", "At the café", "En la cafetería", "क्याफेमा", "카페에서"),
    lines: [
      ["b", "Hallo! Was möchten Sie trinken?", "Hello! What would you like to drink?", "¡Hola! ¿Qué desea tomar?", "नमस्ते! तपाईं के पिउनुहुन्छ?", "namaste! tapaai ke piunuhunchha?", "안녕하세요! 뭐 드시겠어요?", "annyeonghaseyo! mwo deusigesseoyo?"],
      ["m", "Einen Kaffee, bitte.", "A coffee, please.", "Un café, por favor.", "एउटा कफी दिनुहोस्।", "euta kaphi dinuhos.", "커피 한 잔 주세요.", "keopi han jan juseyo."],
      ["b", "Mit Milch?", "With milk?", "¿Con leche?", "दूध हालेर?", "dudh haalera?", "우유 넣어 드릴까요?", "uyu neoeo deurilkkayo?"],
      ["m", "Ja, mit Milch und ohne Zucker.", "Yes, with milk and no sugar.", "Sí, con leche y sin azúcar.", "हो, दूध हालेर, चिनी बिना।", "ho, dudh haalera, chini binaa.", "네, 우유 넣고 설탕은 빼 주세요.", "ne, uyu neoko seoltangeun ppae juseyo."],
      ["b", "Möchten Sie auch etwas essen?", "Would you like something to eat too?", "¿Quiere algo de comer también?", "केही खानुहुन्छ पनि?", "kehi khaanuhunchha pani?", "드실 것도 필요하세요?", "deusil geotdo piryohaseyo?"],
      ["m", "Nein, danke. Was kostet das?", "No, thank you. How much is it?", "No, gracias. ¿Cuánto es?", "पर्दैन, धन्यवाद। कति भयो?", "pardaina, dhanyabaad. kati bhayo?", "아니요, 괜찮아요. 얼마예요?", "aniyo, gwaenchanayo. eolmayeyo?"],
      ["b", "Drei Euro fünfzig.", "Three euros fifty.", "Tres euros con cincuenta.", "तीन युरो पचास सेन्ट।", "tin yuro pachaas sent.", "삼 유로 오십 센트예요.", "sam yuro osip senteuyeyo."],
      ["m", "Hier, bitte. Danke schön!", "Here you are. Thank you very much!", "Aquí tiene. ¡Muchas gracias!", "यो लिनुहोस्। धेरै धन्यवाद!", "yo linuhos. dherai dhanyabaad!", "여기요. 감사합니다!", "yeogiyo. gamsahamnida!"],
    ] },
  { id: "c2", sit: "intro", level: "b",
    title: L5("Jemanden kennenlernen", "Meeting someone", "Conocer a alguien", "कसैलाई चिन्ने", "처음 만나기"),
    lines: [
      ["b", "Hallo, ich heiße Lena. Wie heißt du?", "Hi, I'm Lena. What's your name?", "Hola, me llamo Lena. ¿Cómo te llamas?", "नमस्ते, मेरो नाम लेना हो। तपाईंको नाम के हो?", "namaste, mero naam lenaa ho. tapaaiko naam ke ho?", "안녕하세요, 저는 레나예요. 이름이 뭐예요?", "annyeonghaseyo, jeoneun renayeyo. ireumi mwoyeyo?"],
      ["m", "Ich heiße Sam. Freut mich!", "I'm Sam. Nice to meet you!", "Me llamo Sam. ¡Mucho gusto!", "मेरो नाम साम हो। भेटेर खुसी लाग्यो!", "mero naam saam ho. bhetera khusi laagyo!", "저는 샘이에요. 반가워요!", "jeoneun saemieyo. bangawoyo!"],
      ["b", "Woher kommst du?", "Where are you from?", "¿De dónde eres?", "तपाईं कहाँबाट हुनुहुन्छ?", "tapaai kahaanbaata hunuhunchha?", "어디에서 왔어요?", "eodieseo wasseoyo?"],
      ["m", "Ich komme aus Nepal. Und du?", "I'm from Nepal. And you?", "Soy de Nepal. ¿Y tú?", "म नेपालबाट हुँ। अनि तपाईं?", "ma nepaalbaata hun. ani tapaai?", "네팔에서 왔어요. 레나 씨는요?", "nepareseo wasseoyo. rena ssineunyo?"],
      ["b", "Aus Deutschland. Was machst du hier?", "From Germany. What do you do here?", "De Alemania. ¿Qué haces aquí?", "जर्मनीबाट। तपाईं यहाँ के गर्नुहुन्छ?", "jarmanibaata. tapaai yahaan ke garnuhunchha?", "독일에서 왔어요. 여기에서 뭐 해요?", "dogireseo wasseoyo. yeogieseo mwo haeyo?"],
      ["m", "Ich arbeite hier.", "I work here.", "Trabajo aquí.", "म यहाँ काम गर्छु।", "ma yahaan kaam garchhu.", "여기에서 일해요.", "yeogieseo ilhaeyo."],
      ["b", "Toll! Bis bald!", "Great! See you soon!", "¡Qué bien! ¡Hasta pronto!", "राम्रो! फेरि भेटौंला!", "raamro! pheri bhetaunlaa!", "좋네요! 또 봐요!", "jonneyo! tto bwayo!"],
      ["m", "Tschüss, bis bald!", "Bye, see you soon!", "¡Adiós, hasta pronto!", "बिदा, फेरि भेटौंला!", "bidaa, pheri bhetaunlaa!", "안녕히 가세요, 또 봐요!", "annyeonghi gaseyo, tto bwayo!"],
    ] },
  { id: "c3", sit: "hotel", level: "b",
    title: L5("Im Hotel einchecken", "Hotel check-in", "Registro en el hotel", "होटलमा चेक-इन", "호텔 체크인"),
    lines: [
      ["b", "Guten Abend! Haben Sie eine Reservierung?", "Good evening! Do you have a reservation?", "¡Buenas noches! ¿Tiene una reserva?", "शुभ साँझ! तपाईंको बुकिङ छ?", "shubha saanjh! tapaaiko buking chha?", "안녕하세요! 예약하셨어요?", "annyeonghaseyo! yeyakhasyeosseoyo?"],
      ["m", "Ja, auf den Namen Shrestha.", "Yes, under the name Shrestha.", "Sí, a nombre de Shrestha.", "हो, श्रेष्ठको नाममा।", "ho, shreshthako naamamaa.", "네, 슈레스타 이름으로 했어요.", "ne, syuresseuta ireumeuro haesseoyo."],
      ["b", "Für wie viele Nächte?", "For how many nights?", "¿Para cuántas noches?", "कति रातका लागि?", "kati raatkaa laagi?", "며칠 묵으세요?", "myeochil mugeuseyo?"],
      ["m", "Für drei Nächte.", "For three nights.", "Para tres noches.", "तीन रातका लागि।", "tin raatkaa laagi.", "삼 박이요.", "sam bagiyo."],
      ["b", "Hier ist Ihr Schlüssel. Zimmer zweihundertzwölf.", "Here is your key. Room two hundred and twelve.", "Aquí tiene su llave. Habitación doscientos doce.", "यो तपाईंको साँचो। कोठा नम्बर दुई सय बाह्र।", "yo tapaaiko saancho. kothaa nambar dui saya baahra.", "여기 열쇠요. 이백십이 호실이에요.", "yeogi yeolsoeyo. ibaeksibi hosirieyo."],
      ["m", "Wann gibt es Frühstück?", "When is breakfast?", "¿A qué hora es el desayuno?", "बिहानको खाना कति बजे हुन्छ?", "bihaanako khaanaa kati baje hunchha?", "아침 식사는 몇 시예요?", "achim siksaneun myeot siyeyo?"],
      ["b", "Von sieben bis zehn Uhr.", "From seven to ten o'clock.", "De siete a diez.", "सात बजेदेखि दस बजेसम्म।", "saat bajedekhi das bajesamma.", "일곱 시부터 열 시까지요.", "ilgop sibuteo yeol sikkajiyo."],
      ["m", "Vielen Dank. Gute Nacht!", "Thank you very much. Good night!", "Muchas gracias. ¡Buenas noches!", "धेरै धन्यवाद। शुभ रात्री!", "dherai dhanyabaad. shubha raatri!", "감사합니다. 안녕히 주무세요!", "gamsahamnida. annyeonghi jumuseyo!"],
    ] },
  { id: "c4", sit: "directions", level: "b",
    title: L5("Nach dem Weg fragen", "Asking the way", "Preguntar el camino", "बाटो सोध्ने", "길 묻기"),
    lines: [
      ["b", "Kann ich Ihnen helfen?", "Can I help you?", "¿Le puedo ayudar?", "म तपाईंलाई सहयोग गरूँ?", "ma tapaailaai sahayog garun?", "도와 드릴까요?", "dowa deurilkkayo?"],
      ["m", "Ja, wo ist der Bahnhof?", "Yes, where is the station?", "Sí, ¿dónde está la estación?", "हो, रेल स्टेसन कहाँ छ?", "ho, rel stesan kahaan chha?", "네, 기차역이 어디예요?", "ne, gichayeogi eodiyeyo?"],
      ["b", "Gehen Sie geradeaus und dann links.", "Go straight ahead and then left.", "Siga recto y luego a la izquierda.", "सिधा जानुहोस् अनि देब्रे मोड्नुहोस्।", "sidhaa jaanuhos ani debre modnuhos.", "쭉 가서 왼쪽으로 가세요.", "jjuk gaseo oenjjogeuro gaseyo."],
      ["m", "Ist es weit?", "Is it far?", "¿Está lejos?", "टाढा छ?", "taadhaa chha?", "멀어요?", "meoreoyo?"],
      ["b", "Nein, nur fünf Minuten zu Fuß.", "No, only five minutes on foot.", "No, solo cinco minutos a pie.", "होइन, हिँडेर पाँच मिनेट मात्र।", "hoina, hindera paanch minet maatra.", "아니요, 걸어서 오 분이에요.", "aniyo, georeoseo o bunieyo."],
      ["m", "Super, vielen Dank!", "Great, thanks a lot!", "¡Genial, muchas gracias!", "राम्रो, धेरै धन्यवाद!", "raamro, dherai dhanyabaad!", "좋아요, 정말 감사합니다!", "joayo, jeongmal gamsahamnida!"],
      ["b", "Gern geschehen. Gute Reise!", "You're welcome. Have a good trip!", "De nada. ¡Buen viaje!", "केही छैन। शुभ यात्रा!", "kehi chhaina. shubha yaatraa!", "천만에요. 즐거운 여행 되세요!", "cheonmaneyo. jeulgeoun yeohaeng doeseyo!"],
      ["m", "Danke, tschüss!", "Thanks, bye!", "¡Gracias, adiós!", "धन्यवाद, बिदा!", "dhanyabaad, bidaa!", "고마워요, 안녕히 계세요!", "gomawoyo, annyeonghi gyeseyo!"],
    ] },
  { id: "c5", sit: "market", level: "b",
    title: L5("Auf dem Markt", "At the market", "En el mercado", "बजारमा", "시장에서"),
    lines: [
      ["b", "Guten Tag! Was suchen Sie?", "Hello! What are you looking for?", "¡Buenos días! ¿Qué busca?", "नमस्ते! के खोज्दै हुनुहुन्छ?", "namaste! ke khojdai hunuhunchha?", "어서 오세요! 뭘 찾으세요?", "eoseo oseyo! mwol chajeuseyo?"],
      ["m", "Ich möchte ein Kilo Äpfel.", "I'd like a kilo of apples.", "Quiero un kilo de manzanas.", "मलाई एक किलो स्याउ चाहियो।", "malaai ek kilo syaau chaahiyo.", "사과 일 킬로 주세요.", "sagwa il killo juseyo."],
      ["b", "Sonst noch etwas?", "Anything else?", "¿Algo más?", "अरू केही?", "aru kehi?", "더 필요한 거 있으세요?", "deo piryohan geo isseuseyo?"],
      ["m", "Ja, zwei Bananen, bitte.", "Yes, two bananas, please.", "Sí, dos plátanos, por favor.", "हो, दुईवटा केरा दिनुहोस्।", "ho, duiwataa keraa dinuhos.", "네, 바나나 두 개 주세요.", "ne, banana du gae juseyo."],
      ["b", "Das macht vier Euro zwanzig.", "That's four euros twenty.", "Son cuatro euros con veinte.", "जम्मा चार युरो बीस सेन्ट भयो।", "jammaa chaar yuro bis sent bhayo.", "모두 사 유로 이십 센트예요.", "modu sa yuro isip senteuyeyo."],
      ["m", "Kann ich mit Karte zahlen?", "Can I pay by card?", "¿Puedo pagar con tarjeta?", "कार्डबाट तिर्न मिल्छ?", "kaardbaata tirna milchha?", "카드로 계산해도 돼요?", "kadeuro gyesanhaedo dwaeyo?"],
      ["b", "Ja, natürlich.", "Yes, of course.", "Sí, claro.", "मिल्छ, अवश्य।", "milchha, awashya.", "네, 물론이죠.", "ne, mullonijyo."],
      ["m", "Danke, schönen Tag noch!", "Thanks, have a nice day!", "¡Gracias, que tenga un buen día!", "धन्यवाद, तपाईंको दिन शुभ रहोस्!", "dhanyabaad, tapaaiko din shubha rahos!", "감사합니다, 좋은 하루 보내세요!", "gamsahamnida, joeun haru bonaeseyo!"],
    ] },
  { id: "c6", sit: "doctor", level: "i",
    title: L5("Beim Arzt", "At the doctor's", "En el médico", "डाक्टरकहाँ", "병원에서"),
    lines: [
      ["b", "Guten Morgen. Was fehlt Ihnen?", "Good morning. What's the matter?", "Buenos días. ¿Qué le pasa?", "शुभ प्रभात। तपाईंलाई के भयो?", "shubha prabhaat. tapaailaai ke bhayo?", "안녕하세요. 어디가 아프세요?", "annyeonghaseyo. eodiga apeuseyo?"],
      ["m", "Ich habe Kopfschmerzen.", "I have a headache.", "Me duele la cabeza.", "मेरो टाउको दुखेको छ।", "mero taauko dukheko chha.", "머리가 아파요.", "meoriga apayo."],
      ["b", "Seit wann?", "Since when?", "¿Desde cuándo?", "कहिलेदेखि?", "kahiledekhi?", "언제부터요?", "eonjebuteoyo?"],
      ["m", "Seit gestern Abend.", "Since last night.", "Desde anoche.", "हिजो बेलुकादेखि।", "hijo belukaadekhi.", "어젯밤부터요.", "eojetbambuteoyo."],
      ["b", "Haben Sie Fieber?", "Do you have a fever?", "¿Tiene fiebre?", "ज्वरो आएको छ?", "jwaro aaeko chha?", "열이 있어요?", "yeori isseoyo?"],
      ["m", "Nein, kein Fieber.", "No, no fever.", "No, no tengo fiebre.", "छैन, ज्वरो छैन।", "chhaina, jwaro chhaina.", "아니요, 열은 없어요.", "aniyo, yeoreun eopseoyo."],
      ["b", "Nehmen Sie diese Tabletten und trinken Sie viel Wasser.", "Take these tablets and drink plenty of water.", "Tome estas pastillas y beba mucha agua.", "यो चक्की खानुहोस् र धेरै पानी पिउनुहोस्।", "yo chakki khaanuhos ra dherai paani piunuhos.", "이 약을 드시고 물을 많이 드세요.", "i yageul deusigo mureul mani deuseyo."],
      ["m", "Danke für Ihre Hilfe.", "Thank you for your help.", "Gracias por su ayuda.", "सहयोगका लागि धन्यवाद।", "sahayogkaa laagi dhanyabaad.", "도와주셔서 감사합니다.", "dowajusyeoseo gamsahamnida."],
    ] },
];

/** Dialogues as {id, sit, level, title, lines:[{id, who, de, en, es, ne, ko, rom:{ne, ko}}]}; line ids like c1.3 (audio key). */
export const DIALOGS = RAW_DIALOGS.map((d) => ({
  ...d,
  lines: d.lines.map(([who, de, en, es, ne, neR, ko, koR], i) => ({ id: `${d.id}.${i}`, who, de, en, es, ne, ko, rom: { ne: neR, ko: koR } })),
}));
export const DIALOG_BY = Object.fromEntries(DIALOGS.map((d) => [d.id, d]));

/**
 * Reply options for a learner turn: the right line and two lines the learner says in other dialogues
 * (never the last "thank you / goodbye" lines, which could fit anywhere).
 */
export function replyOptions(dialogId, lineIdx, rand = Math.random) {
  const d = DIALOG_BY[dialogId], right = d.lines[lineIdx];
  const pool = DIALOGS.filter((x) => x.id !== dialogId)
    .flatMap((x) => x.lines.filter((l, i) => l.who === "m" && i < x.lines.length - 1));
  const picks = [];
  while (picks.length < 2 && pool.length) picks.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  const opts = [right, ...picks];
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return opts.map((l) => l.id);
}
export const LINE_BY = Object.fromEntries(DIALOGS.flatMap((d) => d.lines.map((l) => [l.id, l])));

/* ---------- Grammar ---------- */
// table: header row + rows (in the target language); quiz kinds:
//  conj  – "subject ___ (verb)", answer from the table, wrong options from the same column
//  pairs – "base → ___", row = [base, right, wrong1, wrong2]
//  article / kopart / kocop – generated from the vocabulary
const G = [];
const add = (lang, id, title, rule, extra) => G.push({ id, lang, title, rule, ...extra });

add("de", "g_de_sein", L5("sein und haben", "sein and haben (to be, to have)", "sein y haben (ser/estar, tener)", "sein र haben (हुनु, सँग हुनु)", "sein과 haben (이다, 있다)"),
  L5("Die zwei wichtigsten Verben sind unregelmäßig – lerne sie auswendig. Die Höflichkeitsform Sie hat dieselbe Form wie sie (Plural).",
    "The two most important verbs are irregular – learn them by heart. Formal 'you' (Sie) uses the same form as 'they' (sie).",
    "Los dos verbos más importantes son irregulares: apréndelos de memoria. La forma de cortesía Sie se conjuga igual que sie (ellos).",
    "यी दुई सबैभन्दा महत्त्वपूर्ण क्रिया अनियमित छन् – कण्ठ गर्नुहोस्। आदरार्थी Sie को रूप sie (उनीहरू) जस्तै हुन्छ।",
    "가장 중요한 두 동사는 불규칙 동사예요. 외워 두세요. 존댓말 Sie는 sie(그들)와 같은 형태를 써요."),
  { quiz: "conj", table: [["", "sein", "haben"], ["ich", "bin", "habe"], ["du", "bist", "hast"], ["er/sie/es", "ist", "hat"], ["wir", "sind", "haben"], ["ihr", "seid", "habt"], ["sie/Sie", "sind", "haben"]] });
add("de", "g_de_present", L5("Präsens: regelmäßige Verben", "Present tense: regular verbs", "Presente: verbos regulares", "वर्तमान काल: नियमित क्रिया", "현재 시제: 규칙 동사"),
  L5("Stamm + Endung: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. lernen → ich lerne, du lernst.",
    "Stem + ending: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. lernen → ich lerne, du lernst.",
    "Raíz + terminación: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. lernen → ich lerne, du lernst.",
    "धातु + प्रत्यय: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en। lernen → ich lerne, du lernst।",
    "어간 + 어미: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. lernen → ich lerne, du lernst."),
  { quiz: "conj", table: [["", "lernen", "wohnen", "machen", "spielen"], ["ich", "lerne", "wohne", "mache", "spiele"], ["du", "lernst", "wohnst", "machst", "spielst"], ["er/sie/es", "lernt", "wohnt", "macht", "spielt"], ["wir", "lernen", "wohnen", "machen", "spielen"], ["ihr", "lernt", "wohnt", "macht", "spielt"], ["sie/Sie", "lernen", "wohnen", "machen", "spielen"]] });
add("de", "g_de_vowel", L5("Verben mit Vokalwechsel", "Verbs with a vowel change", "Verbos con cambio de vocal", "स्वर परिवर्तन हुने क्रिया", "모음이 바뀌는 동사"),
  L5("Bei manchen Verben ändert sich der Vokal nur bei du und er/sie/es: essen → du isst, fahren → du fährst.",
    "Some verbs change their vowel only with du and er/sie/es: essen → du isst, fahren → du fährst.",
    "Algunos verbos cambian la vocal solo con du y er/sie/es: essen → du isst, fahren → du fährst.",
    "केही क्रियामा du र er/sie/es सँग मात्र स्वर बदलिन्छ: essen → du isst, fahren → du fährst।",
    "일부 동사는 du와 er/sie/es에서만 모음이 바뀌어요: essen → du isst, fahren → du fährst."),
  { quiz: "conj", table: [["", "essen", "sprechen", "fahren", "lesen"], ["ich", "esse", "spreche", "fahre", "lese"], ["du", "isst", "sprichst", "fährst", "liest"], ["er/sie/es", "isst", "spricht", "fährt", "liest"], ["wir", "essen", "sprechen", "fahren", "lesen"], ["ihr", "esst", "sprecht", "fahrt", "lest"], ["sie/Sie", "essen", "sprechen", "fahren", "lesen"]] });
add("de", "g_de_art", L5("der, die, das", "der, die, das (gender)", "der, die, das (género)", "der, die, das (लिङ्ग)", "der, die, das (명사의 성)"),
  L5("Jedes Nomen hat ein Genus: der (maskulin), die (feminin), das (neutrum). Lerne das Wort immer mit Artikel.",
    "Every noun has a gender: der (masculine), die (feminine), das (neuter). Always learn a noun with its article.",
    "Cada sustantivo tiene género: der (masculino), die (femenino), das (neutro). Aprende siempre el sustantivo con su artículo.",
    "हरेक नामको लिङ्ग हुन्छ: der (पुलिङ्ग), die (स्त्रीलिङ्ग), das (नपुंसक)। नाम सधैं article सँगै सिक्नुहोस्।",
    "모든 명사에는 성이 있어요: der(남성), die(여성), das(중성). 명사는 항상 관사와 함께 외우세요."),
  { quiz: "article", articles: ["der", "die", "das"] });

add("es", "g_es_ser", L5("ser und estar", "ser and estar (to be)", "ser y estar", "ser र estar (हुनु)", "ser와 estar (이다/있다)"),
  L5("ser: wer oder was etwas ist (Herkunft, Beruf, Eigenschaft). estar: wo etwas ist und wie es jemandem gerade geht.",
    "ser: who or what something is (origin, job, nature). estar: where something is and how someone is right now.",
    "ser: quién o qué es algo (origen, profesión, carácter). estar: dónde está algo y cómo está alguien ahora.",
    "ser: को वा के हो (मूल, पेसा, स्वभाव)। estar: कहाँ छ र अहिले कस्तो छ।",
    "ser: 무엇인지/누구인지 (출신, 직업, 성질). estar: 어디에 있는지, 지금 상태가 어떤지."),
  { quiz: "conj", table: [["", "ser", "estar"], ["yo", "soy", "estoy"], ["tú", "eres", "estás"], ["él/ella/usted", "es", "está"], ["nosotros", "somos", "estamos"], ["vosotros", "sois", "estáis"], ["ellos/ustedes", "son", "están"]] });
add("es", "g_es_ar", L5("Verben auf -ar", "Verbs ending in -ar", "Verbos en -ar", "-ar मा अन्त्य हुने क्रिया", "-ar 동사"),
  L5("hablar → habl- + -o, -as, -a, -amos, -áis, -an. Das Subjektpronomen fällt oft weg: Hablo español.",
    "hablar → habl- + -o, -as, -a, -amos, -áis, -an. The subject pronoun is often dropped: Hablo español.",
    "hablar → habl- + -o, -as, -a, -amos, -áis, -an. El pronombre sujeto se omite a menudo: Hablo español.",
    "hablar → habl- + -o, -as, -a, -amos, -áis, -an। कर्ता सर्वनाम प्रायः छोडिन्छ: Hablo español।",
    "hablar → habl- + -o, -as, -a, -amos, -áis, -an. 주어 대명사는 자주 생략돼요: Hablo español."),
  { quiz: "conj", table: [["", "hablar", "trabajar", "estudiar"], ["yo", "hablo", "trabajo", "estudio"], ["tú", "hablas", "trabajas", "estudias"], ["él/ella/usted", "habla", "trabaja", "estudia"], ["nosotros", "hablamos", "trabajamos", "estudiamos"], ["vosotros", "habláis", "trabajáis", "estudiáis"], ["ellos/ustedes", "hablan", "trabajan", "estudian"]] });
add("es", "g_es_er", L5("Verben auf -er und -ir", "Verbs ending in -er and -ir", "Verbos en -er e -ir", "-er र -ir मा अन्त्य हुने क्रिया", "-er, -ir 동사"),
  L5("-er: -o, -es, -e, -emos, -éis, -en (comer). -ir: gleich, aber -imos, -ís (vivir → vivimos).",
    "-er: -o, -es, -e, -emos, -éis, -en (comer). -ir: the same, but -imos, -ís (vivir → vivimos).",
    "-er: -o, -es, -e, -emos, -éis, -en (comer). -ir: igual, pero -imos, -ís (vivir → vivimos).",
    "-er: -o, -es, -e, -emos, -éis, -en (comer)। -ir: उस्तै, तर -imos, -ís (vivir → vivimos)।",
    "-er: -o, -es, -e, -emos, -éis, -en (comer). -ir: 같지만 -imos, -ís (vivir → vivimos)."),
  { quiz: "conj", table: [["", "comer", "beber", "vivir", "escribir"], ["yo", "como", "bebo", "vivo", "escribo"], ["tú", "comes", "bebes", "vives", "escribes"], ["él/ella/usted", "come", "bebe", "vive", "escribe"], ["nosotros", "comemos", "bebemos", "vivimos", "escribimos"], ["vosotros", "coméis", "bebéis", "vivís", "escribís"], ["ellos/ustedes", "comen", "beben", "viven", "escriben"]] });
add("es", "g_es_art", L5("el oder la", "el or la (gender)", "el o la (género)", "el वा la (लिङ्ग)", "el 또는 la (명사의 성)"),
  L5("Nomen sind maskulin (el) oder feminin (la). Oft: -o maskulin, -a feminin – aber el día, la mano, el agua.",
    "Nouns are masculine (el) or feminine (la). Often -o is masculine and -a feminine – but el día, la mano, el agua.",
    "Los sustantivos son masculinos (el) o femeninos (la). A menudo -o es masculino y -a femenino, pero el día, la mano, el agua.",
    "नाम पुलिङ्ग (el) वा स्त्रीलिङ्ग (la) हुन्छन्। प्रायः -o पुलिङ्ग, -a स्त्रीलिङ्ग – तर el día, la mano, el agua।",
    "명사는 남성(el) 또는 여성(la)이에요. 보통 -o는 남성, -a는 여성이지만 el día, la mano, el agua 같은 예외도 있어요."),
  { quiz: "article", articles: ["el", "la"] });

add("en", "g_en_be", L5("to be und to have", "to be and to have", "to be y to have", "to be र to have", "to be와 to have"),
  L5("I am, you are, he/she/it is, we/they are. To have: I/you/we/they have, he/she/it has.",
    "I am, you are, he/she/it is, we/they are. To have: I/you/we/they have, he/she/it has.",
    "I am, you are, he/she/it is, we/they are. To have: I/you/we/they have, he/she/it has.",
    "I am, you are, he/she/it is, we/they are। To have: I/you/we/they have, he/she/it has।",
    "I am, you are, he/she/it is, we/they are. to have: I/you/we/they have, he/she/it has."),
  { quiz: "conj", table: [["", "to be", "to have"], ["I", "am", "have"], ["you", "are", "have"], ["he/she/it", "is", "has"], ["we", "are", "have"], ["they", "are", "have"]] });
add("en", "g_en_present", L5("Simple Present: -s bei he/she/it", "Present simple: -s with he/she/it", "Presente simple: -s con he/she/it", "Present simple: he/she/it मा -s", "현재 시제: he/she/it에 -s"),
  L5("Nur he/she/it bekommt -s: I work, she works. Nach -ch, -sh, -o: -es (watches, goes). Konsonant + y → -ies (studies).",
    "Only he/she/it adds -s: I work, she works. After -ch, -sh, -o: -es (watches, goes). Consonant + y → -ies (studies).",
    "Solo he/she/it añade -s: I work, she works. Tras -ch, -sh, -o: -es (watches, goes). Consonante + y → -ies (studies).",
    "he/she/it मा मात्र -s लाग्छ: I work, she works। -ch, -sh, -o पछि: -es (watches, goes)। व्यञ्जन + y → -ies (studies)।",
    "he/she/it에만 -s가 붙어요: I work, she works. -ch, -sh, -o 뒤에는 -es (watches, goes), 자음 + y → -ies (studies)."),
  { quiz: "conj", table: [["", "to work", "to go", "to watch", "to study"], ["I", "work", "go", "watch", "study"], ["you", "work", "go", "watch", "study"], ["he/she/it", "works", "goes", "watches", "studies"], ["we", "work", "go", "watch", "study"], ["they", "work", "go", "watch", "study"]] });
add("en", "g_en_past", L5("Unregelmäßige Vergangenheit", "Irregular past simple", "Pasado simple irregular", "अनियमित भूतकाल", "불규칙 과거형"),
  L5("Regelmäßig: -ed (worked). Viele häufige Verben sind unregelmäßig – lerne sie als Paar: go → went.",
    "Regular verbs add -ed (worked). Many common verbs are irregular – learn them as pairs: go → went.",
    "Los regulares añaden -ed (worked). Muchos verbos frecuentes son irregulares: apréndelos en pares: go → went.",
    "नियमित क्रियामा -ed लाग्छ (worked)। धेरै प्रचलित क्रिया अनियमित छन् – जोडीमा सिक्नुहोस्: go → went।",
    "규칙 동사는 -ed를 붙여요 (worked). 자주 쓰는 동사는 불규칙이 많으니 짝으로 외우세요: go → went."),
  { quiz: "pairs", table: [["verb", "past", "", ""], ["go", "went", "goed", "gone"], ["eat", "ate", "eated", "eaten"], ["see", "saw", "seed", "seen"], ["buy", "bought", "buyed", "brought"], ["take", "took", "taked", "taken"], ["come", "came", "comed", "come"], ["write", "wrote", "writed", "written"], ["drink", "drank", "drinked", "drunk"]] });

add("ne", "g_ne_hunu", L5("हुनु – sein", "हुनु – to be (हो)", "हुनु – ser", "हुनु – हो", "हुनु – 이다"),
  L5("Für Identität: म … हुँ, तिमी … हौ, ऊ … हो, हामी … हौं, तपाईं … हुनुहुन्छ (höflich).",
    "For identity: म … हुँ, तिमी … हौ, ऊ … हो, हामी … हौं, तपाईं … हुनुहुन्छ (polite).",
    "Para la identidad: म … हुँ, तिमी … हौ, ऊ … हो, हामी … हौं, तपाईं … हुनुहुन्छ (cortés).",
    "पहिचानका लागि: म … हुँ, तिमी … हौ, ऊ … हो, हामी … हौं, तपाईं … हुनुहुन्छ (आदरार्थी)।",
    "정체를 말할 때: म … हुँ, तिमी … हौ, ऊ … हो, हामी … हौं, तपाईं … हुनुहुन्छ (존댓말)."),
  { quiz: "conj", rom: { "म": "ma", "तिमी": "timi", "ऊ": "u", "हामी": "haami", "तपाईं": "tapaai", "हुँ": "hun", "हौ": "hau", "हो": "ho", "हौं": "haun", "हुनुहुन्छ": "hunuhunchha" },
    table: [["", "हुनु"], ["म", "हुँ"], ["तिमी", "हौ"], ["ऊ", "हो"], ["हामी", "हौं"], ["तपाईं", "हुनुहुन्छ"]] });
add("ne", "g_ne_present", L5("Präsens (Gewohnheit)", "Present tense (habitual)", "Presente (habitual)", "सामान्य वर्तमान काल", "현재 시제 (습관)"),
  L5("Verbstamm + Endung: म -छु, तिमी -छौ, ऊ -छ, हामी -छौं, तपाईं -नुहुन्छ. गर्नु → म गर्छु.",
    "Verb stem + ending: म -छु, तिमी -छौ, ऊ -छ, हामी -छौं, तपाईं -नुहुन्छ. गर्नु → म गर्छु.",
    "Raíz + terminación: म -छु, तिमी -छौ, ऊ -छ, हामी -छौं, तपाईं -नुहुन्छ. गर्नु → म गर्छु.",
    "धातु + प्रत्यय: म -छु, तिमी -छौ, ऊ -छ, हामी -छौं, तपाईं -नुहुन्छ। गर्नु → म गर्छु।",
    "어간 + 어미: म -छु, तिमी -छौ, ऊ -छ, हामी -छौं, तपाईं -नुहुन्छ. गर्नु → म गर्छु."),
  { quiz: "conj", rom: { "म": "ma", "तिमी": "timi", "ऊ": "u", "हामी": "haami", "तपाईं": "tapaai",
      "गर्नु": "garnu", "गर्छु": "garchhu", "गर्छौ": "garchhau", "गर्छ": "garchha", "गर्छौं": "garchhaun", "गर्नुहुन्छ": "garnuhunchha",
      "खानु": "khaanu", "खान्छु": "khaanchhu", "खान्छौ": "khaanchhau", "खान्छ": "khaanchha", "खान्छौं": "khaanchhaun", "खानुहुन्छ": "khaanuhunchha",
      "जानु": "jaanu", "जान्छु": "jaanchhu", "जान्छौ": "jaanchhau", "जान्छ": "jaanchha", "जान्छौं": "jaanchhaun", "जानुहुन्छ": "jaanuhunchha",
      "बोल्नु": "bolnu", "बोल्छु": "bolchhu", "बोल्छौ": "bolchhau", "बोल्छ": "bolchha", "बोल्छौं": "bolchhaun", "बोल्नुहुन्छ": "bolnuhunchha" },
    table: [["", "गर्नु", "खानु", "जानु", "बोल्नु"], ["म", "गर्छु", "खान्छु", "जान्छु", "बोल्छु"], ["तिमी", "गर्छौ", "खान्छौ", "जान्छौ", "बोल्छौ"], ["ऊ", "गर्छ", "खान्छ", "जान्छ", "बोल्छ"], ["हामी", "गर्छौं", "खान्छौं", "जान्छौं", "बोल्छौं"], ["तपाईं", "गर्नुहुन्छ", "खानुहुन्छ", "जानुहुन्छ", "बोल्नुहुन्छ"]] });

add("ko", "g_ko_yo", L5("Höfliches Präsens -아요/-어요", "Polite present -아요/-어요", "Presente cortés -아요/-어요", "विनम्र वर्तमान -아요/-어요", "해요체 현재형 -아요/-어요"),
  L5("Stamm mit ㅏ/ㅗ → -아요 (가다 → 가요), sonst -어요 (먹다 → 먹어요), 하다 → 해요.",
    "Stem with ㅏ/ㅗ → -아요 (가다 → 가요), otherwise -어요 (먹다 → 먹어요), 하다 → 해요.",
    "Raíz con ㅏ/ㅗ → -아요 (가다 → 가요); si no, -어요 (먹다 → 먹어요); 하다 → 해요.",
    "धातुमा ㅏ/ㅗ भए -아요 (가다 → 가요), अरूमा -어요 (먹다 → 먹어요), 하다 → 해요।",
    "어간 모음이 ㅏ/ㅗ면 -아요 (가다 → 가요), 아니면 -어요 (먹다 → 먹어요), 하다 → 해요."),
  { quiz: "pairs", rom: { "가다": "gada", "가요": "gayo", "오다": "oda", "와요": "wayo", "먹다": "meokda", "먹어요": "meogeoyo", "마시다": "masida", "마셔요": "masyeoyo",
      "하다": "hada", "해요": "haeyo", "보다": "boda", "봐요": "bwayo", "읽다": "ikda", "읽어요": "ilgeoyo", "살다": "salda", "살아요": "sarayo", "공부하다": "gongbuhada", "공부해요": "gongbuhaeyo", "좋아하다": "joahada", "좋아해요": "joahaeyo" },
    table: [["기본형", "해요체", "", ""], ["가다", "가요", "가어요", "가해요"], ["오다", "와요", "오어요", "오해요"], ["먹다", "먹어요", "먹아요", "먹해요"], ["마시다", "마셔요", "마시아요", "마해요"],
      ["하다", "해요", "하아요", "하어요"], ["보다", "봐요", "보어요", "봐어요"], ["읽다", "읽어요", "읽아요", "읽해요"], ["살다", "살아요", "살어요", "사해요"],
      ["공부하다", "공부해요", "공부하아요", "공부어요"], ["좋아하다", "좋아해요", "좋아하어요", "좋아요해요"]] });
add("ko", "g_ko_cop", L5("이에요 / 예요", "이에요 / 예요 (to be)", "이에요 / 예요 (ser)", "이에요 / 예요 (हो)", "이에요 / 예요"),
  L5("Nach einem Konsonanten (Batchim) -이에요, nach einem Vokal -예요: 책이에요, 의자예요.",
    "After a final consonant (batchim) use -이에요, after a vowel -예요: 책이에요, 의자예요.",
    "Tras consonante final (batchim) -이에요, tras vocal -예요: 책이에요, 의자예요.",
    "अन्तिम व्यञ्जन (batchim) पछि -이에요, स्वर पछि -예요: 책이에요, 의자예요।",
    "받침이 있으면 -이에요, 없으면 -예요: 책이에요, 의자예요."),
  { quiz: "kocop" });
add("ko", "g_ko_part", L5("Partikeln 은/는, 이/가, 을/를", "Particles 은/는, 이/가, 을/를", "Partículas 은/는, 이/가, 을/를", "निपात 은/는, 이/가, 을/를", "조사 은/는, 이/가, 을/를"),
  L5("Thema 은/는, Subjekt 이/가, Objekt 을/를. Die erste Form nach einem Konsonanten, die zweite nach einem Vokal.",
    "Topic 은/는, subject 이/가, object 을/를. Use the first form after a consonant, the second after a vowel.",
    "Tema 은/는, sujeto 이/가, objeto 을/를. La primera forma tras consonante, la segunda tras vocal.",
    "विषय 은/는, कर्ता 이/가, कर्म 을/를। व्यञ्जन पछि पहिलो रूप, स्वर पछि दोस्रो रूप।",
    "주제 은/는, 주어 이/가, 목적어 을/를. 받침이 있으면 앞의 것, 없으면 뒤의 것을 써요."),
  { quiz: "kopart" });

export const GRAMMAR = G;
export const GRAMMAR_BY = Object.fromEntries(G.map((g) => [g.id, g]));

/* ---------- Grammar exercise generation ---------- */
/** Does a Hangul syllable end in a consonant (batchim)? */
export function hasBatchim(word) {
  const c = String(word).trim().slice(-1).charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}
const shuffle = (a, rand) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nounsFor = (items, lang) => items.filter((i) => i.kind === "word" && /^(der|die|das) /.test(i.de || "") && i[lang]);

/**
 * Questions for a grammar topic: [{q, a, o:[options], say, key?, rom?}].
 * q contains "___" where the answer goes; say is the full phrase to speak afterwards.
 */
export function grammarQuiz(topic, items, n = 8, rand = Math.random) {
  const out = [];
  if (topic.quiz === "conj") {
    const [head, ...rows] = topic.table;
    const cells = [];
    for (let c = 1; c < head.length; c++) for (const r of rows) cells.push([r, c]);
    for (const [r, c] of shuffle(cells, rand).slice(0, n)) {
      const col = rows.map((x) => x[c]), a = r[c];
      const wrong = shuffle([...new Set(col.filter((x) => x !== a))], rand).slice(0, 3);
      out.push({ q: `${r[0]} ___ (${head[c]})`, a, o: shuffle([a, ...wrong], rand), say: `${r[0]} ${a}`, key: `${topic.id}.${rows.indexOf(r)}.${c}` });
    }
  } else if (topic.quiz === "pairs") {
    const rows = topic.table.slice(1);
    for (const r of shuffle(rows, rand).slice(0, n)) out.push({ q: `${r[0]} → ___`, a: r[1], o: shuffle(r.slice(1), rand), say: r[1], key: `${topic.id}.${topic.table.indexOf(r)}` });
  } else if (topic.quiz === "article") {
    const lang = topic.lang, re = new RegExp(`^(${topic.articles.join("|")}) (.+)$`);
    const pool = items.filter((i) => i.kind === "word" && re.test(i[lang] || ""));
    for (const it of shuffle(pool, rand).slice(0, n)) {
      const [, art, noun] = it[lang].match(re);
      out.push({ q: `___ ${noun}`, a: art, o: topic.articles.slice(), say: it[lang], key: it.id, item: it.id });
    }
  } else if (topic.quiz === "kocop") {
    for (const it of shuffle(nounsFor(items, "ko").filter((i) => !/\s/.test(i.ko)), rand).slice(0, n)) {
      const a = hasBatchim(it.ko) ? "이에요" : "예요";
      out.push({ q: `${it.ko}___`, a, o: ["이에요", "예요"], say: it.ko + a, item: it.id });
    }
  } else if (topic.quiz === "kopart") {
    const sets = [["은", "는"], ["이", "가"], ["을", "를"]];
    shuffle(nounsFor(items, "ko").filter((i) => !/\s/.test(i.ko)), rand).slice(0, n).forEach((it, k) => {
      const s = sets[k % 3], a = hasBatchim(it.ko) ? s[0] : s[1];
      out.push({ q: `${it.ko}___`, a, o: s.slice(), say: it.ko + a, item: it.id });
    });
  }
  return out;
}
/** Phrases from conjugation and pair tables that get recorded audio: {key, text}. */
export function grammarAudioJobs(lang) {
  const jobs = [];
  for (const g of G.filter((x) => x.lang === lang && x.table)) {
    const [head, ...rows] = g.table;
    if (g.quiz === "conj") rows.forEach((r, i) => { for (let c = 1; c < head.length; c++) jobs.push({ key: `${g.id}.${i}.${c}`, text: `${r[0]} ${r[c]}` }); });
    if (g.quiz === "pairs") rows.forEach((r, i) => jobs.push({ key: `${g.id}.${i + 1}`, text: r[1] }));
  }
  return jobs;
}
