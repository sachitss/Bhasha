// Bhasha app: UI, state, audio and recording. Pure logic lives in core.js.
import { ITEMS, BY, WORDS, ALL_PHR, ALL_TRV, READ, READ_BY } from "./content.js";
import { S } from "./i18n.js";
import {
  DAY, LEVEL_RANK as lvlRank, applyGrade, itemState, nextInterval, formatInterval, planNumbers as planCore,
  buildSession as buildCore, coreWord, envelope, speechStats, expectedDuration, scoreRecording,
  voiceScore, isHighQualityVoice, hash, dayKey as todayKey, streakFrom, newProgress,
  normPrio, SKILLS, TASK_SKILL, FOCUS_PRESETS, tokens, shuffledOrder, answerOk, usesWord, overlapScore, passiveDeck, lockTimes
} from "./core.js";

/* ---------- State ---------- */
const KEY="bhasha.v1";
const DEF={profile:{name:"",ui:"en",known:"en",target:"de",level:"b",minutes:20,prio:{...FOCUS_PRESETS.balanced},rom:true,gender:"f",onboarded:false},
  prog:{},favs:[],act:{},refDur:{},voice:{},session:null,nb:{},custom:{},reads:{},passive:{lock:false,perDay:6,from:8,to:21,audio:false}};
let D;
try{D=JSON.parse(localStorage.getItem(KEY))||null}catch(e){D=null}
if(!D){D=JSON.parse(JSON.stringify(DEF))}
// Existing learners (progress but no onboarding flag) skip the first-run questions.
const hadData=!!(D.prog&&Object.keys(D.prog).length), hadOb=!!(D.profile&&("onboarded" in D.profile));
D.profile=Object.assign({},DEF.profile,D.profile||{}); D.prog=D.prog||{}; D.favs=D.favs||[]; D.act=D.act||{}; D.refDur=D.refDur||{}; D.voice=D.voice||{};
D.nb=D.nb||{}; D.custom=D.custom||{}; D.reads=D.reads||{}; D.passive=Object.assign({},DEF.passive,D.passive||{});
D.profile.prio=normPrio(D.profile.prio);
if(hadData&&!hadOb)D.profile.onboarded=true;
// First visit: interface follows the device language when it is one of ours.
try{if(!localStorage.getItem(KEY)){const nl=(navigator.language||"en").slice(0,2); if(["de","ne","ko","es"].includes(nl)){D.profile.ui=nl; D.profile.known=nl; D.profile.target=nl==="de"?"ne":(nl==="ko"||nl==="es")?"en":"de"}}}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
const P=()=>D.profile;
const t=(k,v)=>{let s=(S[P().ui]&&S[P().ui][k])??S.en[k]??k; if(v)for(const x in v)s=s.replace("{"+x+"}",v[x]); return s};
const LANGS=["de","en","ne","ko","es"];
const LOCALE={de:"de-DE",en:"en-GB",ne:"ne-NP",ko:"ko-KR",es:"es-ES"};
const UI_NAME={de:"Deutsch",en:"English",ne:"नेपाली",ko:"한국어",es:"Español"};
const ROM_LANGS=["ne","ko"]; // scripts shown with optional romanisation
const romOf=(it,l)=>ROM_LANGS.includes(l)&&P().rom&&it.rom&&it.rom[l]?it.rom[l]:"";
const knownText=it=>it[P().known]||it.mean||"";
const noteOf=it=>{const n=it.kind==="phrase"?it.note:(it.notes&&it.notes[P().target]); return n?(n[P().ui]||n.en):""};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const prog=()=>(D.prog[P().target]=D.prog[P().target]||{});
const act=()=>(D.act[todayKey()]=D.act[todayKey()]||{min:0,xp:0,ok:0,n:0});

/* ---------- Native bridge (Capacitor app) ---------- */
const CAP=window.Capacitor;
const isNative=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform())||!!window.__TAURI_INTERNALS__;
const isMobileApp=!!(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform());
const isAndroid=isMobileApp&&CAP.getPlatform&&CAP.getPlatform()==="android";
const capCache={};
function capPlugin(name){
  if(name in capCache)return capCache[name];
  let p=null;
  try{ if(isMobileApp&&CAP.isPluginAvailable&&CAP.isPluginAvailable(name)) p=(CAP.Plugins&&CAP.Plugins[name])||CAP.registerPlugin(name); }catch(e){p=null}
  return capCache[name]=p;
}

/* ---------- Active notebook and own words ---------- */
// Notebook entries for built-in words: D.nb[lang][id] = {m: meaning, s: my sentence, y: synonyms, n: notes, at}
// Own words: D.custom[lang] = [{id, w, m, mk (language of m), s, y, n, at}] – they join the review cycle like any word.
function customFor(lang=P().target){
  return (D.custom[lang]||[]).map(c=>{const it={id:c.id,kind:"custom",topic:"notebook",level:"b",[lang]:c.w,mean:c.m,[c.mk]:c.m,
    ex:c.s?{[lang]:c.s}:null,rom:{},notes:{}}; BY[c.id]=it; return it});
}
const allItems=()=>ITEMS.concat(customFor());
const customRec=id=>(D.custom[P().target]||[]).find(c=>c.id===id);
function nbGet(id){const c=customRec(id); if(c)return c; return (D.nb[P().target]||{})[id]||null}
function nbSet(id,patch){const c=customRec(id); if(c){Object.assign(c,patch);persist();return}
  const nb=D.nb[P().target]=D.nb[P().target]||{}; nb[id]=Object.assign(nb[id]||{at:Date.now()},patch); persist()}
function nbList(){const tl=P().target; const ids=Object.keys(D.nb[tl]||{}).filter(id=>BY[id]); return customFor(tl).map(i=>i.id).concat(ids)}
function dictUrl(it,l){const core=coreWord(it[l]||""); const w=encodeURIComponent(core);
  return {en:`https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(core.toLowerCase().replace(/\s+/g,"-"))}`,
    de:`https://www.duden.de/suchen/dudenonline/${w}`,es:`https://dle.rae.es/${w}`,ko:`https://korean.dict.naver.com/koendict/#/search?query=${w}`,
    ne:`https://en.wiktionary.org/wiki/${w}`}[l]}
function nextReadId(){const tl=P().target, done=D.reads[tl]||{};
  const pool=READ.filter(r=>lvlRank[r.level]<=lvlRank[P().level]); if(!pool.length)return null;
  const fresh=pool.find(r=>!done[r.id]); if(fresh)return fresh.id;
  return pool.slice().sort((a,b)=>done[a.id].at-done[b.id].at)[0].id}

/* ---------- Learning engine wrappers ---------- */
function stateOf(id){return itemState(prog()[id])}
function grade(id,g){const pr=prog(); pr[id]=applyGrade(pr[id]||newProgress(),g); persist()}
function ago(ts){const n=Math.floor((Date.now()-ts)/DAY); return n<=0?t("today"):n===1?t("yesterday"):t("daysAgo",{n})}
function nextIn(ts){const d=(ts-Date.now())/DAY; return d<=0?t("today"):formatInterval(d)}
function wotd(){const pool=WORDS.filter(w=>lvlRank[w.level]<=lvlRank[P().level]); return pool[hash(todayKey()+P().target)%pool.length]}
function potd(){return BY[ALL_PHR[hash(todayKey())%ALL_PHR.length][0]]}
const streak=()=>streakFrom(D.act);
function recentAcc(){let ok=0,n=0;const d=new Date();for(let i=0;i<7;i++){const a=D.act[todayKey(d)];if(a){ok+=a.ok;n+=a.n}d.setDate(d.getDate()-1)} return n?ok/n:null}
const goalXP=()=>P().minutes*8;
function dueItems(){customFor(); const pr=prog(),now=Date.now();return Object.keys(pr).filter(id=>BY[id]&&pr[id].seen&&pr[id].due<=now).sort((a,b)=>(pr[b].lapseAt||0)-(pr[a].lapseAt||0)||pr[a].due-pr[b].due)}
function planNumbers(){const due=dueItems(); return Object.assign(planCore({minutes:P().minutes,prio:P().prio,dueCount:due.length,accuracy:recentAcc()}),{due})}
function buildSession(mode){const items=allItems(); return buildCore({items,words:customFor().concat(WORDS),prog:prog(),profile:P(),wotdId:wotd().id,dueIds:dueItems(),accuracy:recentAcc(),mode,readId:nextReadId()})}
const deck=(n=24)=>passiveDeck({items:allItems(),prog:prog(),profile:P(),wotdId:wotd().id,n});

/* ---------- Audio: generated native recordings first, device voice as fallback ---------- */
// web/audio/index.json is written by the audio generators (scripts/generate-audio.mjs for Azure,
// scripts/generate-audio-piper.py for Piper): { voices, labels: {"de-f": "Kerstin"}, files: {"de-f": ["g1","g1.ex", ...]} }
let AUDIO={voices:{},labels:{},files:{}};
fetch("audio/index.json",{cache:"no-cache"}).then(r=>r.ok?r.json():null).then(j=>{if(j){AUDIO={voices:j.voices||{},labels:j.labels||{},files:Object.fromEntries(Object.entries(j.files||{}).map(([k,v])=>[k,new Set(v)]))}; if(route==="speak"||sheet)render()}}).catch(()=>{});
const hasAudio=(lang,g,key)=>!!(AUDIO.files[lang+"-"+g]&&AUDIO.files[lang+"-"+g].has(key));
function audioUrl(lang,key){const g=P().gender||"f", other=g==="f"?"m":"f";
  if(hasAudio(lang,g,key))return `audio/${lang}-${g}/${key}.mp3`;
  if(hasAudio(lang,other,key))return `audio/${lang}-${other}/${key}.mp3`;
  return null}
const nativeVoiceName=lang=>{const slot=lang+"-"+(P().gender||"f"); const n=AUDIO.labels[slot]||AUDIO.voices[slot]; return n&&AUDIO.files[slot]&&AUDIO.files[slot].size?n.replace(/^[a-z]{2}-[A-Z]{2}-/,"").replace(/Neural$/,""):null};
// Android/iOS app: the web view has no speech synthesis, so the device's own speech engine is used through a plugin.
const NativeTTS=()=>capPlugin("TextToSpeech");
let player=null;
const TTS={voices:[],warned:{},
  load(){try{this.voices=speechSynthesis.getVoices()||[]}catch(e){this.voices=[]}},
  score(v,lang){return voiceScore(v,lang,P().gender||"f")},
  ranked(lang){this.load(); return this.voices.map(v=>[v,this.score(v,lang)]).filter(x=>x[1]>=0).sort((a,b)=>b[1]-a[1])},
  pick(lang){const r=this.ranked(lang); const want=D.voice[lang]; if(want){const v=r.find(x=>x[0].voiceURI===want); if(v)return v[0]} return r.length?r[0][0]:null},
  quality(v,lang){return isHighQualityVoice(v,lang,P().gender||"f")},
  stop(){try{speechSynthesis.cancel()}catch(e){} const nt=NativeTTS(); if(nt)nt.stop().catch(()=>{}); if(player){player.pause();player=null}},
  /** key: item id, or id+".ex" for the example sentence. Uses generated native audio when present. */
  speak(text,lang,rate=1,key){
    this.stop();
    const url=key&&audioUrl(lang,key);
    if(url){const a=new Audio(url); player=a; a.preservesPitch=true; a.playbackRate=rate;
      a.onloadedmetadata=()=>{if(rate===1&&isFinite(a.duration)&&!key.endsWith(".ex")){D.refDur[key+":"+lang]=Math.max(0.2,a.duration-0.25);persist()}};
      a.play().catch(()=>this.device(text,lang,rate,key)); return}
    this.device(text,lang,rate,key);
  },
  device(text,lang,rate,key){
    const nt=NativeTTS();
    if(nt){nt.stop().catch(()=>{}); nt.speak({text,lang:LOCALE[lang],rate,pitch:1,volume:1,category:"playback"}).catch(()=>toast(t("noVoice",{lang:t("lang_"+lang)}))); return}
    if(!("speechSynthesis" in window)){toast(t("noVoice",{lang:t("lang_"+lang)}));return}
    this.load(); const v=this.pick(lang);
    if(!v&&this.voices.length){toast(t("noVoice",{lang:t("lang_"+lang)}));}
    if(v&&lang==="ne"&&!v.lang.toLowerCase().startsWith("ne")&&!this.warned.hi){this.warned.hi=1;toast(t("hiFallback"))}
    const u=new SpeechSynthesisUtterance(text); u.lang=v?v.lang:LOCALE[lang]; if(v)u.voice=v; u.rate=rate;
    let t0=0; u.onstart=()=>{t0=performance.now()}; u.onend=()=>{if(key&&rate===1&&t0&&!D.refDur[key+":"+lang]){D.refDur[key+":"+lang]=(performance.now()-t0)/1000;persist()}};
    speechSynthesis.speak(u);
  }};
try{speechSynthesis.onvoiceschanged=()=>{TTS.load(); if(sheet&&document.querySelector("[data-voice]"))openSheet(profileSheet())};TTS.load()}catch(e){}

/* ---------- Recording + analysis ---------- */
const REC={stream:null,mr:null,chunks:[],on:false,micBlocked:false,hist:{}};
async function startRec(id){
  try{
    if(!navigator.mediaDevices||!window.MediaRecorder)throw new Error("unsupported");
    REC.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
    REC.chunks=[]; REC.mr=new MediaRecorder(REC.stream);
    REC.mr.ondataavailable=e=>{if(e.data.size)REC.chunks.push(e.data)};
    REC.mr.onstop=()=>{REC.stream.getTracks().forEach(tr=>tr.stop()); const blob=new Blob(REC.chunks,{type:REC.mr.mimeType||"audio/webm"}); handleBlob(id,blob)};
    REC.mr.start(); REC.on=true; rerenderRec(id);
    setTimeout(()=>{if(REC.on&&REC.mr&&REC.mr.state==="recording")stopRec(id)},10000);
  }catch(e){REC.micBlocked=true; rerenderRec(id)}
}
function stopRec(id){if(REC.mr&&REC.mr.state==="recording")REC.mr.stop(); REC.on=false; rerenderRec(id)}
async function handleBlob(id,blob){
  const url=URL.createObjectURL(blob); let an=null;
  try{an=await analyse(blob,id)}catch(e){an=null}
  const h=REC.hist[id]=REC.hist[id]||[]; h.unshift({url,an,at:Date.now()}); if(h.length>3){URL.revokeObjectURL(h.pop().url)}
  if(an){const pr=prog(); const p=pr[id]||(pr[id]=newProgress()); p.pron=(p.pron||[]).concat(an.score).slice(-10); addXP(5,null); persist()}
  rerenderRec(id);
}
function expectedDur(id){const tl=P().target, it=BY[id]; return D.refDur[id+":"+tl]||expectedDuration(it[tl],it.rom&&it.rom[tl]||null)}
async function analyse(blob,id){
  const buf=await blob.arrayBuffer(); const AC=window.AudioContext||window.webkitAudioContext; const ctx=new AC();
  const audio=await new Promise((res,rej)=>{const p=ctx.decodeAudioData(buf,res,rej); if(p&&p.then)p.then(res,rej)}); ctx.close&&ctx.close();
  const {env,peak}=envelope(audio.getChannelData(0),audio.sampleRate);
  const {first,last,dur,pauses}=speechStats(env);
  const exp=expectedDur(id), words=(BY[id][P().target]||"").trim().split(/\s+/).length;
  const sc=scoreRecording({dur,expected:exp,peak,pauses,words});
  return Object.assign({dur,exp,pauses,peak,env:env.slice(Math.max(0,first-10),Math.max(first,last)+10)},sc);
}
function drawWave(canvas,env,exp){
  if(!canvas)return; const cs=getComputedStyle(document.documentElement);
  const dpr=window.devicePixelRatio||1, w=canvas.clientWidth, h=canvas.clientHeight; canvas.width=w*dpr; canvas.height=h*dpr;
  const c=canvas.getContext("2d"); c.scale(dpr,dpr); c.clearRect(0,0,w,h);
  if(!env||!env.length)return; const mx=Math.max(...env,1e-6), total=Math.max(env.length*0.02,exp+0.4), bw=w/(total/0.02);
  c.fillStyle=cs.getPropertyValue("--brand").trim();
  env.forEach((v,i)=>{const bh=Math.max(1.5,(v/mx)*(h-16)); c.fillRect(i*bw,(h-bh)/2,Math.max(1,bw-0.6),bh)});
  const x=(10*0.02+exp)/total*w; c.strokeStyle=cs.getPropertyValue("--accent").trim(); c.setLineDash([4,4]); c.lineWidth=2; c.beginPath(); c.moveTo(x,4); c.lineTo(x,h-4); c.stroke();
}

/* ---------- XP / activity ---------- */
let sessionClock=Date.now();
function addXP(x,ok,skill){const a=act(); a.xp+=x; if(ok!==null&&ok!==undefined){a.n++; if(ok)a.ok++;
    if(skill){a.sk=a.sk||{}; const k=a.sk[skill]||(a.sk[skill]={ok:0,n:0}); k.n++; if(ok)k.ok++}}
  const now=Date.now(); a.min+=Math.min(2,(now-sessionClock)/60000); sessionClock=now; persist()}

/* ---------- Rendering helpers ---------- */
const ICON={
 home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
 learn:'<rect x="3" y="6" width="13" height="14" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/>',
 words:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
 speak:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 travel:'<path d="M2 16l20-6-3-3-7 2-5-5-2 1 3 6-4 1-2-2-1 1z"/>',
 progress:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 play:'<path d="M7 5l12 7-12 7z"/>',slow:'<path d="M7 5l12 7-12 7z"/><path d="M3 5v14"/>',
 star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>',
 book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 read:'<path d="M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3z"/><path d="M21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z"/>'};
const ic=(n)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const STSYM={new:"○",learning:"◔",familiar:"◑",mastered:"●",review:"↻"};
const pill=s=>`<span class="pill ${s}"><span aria-hidden="true">${STSYM[s]}</span>${t("st_"+s)}</span>`;
function target(item,size=""){
  const tl=P().target, g=tl==="de"&&item.kind==="word"?(item.de.match(/^(der|die|das)\s/)||[])[1]:null;
  return `<div><span class="word ${size}" lang="${tl}">${esc(item[tl])}</span>${g?`<span class="gender">${g==="der"?"m":g==="die"?"f":"n"}</span>`:""}${romOf(item,tl)?`<div class="rom">${esc(romOf(item,tl))}</div>`:""}</div>`;
}
const known=item=>esc(knownText(item));
const listenBtns=(id,text)=>`<div class="row"><button class="btn sm" data-a="say" data-id="${id}">${ic("play")}${t("listen")}</button><button class="btn sm" data-a="say" data-id="${id}" data-rate="0.6">${ic("slow")}${t("slow")}</button>${text?"":""}</div>`;
function favBtn(id){const on=D.favs.includes(id);return `<button class="btn sm" data-a="fav" data-id="${id}" aria-pressed="${on}">${ic("star")}${on?t("saved"):t("save")}</button>`}

/* ---------- Powered-by footer (lower right, every page) ---------- */
function poweredBy(){return `<footer class="powered" aria-label="${t("poweredBy")}">
  <span class="pb-label">${t("poweredBy")}</span>
  <span class="pb-logo"><img src="icons/team-nepal-solutions.png" alt="Team Nepal Solutions" width="377" height="159" loading="lazy" decoding="async"></span>
  <span class="pb-meta">© Ing.-Büro Sachit Shrestha · <a href="mailto:support@medtec24.com">support@medtec24.com</a></span>
</footer>`}

/* ---------- Views ---------- */
let route="home", ui={filter:"all",q:"",sit:"all",speakId:null,resetArm:false,sess:null};
function render(){
  document.documentElement.lang=P().ui;
  const tabs=["home","learn","words","speak","travel","progress"];
  document.getElementById("tabs").innerHTML=tabs.map(r=>`<button class="tab" data-a="go" data-r="${r}" ${route===r||(route==="session"&&r==="learn")?'aria-current="page"':""}>${ic(r)}<span>${t(r)}</span></button>`).join("");
  document.getElementById("pairBtn").innerHTML=`<span>${t("lang_"+P().known)} → ${t("lang_"+P().target)}</span><span class="av">${esc((P().name||"·").slice(0,1).toUpperCase())}</span>`;
  const m=document.getElementById("main");
  m.innerHTML=({home:vHome,learn:vLearn,session:vSession,words:vWords,speak:vSpeak,travel:vTravel,progress:vProgress})[route]()+poweredBy();
  afterRender();
}
function afterRender(){document.querySelectorAll("canvas.wave").forEach(c=>{const h=(REC.hist[c.dataset.id]||[])[0]; if(h&&h.an)drawWave(c,h.an.env,h.an.exp)})}

function planCard(){
  const {nNew,nDue,nPron,n,due}=planNumbers(); const resumable=D.session&&D.session.i<D.session.tasks.length;
  const a=act(), g=goalXP(), pct=Math.min(1,a.xp/g), C=2*Math.PI*26;
  return `<section class="card stack" aria-labelledby="planH">
   <div class="row between"><div><div class="eyebrow">${t("plan")} · ${P().minutes} ${t("min")}</div><h2 id="planH" class="word md" style="font-size:22px">${t("lvl_"+P().level)} · ${t("lang_"+P().target)}</h2></div>
   <svg class="ring" viewBox="0 0 64 64" role="img" aria-label="${t("goal")}: ${a.xp} / ${g} XP"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--surface-2)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C*pct} ${C}" transform="rotate(-90 32 32)"/><text x="32" y="36" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${Math.round(pct*100)}%</text></svg></div>
   <div class="plan-grid">
    <div class="plan-item"><b>${Math.min(due.length,nDue)}</b><span class="small muted">${t("due")}</span></div>
    <div class="plan-item"><b>${nNew}</b><span class="small muted">${t("newW")}</span></div>
    <div class="plan-item"><b>${nPron}</b><span class="small muted">${t("pronT")}</span></div>
   </div>
   ${resumable?`<button class="btn primary block" data-a="resume">${t("resume")} · ${D.session.i}/${D.session.tasks.length}</button>`:`<button class="btn primary block" data-a="startSession">${t("start")}</button>`}
  </section>`;
}
function vHome(){
  const w=wotd(), p=potd(), a=act();
  const phr=P().level==="a"?`<section class="card stack" aria-labelledby="potdH"><div class="eyebrow" id="potdH">${t("potd")}</div>${target(p,"md")}<p>${known(p)}</p><p class="note">${esc(noteOf(p))}</p><div class="row">${listenBtns(p.id)}${favBtn(p.id)}<button class="btn sm" data-a="speakItem" data-id="${p.id}">${ic("mic")}${t("practice")}</button></div></section>`:"";
  return `
  <div class="stats">
   <div class="stat"><b>${streak()}</b><span>${t("streak")}</span></div>
   <div class="stat"><b>${a.xp}</b><span>${t("xp")}</span></div>
   <div class="stat"><b>${dueItems().length}</b><span>${t("due")}</span></div>
  </div>
  ${planCard()}
  <section class="card wotd stack" aria-labelledby="wotdH">
   <div class="row between"><div class="eyebrow" id="wotdH">${t("wotd")}</div>${pill(stateOf(w.id))}</div>
   ${target(w)}
   <p style="font-size:18px">${known(w)}</p>
   <div class="ex"><div class="t" lang="${P().target}">${esc(w.ex[P().target])}</div><div class="small muted">${esc(w.ex[P().known])}</div></div>
   ${noteOf(w)?`<p class="note">${esc(noteOf(w))}</p>`:""}
   <div class="row">${listenBtns(w.id)}${favBtn(w.id)}<button class="btn sm" data-a="speakItem" data-id="${w.id}">${ic("mic")}${t("practice")}</button></div>
  </section>
  ${phr}
  <section class="card stack"><div class="eyebrow">${t("rec")}</div><p>${recommendation()}</p></section>
  <section class="card stack" aria-labelledby="glH"><div class="row between"><div><div class="eyebrow" id="glH">${t("passive")}</div><b>${t("glance")}</b><p class="small muted">${t("glanceSub")}</p></div><button class="btn gold" data-a="glance">${ic("eye")}${t("glanceStart")}</button></div>
   ${isMobileApp?`<p class="small muted">${D.passive.lock?"🔒 "+t("lockScheduled",{n:D.passive.perDay*2}):t("lockWordsSub")}</p><button class="btn sm" data-a="profile">${t("lockWords")}</button>`:""}</section>`;
}
function recommendation(){
  const due=dueItems().length; const pr=prog(); const prs=Object.values(pr).flatMap(p=>p.pron||[]);
  const avg=prs.length?prs.reduce((a,b)=>a+b,0)/prs.length:null;
  if(due>0)return t("recDue",{n:due}); if(avg!==null&&avg<55)return t("recPron"); return t("recNew");
}
function vLearn(){
  const topics=[...new Set(WORDS.map(w=>w.topic))];
  return planCard()+`<section class="stack"><div class="eyebrow">${t("words")}</div><div class="list">${topics.map(tp=>{
    const ws=WORDS.filter(w=>w.topic===tp), started=ws.filter(w=>stateOf(w.id)!=="new").length;
    return `<button class="li" data-a="topic" data-t="${tp}"><div class="main"><b>${t("t_"+tp)}</b><div class="sub">${ws.slice(0,3).map(w=>esc(w[P().target])).join(" · ")}</div></div><span class="small muted" style="font-variant-numeric:tabular-nums">${started}/${ws.length}</span><span class="pill new">${t("lvl_"+ws[0].level)}</span></button>`}).join("")}</div></section>
  <section class="stack"><div class="eyebrow">${ic("read")} ${t("readTexts")}</div><div class="list">${READ.map(r=>{const d=(D.reads[P().target]||{})[r.id];
    return `<button class="li" data-a="readOpen" data-r="${r.id}"><div class="main"><b lang="${P().target}">${esc(r.title[P().target])}</b><div class="sub">${esc(r.title[P().known])}</div></div>${d?`<span class="small muted">✓ ${d.c}/${d.n}</span>`:""}<span class="pill new">${t("lvl_"+r.level)}</span></button>`}).join("")}</div></section>
  ${methodsBox()}`;
}
function methodsBox(){
  return `<details class="card methods"><summary><b>${t("methods")}</b></summary><ul>${["mVocab","mListen","mRead","mSpeak","mWrite","mContext","mWide","mNotebook","mRecall"].map(k=>`<li>${t(k)}</li>`).join("")}</ul></details>`;
}

/* ---- Session ---- */
function startSession(mode){D.session={tasks:buildSession(mode),i:0,ok:0,xp:0,mode:mode||"daily"}; ui.sess={}; sessionClock=Date.now(); persist(); route="session"; render(); document.getElementById("main").focus()}
function distractors(item,k=3){
  const tl=P().target; let pool=ITEMS.filter(i=>i.id!==item.id&&i.kind===item.kind&&i[tl]&&i[tl]!==item[tl]);
  if(pool.length<k)pool=WORDS.filter(i=>i.id!==item.id&&i[tl]!==item[tl]);
  const same=pool.filter(i=>i.topic===item.topic); const src=(same.length>=k?same:pool).slice().sort(()=>Math.random()-0.5);
  return src.slice(0,k);
}
function shuffle(a){a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a}
// Exercises that need data an own word may not have fall back to recall.
function fixType(task,item){const tl=P().target, kn=P().known, ex=item&&item.ex;
  if(task.type==="translate"&&!(ex&&ex[tl]&&ex[kn]))return "reverse";
  if((task.type==="write"||task.type==="order"||task.type==="fill")&&!(ex&&ex[tl]))return "reverse";
  return task.type}
const nextBtn=()=>`<button class="btn primary block" data-a="nextTask">${t("next")}</button>`;
function sentenceBox(item,label){const tl=P().target; return `<div class="ex">${label?`<div class="eyebrow">${label}</div>`:""}<div class="t" lang="${tl}">${esc(item.ex[tl])}</div>${item.ex[P().known]?`<div class="small muted">${esc(item.ex[P().known])}</div>`:""}<button class="btn sm" style="margin-top:6px" data-a="sayEx" data-id="${item.id}">${ic("play")}${t("listen")}</button></div>`}
function vSession(){
  const s=D.session; if(!s)return vHome();
  const graded=s.tasks.reduce((n,x)=>n+(x.type==="read"?(READ_BY[x.rid]?READ_BY[x.rid].q.length:0):x.type==="match"?x.ids.length:["study","pron"].includes(x.type)?0:1),0);
  if(s.i>=s.tasks.length){
    return `<section class="card stack" style="text-align:center;align-items:center;padding-block:32px"><div class="eyebrow">${t("done")}</div>
     <div class="score">${s.ok}/${graded}</div>
     <p class="muted">${t("sessionSummary",{c:s.ok,n:graded,x:s.xp})}</p>
     <p>${recommendation()}</p>
     <div class="row" style="justify-content:center"><button class="btn primary" data-a="finish">${t("backHome")}</button><button class="btn" data-a="go" data-r="progress">${t("progress")}</button></div></section>`;
  }
  const task=s.tasks[s.i], st=ui.sess||(ui.sess={}), tl=P().target, kn=P().known;
  const item=task.id?BY[task.id]:null;
  const head=`<div class="row between"><button class="btn sm" data-a="pauseSession">${t("pauseExit")}</button><span class="small muted" style="font-variant-numeric:tabular-nums">${s.i+1} / ${s.tasks.length}</span></div>
   <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${s.tasks.length}" aria-valuenow="${s.i}"><i style="width:${s.i/s.tasks.length*100}%"></i></div>`;
  if(task.id&&(!item||!item[tl]))return head+`<section class="card task">${nextBtn()}</section>`;
  const type=item?fixType(task,item):task.type;
  const p=item&&prog()[item.id]; const whyTxt=task.why==="whyDue"&&p?t("whyDue",{d:ago(p.last||p.seen)}):t(task.why);
  const skillLbl=t("sk_"+(TASK_SKILL[type]||"vocab"));
  let body="";
  if(type==="study"){
    body=`${target(item)}<p style="font-size:19px">${known(item)}</p>${listenBtns(item.id)}
      ${item.ex&&item.ex[tl]?`<div class="ex"><div class="t" lang="${tl}">${esc(item.ex[tl])}</div>${item.ex[kn]?`<div class="small muted">${esc(item.ex[kn])}</div>`:""}</div>`:""}
      ${item.kind!=="phrase"&&noteOf(item)?`<p class="note">${esc(noteOf(item))}</p>`:""}
      <div style="margin-top:auto" class="stack"><p class="small muted">${t("recog")}</p>${gradeBtns(item.id)}</div>`;
  }
  if(type==="reverse"){
    body=`<p class="muted">${t("recall",{lang:t("lang_"+tl)})}</p><div class="word">${known(item)}</div>
      ${st.shown?`<div class="card" style="background:var(--surface-2);border:0">${target(item,"md")}<div style="margin-top:8px">${listenBtns(item.id)}</div></div><div style="margin-top:auto">${gradeBtns(item.id)}</div>`:`<button class="btn primary block" style="margin-top:auto" data-a="reveal">${t("show")}</button>`}`;
  }
  if(type==="type"||type==="dictation"){
    const ans=st.answered;
    const prompt=type==="type"?`<p class="muted">${t("recall",{lang:t("lang_"+tl)})}</p><div class="word">${known(item)}</div>`
      :`<p class="muted">${t("dictation")}</p><div class="row"><button class="btn gold" data-a="say" data-id="${item.id}">${ic("play")}${t("listen")}</button><button class="btn" data-a="say" data-id="${item.id}" data-rate="0.6">${ic("slow")}${t("slow")}</button></div>${ROM_LANGS.includes(tl)?`<p class="small muted">${t("dictationRom")}</p>`:""}`;
    body=`${prompt}<label class="sr" for="typeIn">${t("type")}</label><input id="typeIn" class="input" lang="${tl}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${t("type")}" ${ans?"disabled":""} value="${esc(st.typed||"")}">
     ${ans?feedback(st.ok,item)+nextBtn():`<div class="row"><button class="btn primary" data-a="checkType">${t("check")}</button><button class="btn" data-a="dontKnow">${t("dontKnow")}</button></div>`}`;
  }
  if(type==="mcq"||type==="audio"||type==="fill"){
    if(!st.opts){st.opts=distractors(item).concat(item).sort(()=>Math.random()-0.5).map(i=>i.id); st.t0=Date.now()}
    let prompt="";
    if(type==="mcq")prompt=`<p class="muted">${t("chooseT")}</p><div class="word">${known(item)}</div>`;
    if(type==="audio")prompt=`<p class="muted">${t("hear")}</p><div class="row"><button class="btn gold" data-a="say" data-id="${item.id}">${ic("play")}${t("listen")}</button><button class="btn" data-a="say" data-id="${item.id}" data-rate="0.6">${ic("slow")}${t("slow")}</button></div>`;
    if(type==="fill"){const core=coreWord(item[tl]); const re=new RegExp(core.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i"); prompt=`<p class="muted">${t("fill")}</p><div class="word md" lang="${tl}">${esc(item.ex[tl].replace(re,"_____"))}</div>${item.ex[kn]?`<p class="small muted">${esc(item.ex[kn])}</p>`:""}`}
    body=prompt+`<div class="opts">${st.opts.map(id=>{const o=BY[id]; let cls=""; if(st.answered){if(id===item.id)cls="ok"; else if(id===st.pick)cls="no"}
      const lab=type==="fill"?coreWord(o[tl]):o[tl];
      return `<button class="opt ${cls}" data-a="pick" data-id="${id}" ${st.answered?"disabled":""} lang="${tl}">${esc(lab)}${romOf(o,tl)?`<div class="rom">${esc(romOf(o,tl))}</div>`:""}</button>`}).join("")}</div>
      ${st.answered?feedback(st.ok,item)+nextBtn():""}`;
  }
  if(type==="order"){
    const toks=tokens(item.ex[tl]);
    if(!st.perm){st.perm=shuffledOrder(toks.length); st.ans=[]}
    const pool=st.perm.filter(i=>!st.ans.includes(i));
    body=`<p class="muted">${t("order")}</p>${item.ex[kn]?`<p class="small muted">${esc(item.ex[kn])}</p>`:""}
     <div class="order-ans" aria-live="polite">${st.ans.map(i=>`<button class="tok" data-a="oans" data-i="${i}" ${st.answered?"disabled":""} lang="${tl}">${esc(toks[i])}</button>`).join("")||`<span class="small muted">…</span>`}</div>
     <div class="order-pool">${pool.map(i=>`<button class="tok" data-a="otok" data-i="${i}" ${st.answered?"disabled":""} lang="${tl}">${esc(toks[i])}</button>`).join("")}</div>
     ${st.answered?`<div class="fb ${st.ok?"ok":"no"}" role="status"><b>${st.ok?"✓ "+t("correct"):"✗ "+t("wrong")}</b></div>${sentenceBox(item)}${nextBtn()}`
       :`<div class="row"><button class="btn primary" data-a="ocheck" ${st.ans.length<toks.length?"disabled":""}>${t("check")}</button><button class="btn" data-a="oclear">${t("clear")}</button></div>`}`;
  }
  if(type==="write"){
    body=`<p class="muted">${t("writeTask")}</p>${target(item)}<p>${known(item)}</p>
     <label class="sr" for="writeIn">${t("writePh")}</label><textarea id="writeIn" class="input area" lang="${tl}" rows="3" placeholder="${t("writePh")}" ${st.answered?"disabled":""}>${esc(st.typed||"")}</textarea>
     ${st.answered?`<p class="fb ${st.uses?"ok":"no"}">${st.uses?t("usesWordOk"):t("usesWordNo")}</p>${sentenceBox(item,t("modelSentence"))}
       <p class="small">${t("sayAloud")}</p><p class="small muted">${t("selfCheck")}</p>${gradeBtns(item.id)}`
     :`<button class="btn primary" data-a="writeDone">${t("done_")}</button>`}`;
  }
  if(type==="translate"){
    body=`<p class="muted">${t("translateTask")} → ${t("lang_"+tl)}</p><div class="word md" lang="${kn}">${esc(item.ex[kn])}</div>
     <label class="sr" for="trIn">${t("translatePh")}</label><textarea id="trIn" class="input area" lang="${tl}" rows="3" placeholder="${t("translatePh")}" ${st.answered?"disabled":""}>${esc(st.typed||"")}</textarea>
     ${st.answered?`${sentenceBox(item,t("modelSentence"))}<p class="small muted">${t("overlap",{p:Math.round(st.ov*100)})}</p><p class="small muted">${t("selfCheck")}</p>${gradeBtns(item.id)}`
     :`<div class="row"><button class="btn primary" data-a="trDone">${t("check")}</button><button class="btn" data-a="trDone" data-skip="1">${t("dontKnow")}</button></div>`}`;
  }
  if(type==="match"){
    const ids=task.ids.filter(id=>BY[id]&&BY[id][tl]);
    if(!st.left){st.left=shuffle(ids); st.right=shuffle(ids); st.done=[]; st.miss=[]; st.sel=null}
    const all=st.done.length===st.left.length;
    body=`<p class="muted">${t("match")}</p><div class="match">
      <div class="mcol">${st.left.map(id=>{const d=st.done.includes(id); return `<button class="opt ${d?"ok":""} ${st.sel===id?"sel":""}" data-a="mleft" data-id="${id}" ${d?"disabled":""} aria-pressed="${st.sel===id}" lang="${tl}">${esc(BY[id][tl])}${romOf(BY[id],tl)?`<div class="rom">${esc(romOf(BY[id],tl))}</div>`:""}</button>`}).join("")}</div>
      <div class="mcol">${st.right.map(id=>{const d=st.done.includes(id); return `<button class="opt ${d?"ok":""} ${st.flash===id?"no":""}" data-a="mright" data-id="${id}" ${d?"disabled":""}>${esc(knownText(BY[id]))}</button>`}).join("")}</div></div>
      ${all?`<div class="fb ok" role="status"><b>✓ ${t("matchDone")}</b></div>${nextBtn()}`:""}`;
  }
  if(type==="read"){
    const r=READ_BY[task.rid]; const ql=P().level==="b"?kn:tl;
    if(!st.qo){st.qo=r.q.map(q=>shuffle([...q.o.keys()])); st.ans=[]; st.open=[]}
    const answered=r.q.filter((q,i)=>st.ans[i]!==undefined).length, right=r.q.filter((q,i)=>st.ans[i]===q.a).length;
    body=`<p class="muted">${t("readTask")}</p><h2 class="word md" lang="${tl}" style="font-size:22px">${esc(r.title[tl])}</h2>
     <div class="row"><button class="btn sm" data-a="sayRead" data-r="${r.id}">${ic("play")}${t("listenText")}</button><button class="btn sm" data-a="sayRead" data-r="${r.id}" data-rate="0.75">${ic("slow")}${t("slow")}</button></div>
     <p class="small muted">${t("tapTranslate")}</p>
     <div class="reading">${r.text[tl].map((sn,i)=>`<button class="rsent" data-a="rsent" data-i="${i}" lang="${tl}" aria-expanded="${st.open.includes(i)}">${esc(sn)}${st.open.includes(i)?`<span class="rtr" lang="${kn}">${esc(r.text[kn][i])}</span>`:""}</button>`).join("")}</div>
     <div class="eyebrow">${t("readQs")}</div>
     ${r.q.map((q,qi)=>`<div class="stack" style="gap:8px"><p lang="${ql}"><b>${esc(q.q[ql])}</b></p><div class="opts">${st.qo[qi].map(oi=>{const a=st.ans[qi]; let cls=""; if(a!==undefined){if(oi===q.a)cls="ok"; else if(oi===a)cls="no"}
        return `<button class="opt ${cls}" data-a="rpick" data-q="${qi}" data-o="${oi}" ${a!==undefined?"disabled":""} lang="${ql}">${esc(q.o[oi][ql])}</button>`}).join("")}</div></div>`).join("")}
     ${answered===r.q.length?`<div class="fb ${right===r.q.length?"ok":"no"}" role="status"><b>${t("readDoneN",{c:right,n:r.q.length})}</b></div>${nextBtn()}`:""}`;
  }
  if(type==="pron"){
    body=`<p class="muted">${t("pronTask")}</p>${target(item)}<p>${known(item)}</p>${recorder(item.id)}${nextBtn()}`;
  }
  return head+`<section class="card task"><span class="why">${esc(skillLbl)} · ${esc(whyTxt)}</span>${body}</section>`;
}
function gradeBtns(id){const p=prog()[id];
  return `<div class="grades">${[["again",1],["hard",2],["good",3],["easy",4]].map(([k,g])=>`<button class="btn" data-a="grade" data-g="${g}">${t(k)}<small>${formatInterval(nextInterval(p,g))}</small></button>`).join("")}</div>`;
}
function feedback(ok,item){const tl=P().target; return `<div class="fb ${ok?"ok":"no"}" role="status"><b>${ok?"✓ "+t("correct"):"✗ "+t("wrong")}</b>${ok?"":` · ${t("answer")}: <span lang="${tl}">${esc(item[tl])}</span>${romOf(item,tl)?` <span class="rom">(${esc(romOf(item,tl))})</span>`:""}`}${item.ex&&item.ex[tl]?`<div class="small muted">${esc(item.ex[tl])}</div>`:""}</div>`}

/* ---- Recorder component ---- */
function recorder(id){
  const h=REC.hist[id]||[], last=h[0], an=last&&last.an;
  const live=!REC.micBlocked;
  return `<div class="rec" id="rec-${id}">
   ${listenBtns(id)}
   ${live?`<button class="recbtn ${REC.on?"on":""}" data-a="${REC.on?"stopRec":"startRec"}" data-id="${id}" aria-label="${REC.on?t("stop"):t("record")}">${ic(REC.on?"stop":"mic")}</button><div class="small muted" style="text-align:center">${REC.on?t("stop"):t("record")}</div>`:
   `<div class="upl"><p class="small">${t("micOff")}</p><label class="btn" for="up-${id}">${ic("mic")}${t("addRec")}</label><input id="up-${id}" class="sr" type="file" accept="audio/*" capture data-up="${id}"></div>`}
   ${last?`<canvas class="wave" data-id="${id}" aria-hidden="true"></canvas>
    <div class="row"><audio controls src="${last.url}" style="width:100%;max-width:100%" aria-label="${t("mine")}"></audio></div>
    ${an?`<div class="row" style="align-items:flex-end;gap:14px"><div class="score">${an.score}</div><div class="small muted" style="padding-bottom:4px">/ 100 · ${t("dur")} ${an.dur.toFixed(1)} s · ref ${an.exp.toFixed(1)} s · ${an.pauses} ${t("pauses")}</div></div>
     ${meter(t("tempo"),an.tempo)}${meter(t("volume"),an.volume)}${meter(t("flow"),an.flow)}
     <p class="note">${an.fb.map(k=>t(k)).join(" ")}</p><p class="small muted">${t("est")}</p>`:`<p class="note">${t("noAnalysis")}</p>`}
    <div class="stack"><span class="small" style="font-weight:700">${t("selfRate")}</span><div class="seg">${[["far",2],["close",3],["spot",4]].map(([k,g])=>`<button data-a="selfRate" data-id="${id}" data-g="${g}">${t(k)}</button>`).join("")}</div></div>
    ${h.length>1?`<div class="small muted">${t("history")}: ${h.map(x=>x.an?x.an.score:"–").join(" → ")}</div>`:""}`:""}
   <p class="small muted">${t("privacy")}</p>
  </div>`;
}
const meter=(l,v)=>`<div class="meter"><span>${l}</span><div class="bar"><i style="width:${v}%"></i></div><b>${v}</b></div>`;
function rerenderRec(id){const el=document.getElementById("rec-"+id); if(!el)return; el.outerHTML=recorder(id); afterRender()}

/* ---- Words ---- */
function vWords(){
  const tl=P().target, q=ui.q.trim().toLowerCase(), ITS=allItems(), nbIds=nbList();
  const list=(ui.filter==="nb"?nbIds.map(id=>BY[id]).filter(Boolean):ITS.filter(i=>i.kind!=="phrase"||P().level==="a").filter(i=>ui.filter==="all"||ui.filter==="fav"?(ui.filter!=="fav"||D.favs.includes(i.id)):stateOf(i.id)===ui.filter))
    .filter(i=>!q||[i.de,i.en,i.ne,i.ko,i.es,i.mean,i.rom&&i.rom.ne,i.rom&&i.rom.ko].filter(Boolean).some(x=>x.toLowerCase().includes(q)));
  const counts={}; ITS.forEach(i=>{const s=stateOf(i.id);counts[s]=(counts[s]||0)+1});
  const f=["all","nb","new","learning","familiar","mastered","review","fav"];
  const nbTools=ui.filter==="nb"?`<section class="card stack"><div class="eyebrow">${ic("book")} ${t("notebook")}</div><p class="small muted">${t("mNotebook")}</p>
    ${ui.nbForm?`<form class="stack" data-form="nbNew"><div class="field"><label for="nbw">${t("nbWord",{lang:t("lang_"+tl)})}</label><input id="nbw" class="text-in" lang="${tl}" required></div>
     <div class="field"><label for="nbm">${t("nbTrans",{lang:t("lang_"+P().known)})}</label><input id="nbm" class="text-in" lang="${P().known}" required></div>
     <div class="field"><label for="nbs">${t("nbSentence")}</label><input id="nbs" class="text-in" lang="${tl}"></div>
     <div class="field"><label for="nby">${t("nbSyn")}</label><input id="nby" class="text-in" lang="${tl}"></div>
     <div class="row"><button class="btn primary" type="submit">${t("nbSave")}</button><button class="btn" type="button" data-a="nbForm">${t("close_")}</button></div></form>`
     :`<div class="row"><button class="btn sm primary" data-a="nbForm">+ ${t("nbNew")}</button>${nbIds.length?`<button class="btn sm" data-a="nbExport">${t("nbExport")}</button>`:""}</div>`}
    ${nbIds.length?"":`<p class="muted">${t("nbEmpty")}</p>`}</section>`:"";
  return `<label class="sr" for="q">${t("search")}</label><input id="q" class="search" type="search" placeholder="${t("search")}" value="${esc(ui.q)}">
   <div class="chips" role="group" aria-label="Filter">${f.map(k=>`<button class="chip" data-a="filter" data-f="${k}" aria-pressed="${ui.filter===k}">${k==="all"?t("all"):k==="fav"?"★ "+t("favs"):k==="nb"?"✎ "+t("notebook"):STSYM[k]+" "+t("st_"+k)} <span class="muted">${k==="all"?ITS.length:k==="fav"?D.favs.length:k==="nb"?nbIds.length:counts[k]||0}</span></button>`).join("")}</div>
   ${nbTools}
   <div class="list">${list.slice(0,120).map(i=>`<button class="li" data-a="detail" data-id="${i.id}"><div class="main"><div class="word sm" lang="${tl}">${esc(i[tl])}${romOf(i,tl)?` <span class="rom">${esc(romOf(i,tl))}</span>`:""}</div><div class="sub">${esc(knownText(i))} · ${i.kind==="custom"?t("nbMine"):t("t_"+i.topic)}${nbGet(i.id)?" · ✎":""}</div></div>${pill(stateOf(i.id))}</button>`).join("")||(ui.filter==="nb"?"":`<div class="li muted">–</div>`)}</div>`;
}
function detailSheet(id){
  const i=BY[id], tl=P().target, p=prog()[id], nb=nbGet(id)||{}, own=i.kind==="custom";
  return `<div class="sheet-bg" data-a="closeSheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(i[tl])}" data-stop>
   <div class="row between"><span class="eyebrow">${t("t_"+i.topic)} · ${t("lvl_"+i.level)}</span>${pill(stateOf(id))}</div>
   ${target(i)}<p style="font-size:18px">${known(i)}</p>
   ${i.ex&&i.ex[tl]?`<div class="ex"><div class="eyebrow">${t("example")}</div><div class="t" lang="${tl}">${esc(i.ex[tl])}</div>${i.ex[P().known]?`<div class="small muted">${esc(i.ex[P().known])}</div>`:""}</div>`:""}
   ${noteOf(i)?`<p class="note">${esc(noteOf(i))}</p>`:""}
   ${p&&p.seen?`<p class="small muted">${t("nextRev")}: ${nextIn(p.due)} · ✓ ${p.ok} · ✗ ${p.bad}</p>`:""}
   <div class="row">${listenBtns(id)}${own?"":favBtn(id)}<button class="btn sm" data-a="speakItem" data-id="${id}">${ic("mic")}${t("practice")}</button></div>
   <details class="nbbox" ${nbGet(id)&&!own?"open":""}><summary><b>${ic("book")} ${nbGet(id)?t("nbIn"):t("nbAdd")}</b></summary>
    <form class="stack" data-form="nb" data-id="${id}">
     ${own?"":`<div class="field"><label for="nb-m">${t("nbMeaning")}</label><input id="nb-m" class="text-in" value="${esc(nb.m||"")}"></div>`}
     <div class="field"><label for="nb-s">${t("nbSentence")}</label><input id="nb-s" class="text-in" lang="${tl}" value="${esc(nb.s||"")}"></div>
     <div class="field"><label for="nb-y">${t("nbSyn")}</label><input id="nb-y" class="text-in" lang="${tl}" value="${esc(nb.y||"")}"></div>
     <div class="field"><label for="nb-n">${t("nbNote")}</label><input id="nb-n" class="text-in" value="${esc(nb.n||"")}"></div>
     <div class="row"><button class="btn sm primary" type="submit">${t("nbSave")}</button>${nbGet(id)?`<button class="btn sm" type="button" data-a="nbRemove" data-id="${id}" style="color:var(--bad)">${t("nbRemove")}</button>`:""}
      <a class="btn sm" href="${dictUrl(i,tl)}" target="_blank" rel="noopener">${t("lookup")}${tl==="en"?" (Oxford)":""}</a></div></form></details>
   <button class="btn block" data-a="closeSheet">${t("close_")}</button></div></div>`;
}

/* ---- Speak ---- */
function vSpeak(){
  const id=ui.speakId||wotd().id, i=BY[id], tl=P().target;
  const picks=[...new Set([wotd().id,...D.favs,...Object.keys(prog()).filter(k=>BY[k]&&(prog()[k].bad>0))])].filter(k=>k!==id).slice(0,8);
  const fill=WORDS.filter(w=>!picks.includes(w.id)&&w.id!==id&&lvlRank[w.level]<=lvlRank[P().level]).slice(0,Math.max(0,8-picks.length)).map(w=>w.id);
  return `<section class="card stack">${target(i)}<p style="font-size:18px">${known(i)}</p>
    ${i.ex?`<div class="ex"><div class="t" lang="${tl}">${esc(i.ex[tl])}</div><button class="btn sm" style="margin-top:6px" data-a="sayEx" data-id="${id}">${ic("play")}${t("example")}</button></div>`:""}
    ${recorder(id)}</section>
   <section class="stack"><div class="eyebrow">${t("pick")}</div><div class="chips" style="flex-wrap:wrap">${picks.concat(fill).map(k=>`<button class="chip" data-a="speakItem" data-id="${k}" lang="${tl}">${esc(BY[k][tl])}</button>`).join("")}</div></section>`;
}

/* ---- Travel ---- */
function vTravel(){
  const tl=P().target, sits=[...new Set(ALL_TRV.map(r=>r[1]))];
  const list=ITEMS.filter(i=>i.kind==="travel"&&(ui.sit==="all"||i.sit===ui.sit));
  const done=ITEMS.filter(i=>i.kind==="travel"&&stateOf(i.id)!=="new").length, total=ALL_TRV.length;
  return `<section class="card wotd stack"><div class="row between"><div><h2 class="word md" style="font-size:22px">${t("trip")}</h2><p class="small muted">${t("tripSub")} · ${done}/${total}</p></div><button class="btn gold" data-a="trip">${t("practice")}</button></div></section>
   <div class="chips" role="group" aria-label="${t("travel")}"><button class="chip" data-a="sit" data-s="all" aria-pressed="${ui.sit==="all"}">${t("all")}</button>${sits.map(s=>`<button class="chip" data-a="sit" data-s="${s}" aria-pressed="${ui.sit===s}">${t("sit_"+s)}</button>`).join("")}</div>
   <div class="list">${list.map(i=>`<div class="li" style="flex-wrap:wrap"><div class="main" style="min-width:200px"><div class="eyebrow" style="font-size:11px">${t("sit_"+i.sit)}</div><div class="word sm" lang="${tl}">${esc(i[tl])}</div>${romOf(i,tl)?`<div class="rom">${esc(romOf(i,tl))}</div>`:""}<div class="sub" style="white-space:normal">${esc(i[P().known])}</div></div>
     <div class="row" style="gap:6px"><button class="btn sm icon-btn" data-a="say" data-id="${i.id}" aria-label="${t("listen")}">${ic("play")}</button><button class="btn sm icon-btn" data-a="say" data-id="${i.id}" data-rate="0.6" aria-label="${t("slow")}">${ic("slow")}</button><button class="btn sm icon-btn" data-a="speakItem" data-id="${i.id}" aria-label="${t("practice")}">${ic("mic")}</button><button class="btn sm icon-btn" data-a="fav" data-id="${i.id}" aria-pressed="${D.favs.includes(i.id)}" aria-label="${D.favs.includes(i.id)?t("saved"):t("save")}" style="${D.favs.includes(i.id)?"color:var(--accent)":""}">${ic("star")}</button></div></div>`).join("")}</div>`;
}

/* ---- Progress ---- */
function vProgress(){
  const all=ITEMS.filter(i=>i.kind!=="phrase"); const counts={new:0,learning:0,familiar:0,mastered:0,review:0}; all.forEach(i=>counts[stateOf(i.id)]++);
  const started=all.length-counts.new, acc=recentAcc(), pr=prog();
  const prs=Object.values(pr).flatMap(p=>p.pron||[]), pAvg=prs.length?Math.round(prs.reduce((a,b)=>a+b,0)/prs.length):null;
  const days=[]; const d=new Date(); d.setDate(d.getDate()-6); for(let k=0;k<7;k++){const key=todayKey(d); days.push({lab:d.toLocaleDateString(P().ui==="ne"?"ne-NP":P().ui,{weekday:"short"}),v:Math.round((D.act[key]?.min)||0)}); d.setDate(d.getDate()+1)}
  const mx=Math.max(P().minutes,...days.map(x=>x.v)); const W=320,H=150,bw=W/7;
  const yGoal=H-24-(P().minutes/mx)*(H-44);
  const chart=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t("week")}">
    <line x1="0" x2="${W}" y1="${yGoal}" y2="${yGoal}" stroke="var(--accent)" stroke-dasharray="4 4" stroke-width="1.5"/>
    <text x="${W-2}" y="${yGoal-4}" text-anchor="end" font-size="10" fill="var(--muted)">${P().minutes} ${t("min")}</text>
    ${days.map((x,k)=>{const h=(x.v/mx)*(H-44); return `<rect x="${k*bw+bw*0.2}" y="${H-24-h}" width="${bw*0.6}" height="${Math.max(h,1)}" rx="4" fill="${k===6?"var(--brand)":"color-mix(in srgb,var(--brand) 45%,var(--surface-2))"}"/>
     <text x="${k*bw+bw/2}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(x.lab)}</text>${x.v?`<text x="${k*bw+bw/2}" y="${H-28-h}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">${x.v}</text>`:""}`}).join("")}</svg>`;
  const col={new:"var(--line)",learning:"var(--warn)",familiar:"var(--brand)",mastered:"var(--good)",review:"var(--bad)"};
  const weak=Object.keys(pr).filter(k=>BY[k]&&pr[k].bad>0).sort((a,b)=>pr[b].bad-pr[a].bad).slice(0,5);
  return `<div class="stats">
    <div class="stat"><b>${started}</b><span>${t("started")}</span></div>
    <div class="stat"><b>${counts.mastered}</b><span>${t("mastered")}</span></div>
    <div class="stat"><b>${acc===null?"–":Math.round(acc*100)+"%"}</b><span>${t("accuracy")}</span></div>
    <div class="stat"><b>${streak()}</b><span>${t("streak")}</span></div>
    <div class="stat"><b>${pAvg??"–"}</b><span>${t("pronAvg")}</span></div>
    <div class="stat"><b>${dueItems().length}</b><span>${t("due")}</span></div></div>
   <section class="card stack"><div class="eyebrow">${t("week")}</div>${chart}</section>
   ${skillsCard()}
   <section class="card stack"><div class="eyebrow">${t("words")} · ${t("lang_"+P().target)}</div>
    <div class="stack-bar" role="img" aria-label="${Object.entries(counts).map(([k,v])=>t("st_"+k)+" "+v).join(", ")}">${Object.entries(counts).map(([k,v])=>v?`<span style="width:${v/all.length*100}%;background:${col[k]}"></span>`:"").join("")}</div>
    <div class="legend">${Object.entries(counts).map(([k,v])=>`<span><span aria-hidden="true" style="color:${col[k]}">■</span> ${STSYM[k]} ${t("st_"+k)} <b style="color:var(--ink)">${v}</b></span>`).join("")}</div></section>
   <section class="card stack"><div class="eyebrow">${t("weak")}</div>${weak.length?`<div class="list">${weak.map(k=>`<button class="li" data-a="detail" data-id="${k}"><div class="main"><div class="word sm" lang="${P().target}">${esc(BY[k][P().target])}</div><div class="sub">${esc(BY[k][P().known])}</div></div><span class="small muted">✗ ${pr[k].bad}</span></button>`).join("")}</div>`:`<p class="muted">${t("recEmpty")}</p>`}
    <p><b>${t("rec")}:</b> ${recommendation()}</p></section>`;
}

function skillsCard(){
  const tot={}; SKILLS.forEach(k=>tot[k]={ok:0,n:0}); const d=new Date();
  for(let i=0;i<30;i++){const a=D.act[todayKey(d)]; if(a&&a.sk)for(const k of SKILLS)if(a.sk[k]){tot[k].ok+=a.sk[k].ok; tot[k].n+=a.sk[k].n} d.setDate(d.getDate()-1)}
  const any=SKILLS.some(k=>tot[k].n);
  return `<section class="card stack skills" aria-labelledby="skH"><div class="eyebrow" id="skH">${t("skillsTitle")}</div><p class="small muted">${t("skillsSub")}</p>
   ${any?SKILLS.map(k=>{const v=tot[k].n?Math.round(tot[k].ok/tot[k].n*100):0; return `<div class="meter" style="grid-template-columns:110px 1fr 90px"><span>${t("sk_"+k)}</span><div class="bar"><i style="width:${v}%"></i></div><b class="small">${tot[k].n?v+"% · "+tot[k].n:"–"}</b></div>`}).join(""):`<p class="muted">${t("skillsNone")}</p>`}
   ${methodsBox()}</section>`;
}

/* ---- Onboarding (first run) ---- */
function obSheet(){
  const o=ui.ob||(ui.ob={step:0,focus:"balanced"}), p=P();
  const seg=(key,opts,lab)=>`<div class="seg wrap" role="group">${opts.map(v=>`<button data-a="obSet" data-k="${key}" data-v="${v}" aria-pressed="${String(key==="focus"?o.focus:p[key])===String(v)}">${lab(v)}</button>`).join("")}</div>`;
  const steps=[
    ()=>`<p>${t("obIntro")}</p><div class="field"><label>${t("uiLang")}</label>${seg("ui",LANGS,l=>UI_NAME[l])}</div><div class="field"><label>${t("obKnown")}</label>${seg("known",LANGS,l=>t("lang_"+l))}</div>`,
    ()=>`<div class="field"><label>${t("obTarget")}</label>${seg("target",LANGS.filter(l=>l!==p.known),l=>t("lang_"+l))}</div><div class="field"><label>${t("obLevel")}</label>${seg("level",["b","i","a"],l=>t("lvl_"+l))}</div>`,
    ()=>`<div class="field"><label>${t("obFocus")}</label>${seg("focus",["balanced","listen","read","speak","write"],k=>k==="balanced"?t("obBalanced"):t("sk_"+k))}</div><p class="small muted">${t("mVocab")}</p>
      <div class="field"><label>${t("obTime")}</label>${seg("minutes",[10,20,30,45,60],m=>(m===20?"10–20":m)+" "+t("min"))}</div>`];
  const last=o.step===steps.length-1;
  return `<div class="sheet-bg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="obH" data-stop data-ob>
   <div class="row between"><h2 id="obH" class="word md" style="font-size:24px">${t("obWelcome")}</h2><span class="small muted">${o.step+1} / ${steps.length}</span></div>
   ${steps[o.step]()}
   <div class="row between">${o.step?`<button class="btn" data-a="obBack">${t("obBack")}</button>`:`<button class="btn" data-a="obSkip">${t("obSkip")}</button>`}
    <button class="btn primary" data-a="${last?"obDone":"obNext"}">${last?t("obStart"):t("obNext")}</button></div></div></div>`;
}

/* ---- Glance mode (passive exposure on any screen) ---- */
const GL={on:false,ids:[],i:0,timer:null,lock:null};
async function glanceStart(){
  GL.ids=deck(30); if(!GL.ids.length)return; GL.i=0; GL.on=true; glanceShow();
  GL.timer=setInterval(()=>{GL.i=(GL.i+1)%GL.ids.length; glanceShow()},8000);
  try{GL.lock=await navigator.wakeLock?.request("screen")}catch(e){GL.lock=null}
  try{document.documentElement.requestFullscreen?.().catch(()=>{})}catch(e){}
}
function glanceStop(){GL.on=false; clearInterval(GL.timer); TTS.stop(); try{GL.lock&&GL.lock.release()}catch(e){} GL.lock=null;
  const el=document.getElementById("glance"); if(el)el.remove(); try{document.fullscreenElement&&document.exitFullscreen()}catch(e){}}
function glanceShow(){
  const it=BY[GL.ids[GL.i]], tl=P().target; if(!it)return;
  let el=document.getElementById("glance"); if(!el){el=document.createElement("div"); el.id="glance"; el.className="glance"; el.setAttribute("role","dialog"); el.setAttribute("aria-label",t("glance")); el.dataset.a="glanceExit"; document.body.appendChild(el)}
  el.innerHTML=`<div class="gl-card" aria-live="polite"><div class="eyebrow">${t("glance")} · ${GL.i+1}/${GL.ids.length}</div>
    <div class="gl-word" lang="${tl}">${esc(it[tl])}</div>${romOf(it,tl)?`<div class="rom">${esc(romOf(it,tl))}</div>`:""}
    <div class="gl-mean">${esc(knownText(it))}</div>${it.ex&&it.ex[tl]?`<div class="gl-ex" lang="${tl}">${esc(it.ex[tl])}</div>`:""}</div>
    <div class="gl-hint small">${t("tapExit")}</div>`;
  if(D.passive.audio)TTS.speak(it[tl],tl,1,it.id);
}

/* ---- Lock-screen words (Android/iOS notifications) and Android widget ---- */
const LN=()=>capPlugin("LocalNotifications");
async function scheduleLock(){
  const ln=LN(); if(!ln)return 0;
  try{
    const pend=await ln.getPending(); const old=(pend.notifications||[]).filter(n=>n.id>=1000&&n.id<1100).map(n=>({id:n.id}));
    if(old.length)await ln.cancel({notifications:old});
    if(!D.passive.lock)return 0;
    let perm=await ln.checkPermissions(); if(perm.display!=="granted")perm=await ln.requestPermissions();
    if(perm.display!=="granted"){toast(t("notifDenied")); D.passive.lock=false; persist(); return 0}
    if(isAndroid)await ln.createChannel({id:"bhasha-words",name:t("lockWords"),description:t("lockWordsSub"),importance:2,visibility:1,vibration:false}).catch(()=>{});
    const times=lockTimes({perDay:D.passive.perDay,from:D.passive.from,to:D.passive.to,days:2}).slice(0,60);
    const ids=deck(times.length), tl=P().target;
    const notifications=times.map((at,k)=>{const it=BY[ids[k%ids.length]]; const r=romOf(it,tl);
      return {id:1000+k,title:it[tl]+(r?" · "+r:""),body:knownText(it)+(it.ex&&it.ex[tl]?"\n"+it.ex[tl]:""),schedule:{at:new Date(at),allowWhileIdle:true},
        channelId:"bhasha-words",smallIcon:"ic_stat_bhasha",extra:{id:it.id},group:"bhasha-words"}}).filter(n=>n.title);
    if(notifications.length)await ln.schedule({notifications});
    return notifications.length;
  }catch(e){return 0}
}
async function updateWidget(){
  const w=capPlugin("BhashaWidget"); if(!w)return;
  try{const tl=P().target; await w.update({label:t("lang_"+tl),items:deck(24).map(id=>{const it=BY[id]; return {w:it[tl],r:romOf(it,tl)||"",t:knownText(it)}})})}catch(e){}
}
function syncPassive(){scheduleLock(); updateWidget()}
function passiveFields(){
  const ps=D.passive;
  return `<div class="field"><label>${ic("eye")} ${t("passive")}</label>
   ${isMobileApp?`<label class="row" style="gap:10px"><input type="checkbox" data-plock ${ps.lock?"checked":""} style="width:20px;height:20px;accent-color:var(--brand)"> <span><b>${t("lockWords")}</b><br><span class="small muted">${t("lockWordsSub")}</span></span></label>
    ${ps.lock?`<div class="seg" role="group">${[3,6,10].map(n=>`<button data-a="pset" data-k="perDay" data-v="${n}" aria-pressed="${ps.perDay===n}">${n} ${t("perDay")}</button>`).join("")}</div>
    <div class="seg" role="group">${[[8,21],[7,22],[10,20]].map(([a,b])=>`<button data-a="pset" data-k="hours" data-v="${a}-${b}" aria-pressed="${ps.from===a&&ps.to===b}">${t("hours",{a,b})}</button>`).join("")}</div>`:""}
    ${isAndroid?`<p class="small muted">${t("widgetHow")}</p>`:""}`:`<p class="small muted">${t("lockWords")}: ${t("lockOnlyApp")}</p>`}
   <label class="row" style="gap:10px"><input type="checkbox" data-paudio ${ps.audio?"checked":""} style="width:20px;height:20px;accent-color:var(--brand)"> ${t("glanceAudio")} (${t("glance")})</label>
   <button class="btn sm" data-a="glance">${ic("eye")}${t("glanceStart")}</button></div>`;
}

/* ---- Profile sheet ---- */
function profileSheet(){
  const p=P(), langs=LANGS;
  const seg=(key,opts,lab)=>`<div class="seg" role="group">${opts.map(o=>`<button data-a="setp" data-k="${key}" data-v="${o}" aria-pressed="${String(p[key])===String(o)}">${lab(o)}</button>`).join("")}</div>`;
  const pr=p.prio, tot=SKILLS.reduce((a,k)=>a+pr[k],0)||1;
  return `<div class="sheet-bg" data-a="closeSheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="${t("profile")}" data-stop>
   <h2 class="word md" style="font-size:24px">${t("profile")}</h2>
   <div class="field"><label for="pname">${t("name")}</label><input id="pname" class="text-in" value="${esc(p.name)}" autocomplete="given-name"></div>
   <div class="field"><label>${t("uiLang")}</label>${seg("ui",langs,l=>UI_NAME[l])}</div>
   <div class="field"><label>${t("iSpeak")}</label>${seg("known",langs,l=>t("lang_"+l))}</div>
   <div class="field"><label>${t("iLearn")}</label>${seg("target",langs.filter(l=>l!==p.known),l=>t("lang_"+l))}</div>
   <div class="field"><label>${t("level")}</label>${seg("level",["b","i","a"],l=>t("lvl_"+l))}</div>
   <div class="field"><label>${t("daily")}</label>${seg("minutes",[10,20,30,45,60],m=>(m===20?"10–20":m)+" "+t("min"))}</div>
   <div class="field"><label>${t("focus")}</label>${SKILLS.map(k=>`<div class="meter" style="grid-template-columns:130px 1fr 44px"><label for="pr-${k}" style="font-weight:400">${t("f_"+k)}</label><input id="pr-${k}" type="range" min="0" max="100" step="5" value="${pr[k]}" data-prio="${k}"><b>${Math.round(pr[k]/tot*100)}%</b></div>`).join("")}</div>
   <div class="field"><label>${t("voiceGender")}</label>${seg("gender",["f","m"],g=>t("g_"+g))}</div>
   ${passiveFields()}
   ${voiceFields()}
   <label class="row" style="gap:10px"><input type="checkbox" id="prom" ${p.rom?"checked":""} data-rom style="width:20px;height:20px;accent-color:var(--brand)"> ${t("showRom")}</label>
   <div class="row">${installEvt?`<button class="btn sm" data-a="install">${t("installApp")}</button>`:""}<button class="btn sm" data-a="downloadData">${t("download")}</button><button class="btn sm" data-a="copyData">${t("copy")}</button><button class="btn sm" data-a="reset" style="color:var(--bad)">${ui.resetArm?t("confirmReset"):t("reset")}</button></div>
   <button class="btn primary block" data-a="closeSheet">${t("close_")}</button></div></div>`;
}

function voiceFields(){
  const langs=[P().target].concat(LANGS.filter(l=>l!==P().target));
  return `<div class="field"><label>${t("voices")}</label>${langs.map(l=>{const r=TTS.ranked(l), cur=TTS.pick(l);
    const nat=nativeVoiceName(l);
    if(nat)return `<div class="row between" style="flex-wrap:nowrap"><div style="min-width:0"><div class="small" style="font-weight:500">${t("voiceFor",{lang:t("lang_"+l)})}</div><div><b>★ ${t("nativeAudio",{name:esc(nat)})}</b></div></div><button class="btn sm" data-a="testVoice" data-l="${l}">${ic("play")}${t("testVoice")}</button></div>`;
    if(NativeTTS())return `<div class="row between" style="flex-wrap:nowrap"><div class="small" style="font-weight:500">${t("voiceFor",{lang:t("lang_"+l)})}: ${t("deviceVoice")}</div><button class="btn sm" data-a="testVoice" data-l="${l}">${ic("play")}${t("testVoice")}</button></div>`;
    return `<div class="stack" style="gap:6px"><label for="vs-${l}" class="small" style="font-weight:500">${t("voiceFor",{lang:t("lang_"+l)})}</label>
     <div class="row" style="flex-wrap:nowrap"><select id="vs-${l}" class="text-in" data-voice="${l}" style="flex:1;min-width:0">
      <option value="">${t("autoVoice")}${cur?" · "+esc(cur.name):""}</option>
      ${r.map(([v,sc])=>`<option value="${esc(v.voiceURI)}" ${D.voice[l]===v.voiceURI?"selected":""}>${sc>=130?"★ ":""}${esc(v.name)} (${esc(v.lang)})</option>`).join("")}
     </select><button class="btn sm" data-a="testVoice" data-l="${l}">${ic("play")}${t("testVoice")}</button></div>
     ${!r.length?`<p class="small muted">${t("noVoice",{lang:t("lang_"+l)})}</p>`:""}
     ${!nat&&l==="de"&&!TTS.quality(cur,"de")?`<p class="note">${t("deTip")}</p>`:""}${!nat&&l==="ne"&&!(cur&&/hemkala|sagar/i.test(cur.name))?`<p class="note">${t("neTip")}</p>`:""}</div>`}).join("")}</div>`;
}
const TESTS={es:"¡Buenos días! Estoy aprendiendo español. ¿Cómo está usted?",de:"Guten Morgen! Ich lerne gerade Deutsch. Wie geht es Ihnen?",en:"Good morning! I'm learning English. How are you?",ne:"नमस्ते! म नेपाली सिक्दैछु। तपाईंलाई कस्तो छ?",ko:"안녕하세요! 저는 한국어를 배우고 있어요. 어떻게 지내세요?"};

/* ---------- Events ---------- */
let sheet=null;
function openSheet(html){sheet=html;document.getElementById("layer").innerHTML=html;const s=document.querySelector(".sheet");s&&s.querySelector("button,input")?.focus()}
function closeSheet(){sheet=null;document.getElementById("layer").innerHTML="";ui.resetArm=false;render()}
let toastT; function toast(msg){clearTimeout(toastT);let el=document.querySelector(".toast"); if(!el){el=document.createElement("div");el.className="toast";el.setAttribute("role","status");document.body.appendChild(el)} el.textContent=msg; toastT=setTimeout(()=>el.remove(),4200)}

function advance(){D.session.i++; ui.sess={}; if(D.session.i>=D.session.tasks.length)syncPassive(); persist(); render(); document.getElementById("main").focus()}
const curType=(task)=>{const it=task&&task.id?BY[task.id]:null; return it?fixType(task,it):task&&task.type};
const skillOf=(task)=>TASK_SKILL[curType(task)]||"vocab";
function scoreTask(ok,x){const s=D.session, task=s.tasks[s.i]; s.xp+=x; if(ok)s.ok++; addXP(x,ok,skillOf(task))}
function exportNotebook(){
  const tl=P().target, kn=P().known, q=v=>'"'+String(v||"").replace(/"/g,'""')+'"';
  const rows=[["word","romanisation","meaning","my sentence","synonyms","notes","example"]].concat(nbList().map(id=>{const it=BY[id], nb=nbGet(id)||{};
    return [it[tl],romOf(it,tl),nb.m||knownText(it),nb.s,nb.y,nb.n,it.ex&&it.ex[tl]]}));
  const csv="\ufeff"+rows.map(r=>r.map(q).join(",")).join("\r\n");
  if(isMobileApp){navigator.clipboard?.writeText(csv).then(()=>toast(t("copied")),()=>toast("Clipboard blocked")); return}
  const u=URL.createObjectURL(new Blob([csv],{type:"text/csv"})), l=document.createElement("a"); l.href=u; l.download=`bhasha-notebook-${tl}-${todayKey()}.csv`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000);
}
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-a]"); if(!el)return;
  if(el.dataset.a==="closeSheet"&&e.target.closest("[data-stop]")&&el.classList.contains("sheet-bg"))return;
  const a=el.dataset.a, id=el.dataset.id, s=D.session, task=s&&s.tasks[s.i];
  switch(a){
    case"go":route=el.dataset.r; render(); window.scrollTo(0,0); break;
    case"profile":openSheet(profileSheet()); break;
    case"closeSheet":closeSheet(); break;
    case"say":{const tl=P().target; TTS.speak(BY[id][tl],tl,+el.dataset.rate||1,id); break}
    case"sayEx":{const tl=P().target; TTS.speak(BY[id].ex[tl],tl,+el.dataset.rate||1,id+".ex"); break}
    case"fav":{const k=D.favs.indexOf(id); if(k<0)D.favs.push(id); else D.favs.splice(k,1); persist(); if(sheet)openSheet(detailSheet(id)); render(); break}
    case"startSession":startSession(); break;
    case"trip":startSession("trip"); break;
    case"resume":route="session"; ui.sess={}; sessionClock=Date.now(); render(); break;
    case"pauseSession":persist(); route="home"; render(); toast("⏸ "+t("resume")); break;
    case"finish":D.session=null; persist(); route="home"; render(); break;
    case"reveal":ui.sess.shown=true; render(); break;
    case"grade":{const g=+el.dataset.g, ty=curType(task); grade(task.id,g);
      if(ty==="write"){const v=ui.sess.typed||""; if(v.trim()&&ui.sess.uses&&!nbGet(task.id)?.s){nbSet(task.id,{s:v.trim()}); toast("✎ "+t("savedNb"))}}
      if(ty==="study"){s.xp+=5; addXP(5,null)} else scoreTask(g>1,g>1?(ty==="write"||ty==="translate"?15:10):2); advance(); break}
    case"pick":{const st=ui.sess; st.answered=true; st.pick=id; st.ok=id===task.id; const fast=Date.now()-st.t0<4000;
      grade(task.id,st.ok?(fast?4:3):1); scoreTask(st.ok,st.ok?10:2);
      if(task.type==="audio"||!st.ok)TTS.speak(BY[task.id][P().target],P().target,1,task.id);
      document.getElementById("live").textContent=st.ok?t("correct"):t("wrong"); render(); break}
    case"checkType":case"dontKnow":{const st=ui.sess, v=(document.getElementById("typeIn")||{}).value||""; st.typed=v;
      st.ok=a==="checkType"&&answerOk(v,BY[task.id],P().target); st.answered=true; grade(task.id,st.ok?3:1); scoreTask(st.ok,st.ok?10:2);
      if(!st.ok)TTS.speak(BY[task.id][P().target],P().target,1,task.id); render(); break}
    case"otok":case"oans":{const st=ui.sess, i=+el.dataset.i; if(a==="otok")st.ans.push(i); else st.ans=st.ans.filter(x=>x!==i); render(); break}
    case"oclear":ui.sess.ans=[]; render(); break;
    case"ocheck":{const st=ui.sess, it=BY[task.id], tl=P().target, toks=tokens(it.ex[tl]);
      st.ok=st.ans.map(i=>toks[i]).join(" ")===toks.join(" "); st.answered=true; grade(task.id,st.ok?3:1); scoreTask(st.ok,st.ok?10:2);
      TTS.speak(it.ex[tl],tl,1,task.id+".ex"); render(); break}
    case"writeDone":{const st=ui.sess, v=(document.getElementById("writeIn")||{}).value||""; st.typed=v; st.uses=usesWord(v,BY[task.id],P().target); st.answered=true; render(); break}
    case"trDone":{const st=ui.sess, it=BY[task.id], tl=P().target, v=el.dataset.skip?"":((document.getElementById("trIn")||{}).value||"");
      st.typed=v; st.ov=overlapScore(v,it.ex[tl]); st.answered=true; TTS.speak(it.ex[tl],tl,1,task.id+".ex"); render(); break}
    case"mleft":ui.sess.sel=id; ui.sess.flash=null; render(); break;
    case"mright":{const st=ui.sess; if(!st.sel){toast(t("match")); break}
      if(st.sel===id){st.done.push(id); TTS.speak(BY[id][P().target],P().target,1,id); const ok=!st.miss.includes(id); grade(id,ok?3:2); scoreTask(ok,ok?5:1); st.sel=null; st.flash=null}
      else{if(!st.miss.includes(st.sel))st.miss.push(st.sel); st.flash=id}
      render(); break}
    case"rsent":{const st=ui.sess, i=+el.dataset.i; st.open=st.open.includes(i)?st.open.filter(x=>x!==i):st.open.concat(i);
      const r=READ_BY[task.rid]; if(!st.open.includes(i)){} else TTS.speak(r.text[P().target][i],P().target,1); render(); break}
    case"rpick":{const st=ui.sess, r=READ_BY[task.rid], qi=+el.dataset.q, oi=+el.dataset.o; if(st.ans[qi]!==undefined)break;
      st.ans[qi]=oi; const ok=oi===r.q[qi].a; scoreTask(ok,ok?10:2);
      if(r.q.every((q,i)=>st.ans[i]!==undefined)){const tl=P().target, c=r.q.filter((q,i)=>st.ans[i]===q.a).length; const rd=D.reads[tl]=D.reads[tl]||{}; rd[r.id]={c,n:r.q.length,at:Date.now()}; persist()}
      render(); break}
    case"sayRead":{const r=READ_BY[el.dataset.r], tl=P().target; TTS.speak(r.text[tl].join(" "),tl,+el.dataset.rate||1,r.id); break}
    case"readOpen":{D.session={tasks:[{type:"read",rid:el.dataset.r,why:"whyRead"}],i:0,ok:0,xp:0,mode:"read"}; ui.sess={}; sessionClock=Date.now(); persist(); route="session"; render(); window.scrollTo(0,0); break}
    case"nbForm":ui.nbForm=!ui.nbForm; render(); break;
    case"nbExport":exportNotebook(); break;
    case"nbRemove":{const tl=P().target; if(customRec(id)){D.custom[tl]=D.custom[tl].filter(c=>c.id!==id); delete prog()[id]; delete BY[id]} else if(D.nb[tl])delete D.nb[tl][id]; persist(); closeSheet(); break}
    case"obSet":{const k=el.dataset.k; let v=el.dataset.v; if(k==="focus"){ui.ob.focus=v} else {if(k==="minutes")v=+v; P()[k]=v;
        if(k==="known"&&P().target===v)P().target=LANGS.find(l=>l!==v); if(k==="ui"&&!ui.ob.knownSet)P().known=v===P().target?P().known:v}
      if(k==="known")ui.ob.knownSet=true; persist(); render(); openSheet(obSheet()); break}
    case"obNext":ui.ob.step++; openSheet(obSheet()); break;
    case"obBack":ui.ob.step--; openSheet(obSheet()); break;
    case"obSkip":case"obDone":{P().onboarded=true; if(a==="obDone")P().prio={...FOCUS_PRESETS[ui.ob.focus||"balanced"]}; persist(); sheet=null; document.getElementById("layer").innerHTML=""; render(); syncPassive(); break}
    case"glance":if(sheet){sheet=null;document.getElementById("layer").innerHTML=""} glanceStart(); break;
    case"glanceExit":glanceStop(); break;
    case"pset":{const k=el.dataset.k, v=el.dataset.v; if(k==="perDay")D.passive.perDay=+v; if(k==="hours"){const [x,y]=v.split("-").map(Number); D.passive.from=x; D.passive.to=y}
      persist(); openSheet(profileSheet()); scheduleLock().then(n=>n&&toast(t("lockScheduled",{n}))); break}
    case"nextTask":advance(); break;
    case"startRec":startRec(id); break;
    case"stopRec":stopRec(id); break;
    case"selfRate":{grade(id,+el.dataset.g); addXP(0,+el.dataset.g>2,"speak"); toast("✓ "+t("nextRev")+": "+nextIn(prog()[id].due)); el.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b===el)); break}
    case"speakItem":ui.speakId=id; if(sheet){sheet=null;document.getElementById("layer").innerHTML=""} route="speak"; render(); window.scrollTo(0,0); break;
    case"filter":ui.filter=el.dataset.f; ui.nbForm=false; render(); break;
    case"sit":ui.sit=el.dataset.s; render(); break;
    case"topic":ui.filter="all"; ui.q=""; route="words"; render(); setTimeout(()=>{const first=WORDS.find(w=>w.topic===el.dataset.t); if(first)openSheet(detailSheet(first.id))},0); break;
    case"detail":openSheet(detailSheet(id)); break;
    case"setp":{const k=el.dataset.k; let v=el.dataset.v; if(k==="minutes")v=+v; P()[k]=v;
      if(k==="known"&&P().target===v)P().target=LANGS.find(l=>l!==v);
      if(k==="gender"){D.voice={}; const l=P().target; if(nativeVoiceName(l))TTS.speak(BY.g1.ex[l],l,1,"g1.ex"); else TTS.speak(TESTS[l],l,1)}
      persist(); openSheet(profileSheet()); render(); if(k==="target"||k==="known"||k==="level")syncPassive(); break}
    case"testVoice":{const l=el.dataset.l; if(nativeVoiceName(l))TTS.speak(BY.g1.ex[l],l,1,"g1.ex"); else TTS.speak(TESTS[l],l,1); break}
    case"install":installEvt&&installEvt.prompt(); installEvt=null; openSheet(profileSheet()); break;
    case"downloadData":{const blob=new Blob([JSON.stringify({exported:new Date().toISOString(),profile:D.profile,progress:D.prog,saved:D.favs,activity:D.act},null,2)],{type:"application/json"});
      const u=URL.createObjectURL(blob), l=document.createElement("a"); l.href=u; l.download="bhasha-data-"+todayKey()+".json"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); break}
    case"copyData":{const txt=JSON.stringify({profile:D.profile,progress:D.prog,saved:D.favs,activity:D.act},null,2);
      navigator.clipboard?.writeText(txt).then(()=>toast(t("copied")),()=>toast("Clipboard blocked")); break}
    case"reset":if(!ui.resetArm){ui.resetArm=true;openSheet(profileSheet())}else{D.prog={};D.act={};D.session=null;D.favs=[];ui.resetArm=false;persist();closeSheet()} break;
  }
});
document.addEventListener("input",e=>{
  if(e.target.id==="q"){ui.q=e.target.value; const pos=e.target.selectionStart; render(); const q=document.getElementById("q"); q.focus(); try{q.setSelectionRange(pos,pos)}catch(_){}}
  if(e.target.id==="pname"){P().name=e.target.value; persist(); document.getElementById("pairBtn").querySelector(".av").textContent=(P().name||"·").slice(0,1).toUpperCase()}
  if(e.target.dataset.prio){P().prio[e.target.dataset.prio]=+e.target.value; persist(); const pr=P().prio,tot=SKILLS.reduce((a,k)=>a+pr[k],0)||1; document.querySelectorAll("[data-prio]").forEach(r=>r.parentElement.querySelector("b").textContent=Math.round(pr[r.dataset.prio]/tot*100)+"%")}
});
document.addEventListener("change",e=>{
  if(e.target.dataset.up){const f=e.target.files&&e.target.files[0]; if(f)handleBlob(e.target.dataset.up,f)}
  if(e.target.dataset.voice){D.voice[e.target.dataset.voice]=e.target.value; persist(); TTS.speak(TESTS[e.target.dataset.voice],e.target.dataset.voice,1); openSheet(profileSheet())}
  if(e.target.dataset.rom!==undefined){P().rom=e.target.checked; persist(); render()}
  if(e.target.dataset.plock!==undefined){D.passive.lock=e.target.checked; persist(); scheduleLock().then(n=>{if(n)toast(t("lockScheduled",{n})); openSheet(profileSheet())})}
  if(e.target.dataset.paudio!==undefined){D.passive.audio=e.target.checked; persist()}
});
document.addEventListener("submit",e=>{
  const fm=e.target.closest("form[data-form]"); if(!fm)return; e.preventDefault();
  const v=id=>((document.getElementById(id)||{}).value||"").trim(), tl=P().target;
  if(fm.dataset.form==="nb"){const id=fm.dataset.id, patch={s:v("nb-s"),y:v("nb-y"),n:v("nb-n")}; if(document.getElementById("nb-m"))patch.m=v("nb-m");
    nbSet(id,patch); toast("✎ "+t("savedNb")); openSheet(detailSheet(id)); render()}
  if(fm.dataset.form==="nbNew"){const w=v("nbw"), m=v("nbm"); if(!w||!m)return;
    const c={id:"c"+Date.now().toString(36),w,m,mk:P().known,s:v("nbs"),y:v("nby"),n:"",at:Date.now()};
    (D.custom[tl]=D.custom[tl]||[]).push(c); persist(); ui.nbForm=false; toast("✎ "+t("savedNb")); render()}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&GL.on){glanceStop(); return}
  if(e.key==="Escape"&&sheet&&!document.querySelector("[data-ob]"))closeSheet();
  if(e.key==="Enter"&&e.target.id==="typeIn"&&!ui.sess.answered)document.querySelector('[data-a="checkType"]')?.click();
});
window.addEventListener("resize",afterRender);
render();
if(!P().onboarded){ui.ob={step:0,focus:"balanced"}; openSheet(obSheet())}
// Lock-screen word tapped: open that word.
try{const ln=LN(); if(ln){ln.addListener("localNotificationActionPerformed",ev=>{const id=ev&&ev.notification&&ev.notification.extra&&ev.notification.extra.id; if(id&&BY[id]){route="words"; render(); openSheet(detailSheet(id))}})}}catch(e){}
setTimeout(syncPassive,1500);

/* ---------- PWA ---------- */
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(); installEvt=e});
if("serviceWorker" in navigator&&!isNative&&location.protocol==="https:"){
  navigator.serviceWorker.register("sw.js").then(reg=>{if(!navigator.serviceWorker.controller)reg.addEventListener("updatefound",()=>{const w=reg.installing; w&&w.addEventListener("statechange",()=>{if(w.state==="activated")toast(t("offlineReady"))})})}).catch(()=>{});
}
window.__bhasha={D,TTS,P,stateOf,buildSession,render,deck,glanceStart,glanceStop};
