// Learning content: words, travel phrases and phrases of the day.
// Word rows: [id, topic, level(b|i|a), de, en, ne, romanised ne, example de, example en, example ne, note?]
// Edit here, then run `npm run audio` (or the "Generate audio" workflow) to refresh native audio.
export const RAW = [
["g1","greet","b","Hallo","Hello","नमस्ते","namaste","Hallo, wie geht's?","Hello, how are you?","नमस्ते, तपाईंलाई कस्तो छ?"],
["g2","greet","b","Danke","Thank you","धन्यवाद","dhanyabād","Danke für das Essen.","Thank you for the food.","खानाको लागि धन्यवाद।"],
["g3","greet","b","Bitte","Please","कृपया","kripayā","Bitte setzen Sie sich.","Please sit down.","कृपया बस्नुहोस्।"],
["g4","greet","b","Ja","Yes","हो","ho","Ja, gern.","Yes, gladly.","हो, खुसीसाथ।"],
["g5","greet","b","Nein","No","होइन","hoina","Nein, danke.","No, thank you.","होइन, धन्यवाद।"],
["g6","greet","b","Entschuldigung","Excuse me","माफ गर्नुहोस्","māph garnuhos","Entschuldigung, wo ist der Bahnhof?","Excuse me, where is the station?","माफ गर्नुहोस्, स्टेसन कहाँ छ?"],
["g7","greet","b","Auf Wiedersehen","Goodbye","फेरि भेटौँला","pheri bheṭauṁlā","Auf Wiedersehen und bis bald!","Goodbye and see you soon!","फेरि भेटौँला, चाँडै भेटौँ!"],
["g8","greet","b","Guten Morgen","Good morning","शुभ प्रभात","shubha prabhāt","Guten Morgen, Frau Weber.","Good morning, Mrs Weber.","शुभ प्रभात, वेबर जी।"],
["n1","numbers","b","eins","one","एक","ek","Ein Tee, bitte.","One tea, please.","एक कप चिया, कृपया।"],
["n2","numbers","b","zwei","two","दुई","dui","Zwei Kaffee, bitte.","Two coffees, please.","दुई कप कफी, कृपया।"],
["n3","numbers","b","drei","three","तीन","tin","Ich habe drei Kinder.","I have three children.","मेरा तीन जना बच्चा छन्।"],
["n4","numbers","b","vier","four","चार","chār","Es ist vier Uhr.","It is four o'clock.","चार बज्यो।"],
["n5","numbers","b","fünf","five","पाँच","pā̃ch","Fünf Minuten, bitte.","Five minutes, please.","पाँच मिनेट, कृपया।"],
["n6","numbers","b","zehn","ten","दश","das","Das kostet zehn Euro.","That costs ten euros.","यसको मूल्य दश युरो हो।"],
["f1","family","b","die Mutter","mother","आमा","āmā","Meine Mutter kocht gern.","My mother likes to cook.","मेरी आमालाई खाना पकाउन मन पर्छ।"],
["f2","family","b","der Vater","father","बुबा","bubā","Mein Vater arbeitet in Kathmandu.","My father works in Kathmandu.","मेरो बुबा काठमाडौँमा काम गर्नुहुन्छ।"],
["f3","family","b","der Bruder","brother","दाजु","dāju","Mein Bruder ist älter als ich.","My brother is older than me.","मेरो दाजु मभन्दा जेठो हुनुहुन्छ।",{en:"Nepali uses two words: दाजु (dāju) for an elder brother and भाइ (bhāi) for a younger brother.",de:"Nepali hat zwei Wörter: दाजु (dāju) für den älteren und भाइ (bhāi) für den jüngeren Bruder.",ne:"दाजु = जेठो, भाइ = कान्छो।"}],
["f4","family","b","die Schwester","sister","दिदी","didi","Meine Schwester studiert.","My sister is studying.","मेरी दिदी पढ्दै हुनुहुन्छ।",{en:"Nepali uses दिदी (didi) for an elder sister and बहिनी (bahini) for a younger sister.",de:"Nepali: दिदी (didi) = ältere, बहिनी (bahini) = jüngere Schwester.",ne:"दिदी = जेठी, बहिनी = कान्छी।"}],
["f5","family","b","die Familie","family","परिवार","parivār","Meine Familie ist groß.","My family is big.","मेरो परिवार ठूलो छ।"],
["f6","family","b","das Kind","child","बच्चा","bachchā","Das Kind spielt.","The child is playing.","बच्चा खेल्दैछ।"],
["d1","food","b","das Wasser","water","पानी","pāni","Ein Glas Wasser, bitte.","A glass of water, please.","एक गिलास पानी, कृपया।"],
["d2","food","b","der Reis","rice","भात","bhāt","Wir essen Reis mit Linsen.","We eat rice with lentils.","हामी दाल भात खान्छौँ।",{en:"भात is cooked rice; uncooked rice is चामल (chāmal).",de:"भात ist gekochter Reis; roher Reis heißt चामल (chāmal).",ne:"पकाएको = भात, नपकाएको = चामल।"}],
["d3","food","b","das Brot","bread","रोटी","roṭi","Das Brot ist frisch.","The bread is fresh.","रोटी ताजा छ।"],
["d4","food","b","der Tee","tea","चिया","chiyā","Möchtest du Tee?","Would you like tea?","चिया खानुहुन्छ?",{en:"In Nepali you 'eat' tea: चिया खानु (chiyā khānu).",de:"Auf Nepali „isst“ man Tee: चिया खानु (chiyā khānu).",ne:"चिया खानु भनिन्छ।"}],
["d5","food","b","die Milch","milk","दूध","dudh","Kaffee mit Milch, bitte.","Coffee with milk, please.","दूध हालेको कफी, कृपया।"],
["d6","food","b","das Essen","food","खाना","khānā","Das Essen ist lecker.","The food is tasty.","खाना मीठो छ।"],
["h1","home","b","das Haus","house","घर","ghar","Unser Haus ist klein.","Our house is small.","हाम्रो घर सानो छ।"],
["h2","home","b","das Buch","book","किताब","kitāb","Ich lese ein Buch.","I am reading a book.","म किताब पढ्दैछु।"],
["h3","home","b","die Tür","door","ढोका","ḍhokā","Bitte mach die Tür zu.","Please close the door.","कृपया ढोका बन्द गर।"],
["v1","verbs","b","essen","to eat","खानु","khānu","Wir essen um sieben.","We eat at seven.","हामी सात बजे खान्छौँ।"],
["v2","verbs","b","trinken","to drink","पिउनु","piunu","Ich trinke viel Wasser.","I drink a lot of water.","म धेरै पानी पिउँछु।"],
["v3","verbs","b","gehen","to go","जानु","jānu","Ich gehe nach Hause.","I am going home.","म घर जाँदैछु।"],
["v4","verbs","b","kommen","to come","आउनु","āunu","Woher kommst du?","Where do you come from?","तिमी कहाँबाट आएको?"],
["v5","verbs","b","sprechen","to speak","बोल्नु","bolnu","Sprechen Sie Englisch?","Do you speak English?","तपाईं अंग्रेजी बोल्नुहुन्छ?"],
["v6","verbs","b","verstehen","to understand","बुझ्नु","bujhnu","Ich verstehe nicht.","I don't understand.","मैले बुझिनँ।"],
["t1","time","b","heute","today","आज","āja","Heute ist es warm.","It is warm today.","आज गर्मी छ।"],
["t2","time","b","morgen","tomorrow","भोलि","bholi","Bis morgen!","See you tomorrow!","भोलि भेटौँला!"],
["t3","time","b","gestern","yesterday","हिजो","hijo","Gestern war ich müde.","Yesterday I was tired.","हिजो म थाकेको थिएँ।"],
["r1","directions","b","links","left","बायाँ","bāyā̃","Gehen Sie nach links.","Go left.","बायाँतिर जानुहोस्।"],
["r2","directions","b","rechts","right","दायाँ","dāyā̃","Das Hotel ist rechts.","The hotel is on the right.","होटल दायाँतिर छ।"],
["r3","directions","b","geradeaus","straight ahead","सिधा","sidhā","Immer geradeaus.","Keep going straight ahead.","सिधा जानुहोस्।"],
["s1","shopping","b","teuer","expensive","महँगो","mahãgo","Das ist zu teuer.","That is too expensive.","यो धेरै महँगो भयो।"],
["s2","shopping","b","billig","cheap","सस्तो","sasto","Das Hemd ist billig.","The shirt is cheap.","सर्ट सस्तो छ।"],
["s3","shopping","b","Wie viel?","How much?","कति?","kati?","Wie viel kostet das?","How much does this cost?","यसको कति हो?"],
["w1","work","i","die Arbeit","work","काम","kām","Ich habe heute viel Arbeit.","I have a lot of work today.","आज मसँग धेरै काम छ।"],
["w2","work","i","der Kollege","colleague","सहकर्मी","sahakarmi","Mein Kollege hilft mir.","My colleague helps me.","मेरो सहकर्मीले मलाई मद्दत गर्छन्।"],
["w3","work","i","die Besprechung","meeting","बैठक","baiṭhak","Die Besprechung beginnt um zehn.","The meeting starts at ten.","बैठक दश बजे सुरु हुन्छ।"],
["w4","work","i","die Nachricht","message","सन्देश","sandesh","Ich schicke dir eine Nachricht.","I'll send you a message.","म तिमीलाई सन्देश पठाउँछु।"],
["w5","work","i","die Rechnung","bill","बिल","bil","Die Rechnung, bitte.","The bill, please.","बिल दिनुहोस्।"],
["w6","work","i","pünktlich","on time","समयमै","samayamai","Bitte sei pünktlich.","Please be on time.","कृपया समयमै आउनू।"],
["w7","work","i","die Erfahrung","experience","अनुभव","anubhav","Sie hat viel Erfahrung.","She has a lot of experience.","उहाँसँग धेरै अनुभव छ।"],
["w8","work","i","die Gelegenheit","opportunity","अवसर","avasar","Das ist eine gute Gelegenheit.","That is a good opportunity.","यो राम्रो अवसर हो।"],
["w9","work","i","sich erinnern","to remember","सम्झनु","samjhanu","Ich erinnere mich an dich.","I remember you.","म तिमीलाई सम्झन्छु।"],
["a1","abstract","a","die Verantwortung","responsibility","जिम्मेवारी","jimmevāri","Er übernimmt die Verantwortung.","He takes responsibility.","उहाँ जिम्मेवारी लिनुहुन्छ।"],
["a2","abstract","a","die Herausforderung","challenge","चुनौती","chunauti","Das ist eine große Herausforderung.","That is a big challenge.","यो ठूलो चुनौती हो।"],
["a3","abstract","a","die Voraussetzung","prerequisite","पूर्वशर्त","pūrvashart","Deutschkenntnisse sind eine Voraussetzung.","Knowledge of German is a prerequisite.","जर्मन भाषाको ज्ञान पूर्वशर्त हो।"],
["a4","abstract","a","die Vereinbarung","agreement","सम्झौता","samjhautā","Wir haben eine Vereinbarung getroffen.","We reached an agreement.","हामीले सम्झौता गर्यौँ।"],
["a5","abstract","a","die Entwicklung","development","विकास","vikās","Die Entwicklung dauert zwei Jahre.","The development takes two years.","विकासमा दुई वर्ष लाग्छ।"],
["a6","abstract","a","die Nachhaltigkeit","sustainability","दिगोपन","digopan","Nachhaltigkeit ist uns wichtig.","Sustainability is important to us.","दिगोपन हाम्रो लागि महत्त्वपूर्ण छ।"]
];

// Phrase of the day (advanced): [id, de, en, ne, romanised ne, usage note]
export const PHR = [
["p1","Ich drücke dir die Daumen.","I'll keep my fingers crossed for you.","तिम्रो लागि शुभकामना!","timro lāgi shubhakāmanā!",{en:"Wishing someone luck before an exam or interview.",de:"Jemandem vor einer Prüfung oder einem Gespräch Glück wünschen.",ne:"परीक्षा वा अन्तर्वार्ताअघि शुभकामना दिँदा।"}],
["p2","Alles in Butter.","Everything's fine.","सबै ठीक छ।","sabai ṭhik cha.",{en:"Casual. Reassures someone that things are going well.",de:"Umgangssprachlich: Alles läuft gut.",ne:"अनौपचारिक: सबै राम्रो चलिरहेको छ।"}],
["p3","Ich verstehe nur Bahnhof.","It's all Greek to me.","मैले केही बुझिनँ।","maile kehi bujhinã.",{en:"Informal. You don't understand anything that was said.",de:"Informell: Man versteht gar nichts.",ne:"अनौपचारिक: केही पनि नबुझ्दा।"}],
["p4","Das ist nicht mein Bier.","That's not my business.","त्यो मेरो काम होइन।","tyo mero kām hoina.",{en:"Informal. Something is not your responsibility.",de:"Informell: Dafür bin ich nicht zuständig.",ne:"अनौपचारिक: त्यो आफ्नो जिम्मा होइन।"}],
["p5","Auf jeden Fall.","Definitely.","पक्कै पनि।","pakkai pani.",{en:"Strong agreement. Works in formal and casual speech.",de:"Starke Zustimmung, formell und informell.",ne:"पूर्ण सहमति जनाउन।"}]
];

// Travel phrases: [id, situation, de, en, ne, romanised ne]
export const TRV = [
["x1","airport","Wo ist der Check-in-Schalter?","Where is the check-in counter?","चेक-इन काउन्टर कहाँ छ?","chek-in kāunṭar kahā̃ cha?"],
["x2","airport","Mein Koffer ist nicht angekommen.","My suitcase did not arrive.","मेरो सुटकेस आइपुगेन।","mero suṭkes āipugena."],
["x3","immigration","Ich bin als Tourist hier.","I am here as a tourist.","म पर्यटकको रूपमा आएको हुँ।","ma paryaṭakko rūpmā āeko hũ."],
["x4","hotel","Ich habe eine Reservierung.","I have a reservation.","मेरो बुकिङ छ।","mero bukiṅ cha."],
["x5","hotel","Wann gibt es Frühstück?","When is breakfast?","बिहानको खाजा कति बजे हो?","bihānako khājā kati baje ho?"],
["x6","restaurant","Die Speisekarte, bitte.","The menu, please.","मेनु दिनुहोस्।","menu dinuhos."],
["x7","restaurant","Ich bin Vegetarier.","I am vegetarian.","म शाकाहारी हुँ।","ma shākāhāri hũ."],
["x8","restaurant","Nicht zu scharf, bitte.","Not too spicy, please.","धेरै पिरो नबनाउनुहोस्।","dherai piro nabanāunuhos."],
["x9","transport","Wann fährt der nächste Bus?","When does the next bus leave?","अर्को बस कति बजे छुट्छ?","arko bas kati baje chuṭcha?"],
["x10","transport","Bitte bringen Sie mich zu dieser Adresse.","Please take me to this address.","मलाई यो ठेगानामा लैजानुहोस्।","malāi yo ṭhegānāmā laijānuhos."],
["x11","transport","Eine Fahrkarte nach Pokhara, bitte.","One ticket to Pokhara, please.","पोखराको एउटा टिकट दिनुहोस्।","pokharāko euṭā ṭikaṭ dinuhos."],
["x12","directions","Wo ist die Toilette?","Where is the toilet?","शौचालय कहाँ छ?","shauchālaya kahā̃ cha?"],
["x13","directions","Ist es weit von hier?","Is it far from here?","यहाँबाट टाढा छ?","yahā̃bāṭa ṭāḍhā cha?"],
["x14","money","Kann ich mit Karte zahlen?","Can I pay by card?","कार्डबाट तिर्न सकिन्छ?","kārḍbāṭa tirna sakincha?"],
["x15","money","Geht es etwas günstiger?","Can you make it a bit cheaper?","अलि घटाउन मिल्छ?","ali ghaṭāuna milcha?"],
["x16","emergency","Hilfe!","Help!","बचाउ!","bachāu!"],
["x17","emergency","Rufen Sie einen Krankenwagen!","Call an ambulance!","एम्बुलेन्स बोलाउनुहोस्!","embulens bolāunuhos!"],
["x18","emergency","Ich brauche einen Arzt.","I need a doctor.","मलाई डाक्टर चाहियो।","malāi ḍākṭar chāhiyo."],
["x19","emergency","Ich habe meinen Pass verloren.","I have lost my passport.","मेरो राहदानी हरायो।","mero rāhadāni harāyo."],
["x20","phone","Gibt es hier WLAN?","Is there Wi-Fi here?","यहाँ वाइफाइ छ?","yahā̃ wāiphāi cha?"],
["x21","social","Ich heiße Anna.","My name is Anna.","मेरो नाम अन्ना हो।","mero nām annā ho."],
["x22","social","Freut mich!","Nice to meet you!","तपाईंलाई भेटेर खुसी लाग्यो!","tapāī̃lāi bheṭera khusi lāgyo!"]
];

export const ITEMS = RAW.map(r=>({id:r[0],topic:r[1],level:r[2],de:r[3],en:r[4],ne:r[5],rom:r[6],ex:{de:r[7],en:r[8],ne:r[9]},note:r[10]||null,kind:"word"}))
  .concat(TRV.map(r=>({id:r[0],topic:"travel",sit:r[1],level:"b",de:r[2],en:r[3],ne:r[4],rom:r[5],ex:null,note:null,kind:"travel"})))
  .concat(PHR.map(r=>({id:r[0],topic:"phrase",level:"a",de:r[1],en:r[2],ne:r[3],rom:r[4],ex:null,note:r[5],kind:"phrase"})));
export const BY = Object.fromEntries(ITEMS.map(i=>[i.id,i]));
export const WORDS = ITEMS.filter(i=>i.kind==="word");
