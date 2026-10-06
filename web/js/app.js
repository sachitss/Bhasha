// Bhasha app: UI, state, audio and recording. Pure logic lives in core.js.
import { ITEMS, BY, WORDS, PHR, TRV } from "./content.js";
import { S } from "./i18n.js";
import {
  DAY, LEVEL_RANK as lvlRank, applyGrade, itemState, nextInterval, formatInterval, planNumbers as planCore,
  buildSession as buildCore, coreWord, envelope, speechStats, expectedDuration, scoreRecording,
  voiceScore, isHighQualityVoice, hash, dayKey as todayKey, streakFrom, newProgress
} from "./core.js";

/* ---------- State ---------- */
const KEY="bhasha.v1";
const DEF={profile:{name:"",ui:"en",known:"en",target:"de",level:"b",minutes:20,prio:{vocab:40,listen:20,speak:25,context:15},rom:true,gender:"f"},prog:{},favs:[],act:{},refDur:{},voice:{},session:null};
let D;
try{D=JSON.parse(localStorage.getItem(KEY))||null}catch(e){D=null}
if(!D){D=JSON.parse(JSON.stringify(DEF))}
D.profile=Object.assign({},DEF.profile,D.profile||{}); D.prog=D.prog||{}; D.favs=D.favs||[]; D.act=D.act||{}; D.refDur=D.refDur||{}; D.voice=D.voice||{};
// First visit: interface follows the device language when it is one of ours.
try{if(!localStorage.getItem(KEY)){const nl=(navigator.language||"en").slice(0,2); if(["de","ne"].includes(nl)){D.profile.ui=nl; D.profile.known=nl; D.profile.target=nl==="de"?"ne":"de"}}}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
const P=()=>D.profile;
const t=(k,v)=>{let s=(S[P().ui]&&S[P().ui][k])??S.en[k]??k; if(v)for(const x in v)s=s.replace("{"+x+"}",v[x]); return s};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const prog=()=>(D.prog[P().target]=D.prog[P().target]||{});
const act=()=>(D.act[todayKey()]=D.act[todayKey()]||{min:0,xp:0,ok:0,n:0});

/* ---------- Learning engine wrappers ---------- */
function stateOf(id){return itemState(prog()[id])}
function grade(id,g){const pr=prog(); pr[id]=applyGrade(pr[id]||newProgress(),g); persist()}
function ago(ts){const n=Math.floor((Date.now()-ts)/DAY); return n<=0?t("today"):n===1?t("yesterday"):t("daysAgo",{n})}
function nextIn(ts){const d=(ts-Date.now())/DAY; return d<=0?t("today"):formatInterval(d)}
function wotd(){const pool=WORDS.filter(w=>lvlRank[w.level]<=lvlRank[P().level]); return pool[hash(todayKey()+P().target)%pool.length]}
function potd(){return BY[PHR[hash(todayKey())%PHR.length][0]]}
const streak=()=>streakFrom(D.act);
function recentAcc(){let ok=0,n=0;const d=new Date();for(let i=0;i<7;i++){const a=D.act[todayKey(d)];if(a){ok+=a.ok;n+=a.n}d.setDate(d.getDate()-1)} return n?ok/n:null}
const goalXP=()=>P().minutes*8;
function dueItems(){const pr=prog(),now=Date.now();return Object.keys(pr).filter(id=>BY[id]&&pr[id].seen&&pr[id].due<=now).sort((a,b)=>(pr[b].lapseAt||0)-(pr[a].lapseAt||0)||pr[a].due-pr[b].due)}
function planNumbers(){const due=dueItems(); return Object.assign(planCore({minutes:P().minutes,prio:P().prio,dueCount:due.length,accuracy:recentAcc()}),{due})}
function buildSession(mode){return buildCore({items:ITEMS,words:WORDS,prog:prog(),profile:P(),wotdId:wotd().id,dueIds:dueItems(),accuracy:recentAcc(),mode})}

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
const NativeTTS=()=>(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.TextToSpeech)||null;
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
    if(nt){nt.stop().catch(()=>{}); nt.speak({text,lang:{de:"de-DE",en:"en-GB",ne:"ne-NP"}[lang],rate,pitch:1,volume:1,category:"playback"}).catch(()=>toast(t("noVoice",{lang:t("lang_"+lang)}))); return}
    if(!("speechSynthesis" in window)){toast(t("noVoice",{lang:t("lang_"+lang)}));return}
    this.load(); const v=this.pick(lang);
    if(!v&&this.voices.length){toast(t("noVoice",{lang:t("lang_"+lang)}));}
    if(v&&lang==="ne"&&!v.lang.toLowerCase().startsWith("ne")&&!this.warned.hi){this.warned.hi=1;toast(t("hiFallback"))}
    const u=new SpeechSynthesisUtterance(text); u.lang=v?v.lang:{de:"de-DE",en:"en-GB",ne:"ne-NP"}[lang]; if(v)u.voice=v; u.rate=rate;
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
function expectedDur(id){const tl=P().target, it=BY[id]; return D.refDur[id+":"+tl]||expectedDuration(it[tl],tl==="ne"?it.rom:null)}
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
function addXP(x,ok){const a=act(); a.xp+=x; if(ok!==null&&ok!==undefined){a.n++; if(ok)a.ok++}
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
 stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>'};
const ic=(n)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const STSYM={new:"○",learning:"◔",familiar:"◑",mastered:"●",review:"↻"};
const pill=s=>`<span class="pill ${s}"><span aria-hidden="true">${STSYM[s]}</span>${t("st_"+s)}</span>`;
function target(item,size=""){
  const tl=P().target, g=tl==="de"&&item.kind==="word"?(item.de.match(/^(der|die|das)\s/)||[])[1]:null;
  return `<div><span class="word ${size}" lang="${tl}">${esc(item[tl])}</span>${g?`<span class="gender">${g==="der"?"m":g==="die"?"f":"n"}</span>`:""}${tl==="ne"&&P().rom?`<div class="rom">${esc(item.rom)}</div>`:""}</div>`;
}
const known=item=>esc(item[P().known]);
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
  const phr=P().level==="a"?`<section class="card stack" aria-labelledby="potdH"><div class="eyebrow" id="potdH">${t("potd")}</div>${target(p,"md")}<p>${known(p)}</p><p class="note">${esc(p.note[P().ui]||p.note.en)}</p><div class="row">${listenBtns(p.id)}${favBtn(p.id)}<button class="btn sm" data-a="speakItem" data-id="${p.id}">${ic("mic")}${t("practice")}</button></div></section>`:"";
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
   ${w.note?`<p class="note">${esc(w.note[P().ui]||w.note.en)}</p>`:""}
   <div class="row">${listenBtns(w.id)}${favBtn(w.id)}<button class="btn sm" data-a="speakItem" data-id="${w.id}">${ic("mic")}${t("practice")}</button></div>
  </section>
  ${phr}
  <section class="card stack"><div class="eyebrow">${t("rec")}</div><p>${recommendation()}</p></section>`;
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
    return `<button class="li" data-a="topic" data-t="${tp}"><div class="main"><b>${t("t_"+tp)}</b><div class="sub">${ws.slice(0,3).map(w=>esc(w[P().target])).join(" · ")}</div></div><span class="small muted" style="font-variant-numeric:tabular-nums">${started}/${ws.length}</span><span class="pill new">${t("lvl_"+ws[0].level)}</span></button>`}).join("")}</div></section>`;
}

/* ---- Session ---- */
function startSession(mode){D.session={tasks:buildSession(mode),i:0,ok:0,xp:0,mode:mode||"daily"}; ui.sess={}; sessionClock=Date.now(); persist(); route="session"; render(); document.getElementById("main").focus()}
function distractors(item,k=3){
  const tl=P().target; const pool=ITEMS.filter(i=>i.id!==item.id&&i.kind===item.kind&&i[tl]!==item[tl]);
  const same=pool.filter(i=>i.topic===item.topic); const src=(same.length>=k?same:pool).slice().sort(()=>Math.random()-0.5);
  return src.slice(0,k);
}
function vSession(){
  const s=D.session; if(!s)return vHome();
  if(s.i>=s.tasks.length){
    return `<section class="card stack" style="text-align:center;align-items:center;padding-block:32px"><div class="eyebrow">${t("done")}</div>
     <div class="score">${s.ok}/${s.tasks.filter(x=>!["study","pron"].includes(x.type)).length}</div>
     <p class="muted">${t("sessionSummary",{c:s.ok,n:s.tasks.filter(x=>!["study","pron"].includes(x.type)).length,x:s.xp})}</p>
     <p>${recommendation()}</p>
     <div class="row" style="justify-content:center"><button class="btn primary" data-a="finish">${t("backHome")}</button><button class="btn" data-a="go" data-r="progress">${t("progress")}</button></div></section>`;
  }
  const task=s.tasks[s.i], item=BY[task.id], st=ui.sess||(ui.sess={}); const tl=P().target;
  const p=prog()[item.id]; const whyTxt=task.why==="whyDue"&&p?t("whyDue",{d:ago(p.last||p.seen)}):t(task.why);
  let body="";
  if(task.type==="study"){
    body=`${target(item)}<p style="font-size:19px">${known(item)}</p>${listenBtns(item.id)}
      ${item.ex?`<div class="ex"><div class="t" lang="${tl}">${esc(item.ex[tl])}</div><div class="small muted">${esc(item.ex[P().known])}</div></div>`:""}
      ${item.note&&item.kind!=="phrase"?`<p class="note">${esc(item.note[P().ui]||item.note.en)}</p>`:""}
      <div style="margin-top:auto" class="stack"><p class="small muted">${t("recog")}</p>${gradeBtns(item.id)}</div>`;
  }
  if(task.type==="reverse"){
    body=`<p class="muted">${t("recall",{lang:t("lang_"+tl)})}</p><div class="word">${known(item)}</div>
      ${st.shown?`<div class="card" style="background:var(--surface-2);border:0">${target(item,"md")}<div style="margin-top:8px">${listenBtns(item.id)}</div></div><div style="margin-top:auto">${gradeBtns(item.id)}</div>`:`<button class="btn primary block" style="margin-top:auto" data-a="reveal">${t("show")}</button>`}`;
  }
  if(task.type==="type"){
    const ans=st.answered;
    body=`<p class="muted">${t("recall",{lang:t("lang_"+tl)})}</p><div class="word">${known(item)}</div>
     <label class="sr" for="typeIn">${t("type")}</label><input id="typeIn" class="input" lang="${tl}" autocomplete="off" placeholder="${t("type")}" ${ans?"disabled":""} value="${esc(st.typed||"")}">
     ${ans?feedback(st.ok,item)+`<button class="btn primary block" data-a="nextTask">${t("next")}</button>`:`<div class="row"><button class="btn primary" data-a="checkType">${t("check")}</button><button class="btn" data-a="dontKnow">${t("dontKnow")}</button></div>`}`;
  }
  if(task.type==="mcq"||task.type==="audio"||task.type==="fill"){
    if(!st.opts){st.opts=distractors(item).concat(item).sort(()=>Math.random()-0.5).map(i=>i.id); st.t0=Date.now()}
    let prompt="";
    if(task.type==="mcq")prompt=`<p class="muted">${t("chooseT")}</p><div class="word">${known(item)}</div>`;
    if(task.type==="audio")prompt=`<p class="muted">${t("hear")}</p><div class="row"><button class="btn gold" data-a="say" data-id="${item.id}">${ic("play")}${t("listen")}</button><button class="btn" data-a="say" data-id="${item.id}" data-rate="0.6">${ic("slow")}${t("slow")}</button></div>`;
    if(task.type==="fill"){const core=coreWord(item[tl]); const re=new RegExp(core.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i"); prompt=`<p class="muted">${t("fill")}</p><div class="word md" lang="${tl}">${esc(item.ex[tl].replace(re,"_____"))}</div><p class="small muted">${esc(item.ex[P().known])}</p>`}
    body=prompt+`<div class="opts">${st.opts.map(id=>{const o=BY[id]; let cls=""; if(st.answered){if(id===item.id)cls="ok"; else if(id===st.pick)cls="no"}
      const lab=task.type==="fill"?coreWord(o[tl]):o[tl];
      return `<button class="opt ${cls}" data-a="pick" data-id="${id}" ${st.answered?"disabled":""} lang="${tl}">${esc(lab)}${tl==="ne"&&P().rom?`<div class="rom">${esc(o.rom)}</div>`:""}</button>`}).join("")}</div>
      ${st.answered?feedback(st.ok,item)+`<button class="btn primary block" data-a="nextTask">${t("next")}</button>`:""}`;
  }
  if(task.type==="pron"){
    body=`<p class="muted">${t("pronTask")}</p>${target(item)}<p>${known(item)}</p>${recorder(item.id)}
     <button class="btn primary block" data-a="nextTask">${t("next")}</button>`;
  }
  return `<div class="row between"><button class="btn sm" data-a="pauseSession">${t("pauseExit")}</button><span class="small muted" style="font-variant-numeric:tabular-nums">${s.i+1} / ${s.tasks.length}</span></div>
   <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${s.tasks.length}" aria-valuenow="${s.i}"><i style="width:${s.i/s.tasks.length*100}%"></i></div>
   <section class="card task"><span class="why">${t(task.type==="pron"?"pronT":"learn")} · ${esc(whyTxt)}</span>${body}</section>`;
}
function gradeBtns(id){const p=prog()[id];
  return `<div class="grades">${[["again",1],["hard",2],["good",3],["easy",4]].map(([k,g])=>`<button class="btn" data-a="grade" data-g="${g}">${t(k)}<small>${formatInterval(nextInterval(p,g))}</small></button>`).join("")}</div>`;
}
function feedback(ok,item){return `<div class="fb ${ok?"ok":"no"}" role="status"><b>${ok?"✓ "+t("correct"):"✗ "+t("wrong")}</b>${ok?"":` · ${t("answer")}: <span lang="${P().target}">${esc(item[P().target])}</span>`}${item.ex?`<div class="small muted">${esc(item.ex[P().target])}</div>`:""}</div>`}

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
  const tl=P().target, q=ui.q.trim().toLowerCase();
  const list=ITEMS.filter(i=>i.kind!=="phrase"||P().level==="a").filter(i=>ui.filter==="all"||ui.filter==="fav"?(ui.filter!=="fav"||D.favs.includes(i.id)):stateOf(i.id)===ui.filter)
    .filter(i=>!q||[i.de,i.en,i.ne,i.rom].some(x=>x.toLowerCase().includes(q)));
  const counts={}; ITEMS.forEach(i=>{const s=stateOf(i.id);counts[s]=(counts[s]||0)+1});
  const f=["all","new","learning","familiar","mastered","review","fav"];
  return `<label class="sr" for="q">${t("search")}</label><input id="q" class="search" type="search" placeholder="${t("search")}" value="${esc(ui.q)}">
   <div class="chips" role="group" aria-label="Filter">${f.map(k=>`<button class="chip" data-a="filter" data-f="${k}" aria-pressed="${ui.filter===k}">${k==="all"?t("all"):k==="fav"?"★ "+t("favs"):STSYM[k]+" "+t("st_"+k)} <span class="muted">${k==="all"?ITEMS.length:k==="fav"?D.favs.length:counts[k]||0}</span></button>`).join("")}</div>
   <div class="list">${list.slice(0,120).map(i=>`<button class="li" data-a="detail" data-id="${i.id}"><div class="main"><div class="word sm" lang="${tl}">${esc(i[tl])}${tl==="ne"&&P().rom?` <span class="rom">${esc(i.rom)}</span>`:""}</div><div class="sub">${esc(i[P().known])} · ${t("t_"+i.topic)}</div></div>${pill(stateOf(i.id))}</button>`).join("")||`<div class="li muted">–</div>`}</div>`;
}
function detailSheet(id){
  const i=BY[id], tl=P().target, p=prog()[id];
  return `<div class="sheet-bg" data-a="closeSheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(i[tl])}" data-stop>
   <div class="row between"><span class="eyebrow">${t("t_"+i.topic)} · ${t("lvl_"+i.level)}</span>${pill(stateOf(id))}</div>
   ${target(i)}<p style="font-size:18px">${known(i)}</p>
   ${i.ex?`<div class="ex"><div class="eyebrow">${t("example")}</div><div class="t" lang="${tl}">${esc(i.ex[tl])}</div><div class="small muted">${esc(i.ex[P().known])}</div></div>`:""}
   ${i.note?`<p class="note">${esc(i.note[P().ui]||i.note.en)}</p>`:""}
   ${p&&p.seen?`<p class="small muted">${t("nextRev")}: ${nextIn(p.due)} · ✓ ${p.ok} · ✗ ${p.bad}</p>`:""}
   <div class="row">${listenBtns(id)}${favBtn(id)}<button class="btn sm" data-a="speakItem" data-id="${id}">${ic("mic")}${t("practice")}</button></div>
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
  const tl=P().target, sits=[...new Set(TRV.map(r=>r[1]))];
  const list=ITEMS.filter(i=>i.kind==="travel"&&(ui.sit==="all"||i.sit===ui.sit));
  const done=ITEMS.filter(i=>i.kind==="travel"&&stateOf(i.id)!=="new").length, total=TRV.length;
  return `<section class="card wotd stack"><div class="row between"><div><h2 class="word md" style="font-size:22px">${t("trip")}</h2><p class="small muted">${t("tripSub")} · ${done}/${total}</p></div><button class="btn gold" data-a="trip">${t("practice")}</button></div></section>
   <div class="chips" role="group" aria-label="${t("travel")}"><button class="chip" data-a="sit" data-s="all" aria-pressed="${ui.sit==="all"}">${t("all")}</button>${sits.map(s=>`<button class="chip" data-a="sit" data-s="${s}" aria-pressed="${ui.sit===s}">${t("sit_"+s)}</button>`).join("")}</div>
   <div class="list">${list.map(i=>`<div class="li" style="flex-wrap:wrap"><div class="main" style="min-width:200px"><div class="eyebrow" style="font-size:11px">${t("sit_"+i.sit)}</div><div class="word sm" lang="${tl}">${esc(i[tl])}</div>${tl==="ne"&&P().rom?`<div class="rom">${esc(i.rom)}</div>`:""}<div class="sub" style="white-space:normal">${esc(i[P().known])}</div></div>
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
   <section class="card stack"><div class="eyebrow">${t("words")} · ${t("lang_"+P().target)}</div>
    <div class="stack-bar" role="img" aria-label="${Object.entries(counts).map(([k,v])=>t("st_"+k)+" "+v).join(", ")}">${Object.entries(counts).map(([k,v])=>v?`<span style="width:${v/all.length*100}%;background:${col[k]}"></span>`:"").join("")}</div>
    <div class="legend">${Object.entries(counts).map(([k,v])=>`<span><span aria-hidden="true" style="color:${col[k]}">■</span> ${STSYM[k]} ${t("st_"+k)} <b style="color:var(--ink)">${v}</b></span>`).join("")}</div></section>
   <section class="card stack"><div class="eyebrow">${t("weak")}</div>${weak.length?`<div class="list">${weak.map(k=>`<button class="li" data-a="detail" data-id="${k}"><div class="main"><div class="word sm" lang="${P().target}">${esc(BY[k][P().target])}</div><div class="sub">${esc(BY[k][P().known])}</div></div><span class="small muted">✗ ${pr[k].bad}</span></button>`).join("")}</div>`:`<p class="muted">${t("recEmpty")}</p>`}
    <p><b>${t("rec")}:</b> ${recommendation()}</p></section>`;
}

/* ---- Profile sheet ---- */
function profileSheet(){
  const p=P(), langs=["de","en","ne"];
  const seg=(key,opts,lab)=>`<div class="seg" role="group">${opts.map(o=>`<button data-a="setp" data-k="${key}" data-v="${o}" aria-pressed="${String(p[key])===String(o)}">${lab(o)}</button>`).join("")}</div>`;
  const pr=p.prio, tot=pr.vocab+pr.listen+pr.speak+pr.context||1;
  return `<div class="sheet-bg" data-a="closeSheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="${t("profile")}" data-stop>
   <h2 class="word md" style="font-size:24px">${t("profile")}</h2>
   <div class="field"><label for="pname">${t("name")}</label><input id="pname" class="text-in" value="${esc(p.name)}" autocomplete="given-name"></div>
   <div class="field"><label>${t("uiLang")}</label>${seg("ui",langs,l=>({de:"Deutsch",en:"English",ne:"नेपाली"})[l])}</div>
   <div class="field"><label>${t("iSpeak")}</label>${seg("known",langs,l=>t("lang_"+l))}</div>
   <div class="field"><label>${t("iLearn")}</label>${seg("target",langs.filter(l=>l!==p.known),l=>t("lang_"+l))}</div>
   <div class="field"><label>${t("level")}</label>${seg("level",["b","i","a"],l=>t("lvl_"+l))}</div>
   <div class="field"><label>${t("daily")}</label>${seg("minutes",[10,20,30,45,60],m=>(m===20?"10–20":m)+" "+t("min"))}</div>
   <div class="field"><label>${t("focus")}</label>${["vocab","listen","speak","context"].map(k=>`<div class="meter" style="grid-template-columns:130px 1fr 44px"><label for="pr-${k}" style="font-weight:400">${t("f_"+k)}</label><input id="pr-${k}" type="range" min="0" max="100" step="5" value="${pr[k]}" data-prio="${k}"><b>${Math.round(pr[k]/tot*100)}%</b></div>`).join("")}</div>
   <div class="field"><label>${t("voiceGender")}</label>${seg("gender",["f","m"],g=>t("g_"+g))}</div>
   ${voiceFields()}
   <label class="row" style="gap:10px"><input type="checkbox" id="prom" ${p.rom?"checked":""} data-rom style="width:20px;height:20px;accent-color:var(--brand)"> ${t("showRom")}</label>
   <div class="row">${installEvt?`<button class="btn sm" data-a="install">${t("installApp")}</button>`:""}<button class="btn sm" data-a="downloadData">${t("download")}</button><button class="btn sm" data-a="copyData">${t("copy")}</button><button class="btn sm" data-a="reset" style="color:var(--bad)">${ui.resetArm?t("confirmReset"):t("reset")}</button></div>
   <button class="btn primary block" data-a="closeSheet">${t("close_")}</button></div></div>`;
}

function voiceFields(){
  const langs=[P().target].concat(["de","en","ne"].filter(l=>l!==P().target));
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
const TESTS={de:"Guten Morgen! Ich lerne gerade Deutsch. Wie geht es Ihnen?",en:"Good morning! I'm learning English. How are you?",ne:"नमस्ते! म नेपाली सिक्दैछु। तपाईंलाई कस्तो छ?"};

/* ---------- Events ---------- */
let sheet=null;
function openSheet(html){sheet=html;document.getElementById("layer").innerHTML=html;const s=document.querySelector(".sheet");s&&s.querySelector("button,input")?.focus()}
function closeSheet(){sheet=null;document.getElementById("layer").innerHTML="";ui.resetArm=false;render()}
let toastT; function toast(msg){clearTimeout(toastT);let el=document.querySelector(".toast"); if(!el){el=document.createElement("div");el.className="toast";el.setAttribute("role","status");document.body.appendChild(el)} el.textContent=msg; toastT=setTimeout(()=>el.remove(),4200)}

function advance(){D.session.i++; ui.sess={}; persist(); render(); document.getElementById("main").focus()}
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
    case"grade":{const g=+el.dataset.g; grade(task.id,g); const x=task.type==="study"?5:(g>1?10:2); s.xp+=x; if(task.type!=="study"&&g>1)s.ok++; addXP(x,task.type==="study"?null:g>1); advance(); break}
    case"pick":{const st=ui.sess; st.answered=true; st.pick=id; st.ok=id===task.id; const fast=Date.now()-st.t0<4000;
      grade(task.id,st.ok?(fast?4:3):1); const x=st.ok?10:2; s.xp+=x; if(st.ok)s.ok++; addXP(x,st.ok);
      if(task.type==="audio"||!st.ok)TTS.speak(BY[task.id][P().target],P().target,1,task.id);
      document.getElementById("live").textContent=st.ok?t("correct"):t("wrong"); render(); break}
    case"checkType":case"dontKnow":{const st=ui.sess, v=(document.getElementById("typeIn")||{}).value||""; st.typed=v;
      const norm=x=>coreWord(x).toLowerCase().normalize("NFC").replace(/[^\p{L}\p{M}\p{N} ]/gu,"").trim();
      st.ok=a==="checkType"&&norm(v)===norm(BY[task.id][P().target]); st.answered=true; grade(task.id,st.ok?3:1); const x=st.ok?10:2; s.xp+=x; if(st.ok)s.ok++; addXP(x,st.ok); render(); break}
    case"nextTask":advance(); break;
    case"startRec":startRec(id); break;
    case"stopRec":stopRec(id); break;
    case"selfRate":{grade(id,+el.dataset.g); toast("✓ "+t("nextRev")+": "+nextIn(prog()[id].due)); el.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b===el)); break}
    case"speakItem":ui.speakId=id; if(sheet){sheet=null;document.getElementById("layer").innerHTML=""} route="speak"; render(); window.scrollTo(0,0); break;
    case"filter":ui.filter=el.dataset.f; render(); break;
    case"sit":ui.sit=el.dataset.s; render(); break;
    case"topic":ui.filter="all"; ui.q=""; route="words"; render(); setTimeout(()=>{const first=WORDS.find(w=>w.topic===el.dataset.t); if(first)openSheet(detailSheet(first.id))},0); break;
    case"detail":openSheet(detailSheet(id)); break;
    case"setp":{const k=el.dataset.k; let v=el.dataset.v; if(k==="minutes")v=+v; P()[k]=v;
      if(k==="known"&&P().target===v)P().target=["de","en","ne"].find(l=>l!==v);
      if(k==="gender"){D.voice={}; const l=P().target; if(nativeVoiceName(l))TTS.speak(BY.g1.ex[l],l,1,"g1.ex"); else TTS.speak(TESTS[l],l,1)}
      persist(); openSheet(profileSheet()); render(); break}
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
  if(e.target.dataset.prio){P().prio[e.target.dataset.prio]=+e.target.value; persist(); const pr=P().prio,tot=pr.vocab+pr.listen+pr.speak+pr.context||1; document.querySelectorAll("[data-prio]").forEach(r=>r.parentElement.querySelector("b").textContent=Math.round(pr[r.dataset.prio]/tot*100)+"%")}
});
document.addEventListener("change",e=>{
  if(e.target.dataset.up){const f=e.target.files&&e.target.files[0]; if(f)handleBlob(e.target.dataset.up,f)}
  if(e.target.dataset.voice){D.voice[e.target.dataset.voice]=e.target.value; persist(); TTS.speak(TESTS[e.target.dataset.voice],e.target.dataset.voice,1); openSheet(profileSheet())}
  if(e.target.dataset.rom!==undefined){P().rom=e.target.checked; persist(); render()}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&sheet)closeSheet();
  if(e.key==="Enter"&&e.target.id==="typeIn"&&!ui.sess.answered)document.querySelector('[data-a="checkType"]')?.click();
});
window.addEventListener("resize",afterRender);
render();

/* ---------- PWA ---------- */
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(); installEvt=e});
const isNative=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())||!!window.__TAURI_INTERNALS__;
if("serviceWorker" in navigator&&!isNative&&location.protocol==="https:"){
  navigator.serviceWorker.register("sw.js").then(reg=>{if(!navigator.serviceWorker.controller)reg.addEventListener("updatefound",()=>{const w=reg.installing; w&&w.addEventListener("statechange",()=>{if(w.state==="activated")toast(t("offlineReady"))})})}).catch(()=>{});
}
window.__bhasha={D,TTS,P,stateOf,buildSession,render};
