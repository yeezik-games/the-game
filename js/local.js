// ===== The Game · un solo telefono che passa di mano =====
let L=null,lsetup=null;
ICON.swap='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>';

function myLocalName(){return profile?profile.username:(guestSaved.raw||'')}
function initSetup(){
  const saved=ls.get('thegame_local')||{};
  lsetup={opts:{pro:!!(saved.opts&&saved.opts.pro),fire:!!(saved.opts&&saved.opts.fire)},names:[myLocalName()],recent:(saved.names||[]).filter(Boolean).slice(0,20)};
}

// ----- preparazione -----
SCREENS.localsetup=()=>{
  if(!lsetup)initSetup();
  const S=lsetup,n=S.names.length;
  return`
  <div class="topline"><button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button><b class="ttl">Un solo telefono</b><span style="width:44px"></span></div>
  <p class="sub tc">Il tavolo è in mezzo a voi: al tuo turno prendi il telefono, guardi solo la tua mano e lo passi.</p>
  <h3>Giocatori · ${n}/${MAXP}</h3>
  <div class="flist" id="lnames">${S.names.map((v,i)=>{const col=COLORS[i%COLORS.length];
    if(i===0)return profile?`<div class="frow lname">${av({name:profile.username,color:col})}<div class="fi"><b>${nm(profile)}</b><small>Sei tu</small></div></div>`
      :`<div class="frow lname">${av({name:v||'?',color:col})}<input class="lnin" data-i="0" maxlength="14" placeholder="Il tuo nome" value="${esc(v)}" autocomplete="off" aria-label="Il tuo nome"><small class="youtag">tu</small></div>`;
    return`<div class="frow lname">${av({name:v,color:col})}<div class="fi"><b>${esc(v)}</b></div><button type="button" class="iconbtn sm" data-go="l-del" data-i="${i}" aria-label="Togli ${esc(v)}">${ICON.x}</button></div>`}).join('')}</div>
  ${n<MAXP?`<button type="button" class="btn ghost big addp" data-go="l-add">${ICON.plus}Aggiungi giocatore</button>`:''}
  ${n===1?'<p class="hint" style="margin:10px 0 0">Da solo giochi la variante solitario, con 8 carte in mano</p>':''}
  <h3>Regole</h3>
  ${optsHtml(S.opts,true,'data-go').replace(/data-go="opt"/g,'data-go="l-opt"')}
  <button type="button" class="btn primary big" data-go="l-start" style="margin-top:18px">${n===1?'Gioca in solitario':'Inizia la partita'}</button>
  <p class="hint" style="margin-top:12px">${profile?'Le partite su un solo telefono finiscono nelle tue statistiche, separate da quelle online.':'Accedi con un account per salvare queste partite nelle statistiche.'}</p>`;
};
BIND.localsetup=()=>{document.querySelectorAll('.lnin').forEach(i=>{i.oninput=()=>{lsetup.names[+i.dataset.i]=i.value;const a=i.parentElement.querySelector('.av');if(a)a.textContent=(i.value||'?')[0].toUpperCase()}})};

function addLocalName(raw){
  const n=String(raw||'').trim().slice(0,14);
  if(!n){toast('Scrivi un nome');return false}
  if(lsetup.names.some(x=>x.trim().toLowerCase()===n.toLowerCase())){toast(`${n} è già al tavolo`);return false}
  if(lsetup.names.length>=MAXP){toast('The Game si gioca al massimo in 5');return false}
  lsetup.names.push(n);buzz(12);SFX.tap();
  if(view==='localsetup')refresh();
  const m=document.querySelector('.modal.addp-m');if(m)drawAddPlayer(m);
  return true;
}
function drawAddPlayer(m){
  const added=lsetup.names.slice(1).filter(Boolean),recent=(lsetup.recent||[]).filter(r=>!lsetup.names.some(x=>x.toLowerCase()===r.toLowerCase())).slice(0,8);
  m.querySelector('#addlist').innerHTML=(added.length?`<div class="chips left" style="margin:0 0 12px">${added.map((x,i)=>`<span class="chip done">${av({name:x,color:COLORS[(i+1)%COLORS.length]},'sm')}${esc(x)}</span>`).join('')}</div>`:'')
    +(recent.length?`<p class="lbl" style="margin:14px 0 8px">Hanno già giocato</p><div class="chips left" style="margin:0">${recent.map(r=>`<span class="rchip"><button type="button" class="rc-add" data-go="l-quick" data-n="${esc(r)}">+ ${esc(r)}</button><button type="button" class="rc-del" data-go="l-forget" data-n="${esc(r)}" aria-label="Togli ${esc(r)} dalla lista">${ICON.x}</button></span>`).join('')}</div>`:'');
}
function openAddPlayer(){
  if(lsetup.names.length>=MAXP){toast('The Game si gioca al massimo in 5');return}
  const m=document.createElement('div');m.className='modal addp-m';
  m.innerHTML=`<div class="sheet" role="dialog" aria-label="Aggiungi giocatore"><div class="grab"></div>
    <h2 style="text-align:left;margin:4px 0 4px">Aggiungi un giocatore</h2>
    <p class="hint" style="text-align:left;margin:0 0 14px">Scrivi il nome e premi Aggiungi. Al massimo 5 al tavolo.</p>
    <form id="addform"><input id="addname" maxlength="14" placeholder="Nome del giocatore" autocomplete="off" autocapitalize="words">
    <button type="submit" class="btn primary big" style="margin-top:12px">${ICON.plus}Aggiungi</button></form>
    <div id="addlist" style="margin-top:14px"></div>
    <button type="button" class="btn ghost big close" style="margin-top:12px">Fatto</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  const i=m.querySelector('#addname');
  m.querySelector('#addform').onsubmit=e=>{e.preventDefault();if(addLocalName(i.value)){i.value='';i.focus()}};
  document.body.appendChild(m);drawAddPlayer(m);setTimeout(()=>i.focus(),300);
}
function startLocal(){
  const S=lsetup;
  const names=S.names.map(x=>x.trim()).filter(Boolean);
  if(!names.length){toast('Scrivi il tuo nome');return}
  const low=names.map(x=>x.toLowerCase());
  if(new Set(low).size!==low.length){toast('Ci sono due giocatori con lo stesso nome');return}
  ls.set('thegame_local',{opts:S.opts,names:[...new Set(names.slice(profile?1:0).concat(S.recent||[]))].slice(0,20)});
  if(!profile&&names[0]){guestSaved.raw=guestSaved.raw||names[0];ls.set('thegame_guest',guestSaved)}
  const meFirst=!!profile&&S.names[0]===profile.username;
  L={players:names.map((n,i)=>({id:'p'+i,name:n,color:COLORS[i%COLORS.length],me:meFirst&&i===0,uid:meFirst&&i===0?profile.id:null})),opts:{...S.opts},matchId:uuid(),log:[]};
  L.order=L.players.map(p=>p.id);
  TG.deal(L);
  sel=null;lastTops=[];lastHand=null;
  L.view=L.order.length>1?'choose':'turn';
  show('local');buzz(30);
}

// ----- schermate di gioco -----
const LP=id=>L.players.find(p=>p.id===id)||{name:'?',color:'#fff'};
const L_VIEWS={
  choose:()=>`<div class="choose"><p class="lbl tc">Carte distribuite</p><h1 class="headline tc">Chi inizia?</h1>
    <p class="sub tc">Decidete insieme chi apre la partita, oppure lasciate fare al caso.</p>
    <div class="flist">${L.order.map(id=>{const p=LP(id);return`<button type="button" class="frow vote" data-go="l-begin" data-id="${id}">${av(p)}<div class="fi"><b>${nm(p)}</b><small>Tocca per farlo iniziare</small></div><span class="btn sm primary gostart">Inizia</span></button>`}).join('')}</div>
    <button type="button" class="btn ghost big" data-go="l-begin" data-id="" style="margin-top:14px">🎲 Scegli a caso</button></div>`,
  pass:()=>{const p=LP(TG.cur(L));return`<div class="pass">
    <div class="passicon">${ICON.swap}</div>
    <p class="lbl tc">Passa il telefono a</p>
    ${av(p,'xl')}
    <h1 class="headline tc">${nm(p)}</h1>
    <p class="sub tc">${L.played&&L.played.length?'':'Tocca a te calare.'} Gli altri non guardano la tua mano 🙈</p>
    <div class="passcards" aria-hidden="true"><span class="gc backside"><b>THE<br>GAME</b></span><span class="gc backside"><b>THE<br>GAME</b></span><span class="gc backside"><b>THE<br>GAME</b></span></div>
    <button type="button" class="btn primary big" data-go="l-show">Sono io, mostra le mie carte</button>
    <p class="hint">Mazzo: ${L.deck.length} carte · ${TG.remaining(L)} ancora da calare</p></div>`},
  turn:()=>`<div id="tablebox"></div>`,
  end:()=>{const r=L.result||{remaining:0},[t,sub]=TG.verdict(r),pct=Math.round((98-r.remaining)/98*100);
    return`<div class="bigres ${r.won?'win':''} ${r.reason==='fire'?'burn':''}"><p class="lbl">${r.won?'Carte rimaste':'Carte non calate'}</p><div class="n">${r.remaining}</div><h2>${esc(t)}</h2><p>${esc(sub)}</p>
      <div class="meter"><span style="width:${pct}%"></span></div><div class="meterl"><span>${98-r.remaining} calate</span><span>98</span></div>
      <div class="rtags">${L.opts.pro?'<span class="tag">💀 Professionisti</span>':''}${L.opts.fire?'<span class="tag">🔥 On Fire</span>':''}<span class="tag">📱 ${L.order.length===1?'Solitario':L.order.length+' giocatori'}</span></div></div>
      <h3>La squadra</h3>
      <div class="flist">${L.order.map(id=>{const p=LP(id),st=L.stats[id]||{played:0,backs:0};return`<div class="frow">${av(p)}<div class="fi"><b>${nm(p)}</b><small>${st.played} ${st.played===1?'carta calata':'carte calate'}${st.backs?` · ${st.backs} ${st.backs===1?'mossa':'mosse'} al contrario`:''}</small></div></div>`}).join('')}</div>
      <button type="button" class="btn big sharebtn" data-go="share" style="margin-top:18px">📸 Condividi il risultato</button>
      <button type="button" class="btn primary big" data-go="l-again" style="margin-top:10px">🔁 Rivincita</button>
      <button type="button" class="btn ghost big" data-go="l-home" style="margin-top:10px">Torna alla home</button>`}
};
SCREENS.local=()=>L?L_VIEWS[L.phase==='end'?'end':L.view]():'';
function lTop(){
  const cur=L.phase==='play'?TG.cur(L):null;
  $('#top').innerHTML=`<div class="bar g3"><button class="exit" data-go="l-exit" aria-label="Esci dalla partita"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Esci</button><span class="codechip">${ICON.phone.replace('width="28" height="28"','width="16" height="16"')} Offline</span>${soundBtn('iconbtn sm sndb')}</div>
  ${L.phase==='play'?`<div class="scores">${L.order.map(id=>{const p=LP(id),n=(L.hands[id]||[]).length;return`<span class="sc ${id===cur?'psy':''} ${!n?'out':''}">${av(p,'sm')}${nm(p)} <span class="cnt">${n?`<span class="cback"></span>${n}`:'fuori'}</span></span>`}).join('')}</div>`:''}`;
}
function lDyn(){
  lTop();
  if(L.phase==='play'&&L.view==='turn'){
    const cur=TG.cur(L),need=TG.min(L),done=L.played.length;
    const status=done<need?`${esc(LP(cur).name)} · ancora ${need-done}`:`${esc(LP(cur).name)} · puoi chiudere`;
    const tb=$('#tablebox');if(tb)tb.innerHTML=tableHtml(L,{viewer:cur,myTurn:true,status,statusMine:true,act:'data-go'});
    setDock(handHtml(L,cur,true,'data-go')+turnActions(L,cur,'data-go'));
  }else setDock('');
}
BIND.local=()=>{
  if(!L)return goHome();
  lDyn();
  if(L.phase==='end'){const r=L.result||{};if(r.won){confetti(220,600);SFX.fanfare(.6)}else if(r.remaining<10&&r.reason!=='fire'){confetti(120,600);SFX.fanfare(.6)}else SFX.drum(0,.8);saveLocal()}
  else if(L.view==='pass')SFX.whoosh();
};
function lgo(){$('#app').innerHTML=SCREENS.local();enterAnim();BIND.local();window.scrollTo(0,0)}
function saveLocal(){
  if(!profile||!L||L.saved)return;const mine=L.players.find(p=>p.me);if(!mine)return;
  L.saved=true;const st=L.stats[mine.id]||{played:0,backs:0};
  saveResult({match_id:L.matchId,mode:'offline',room_code:null,players:L.order.length,remaining:L.result.remaining,won:!!L.result.won,burned:L.result.reason==='fire',pro:!!L.opts.pro,fire:!!L.opts.fire,
    cards_played:Math.max(0,Math.min(98,st.played)),reverse_moves:Math.max(0,Math.min(98,st.backs)),others:L.players.filter(p=>!p.me).map(p=>p.name.slice(0,22)).slice(0,5)});
}

// ----- azioni -----
const LOCAL_GO={
  local:()=>{initSetup();show('localsetup')},
  'l-add':()=>openAddPlayer(),
  'l-quick':el=>{addLocalName(el.dataset.n)},
  'l-forget':el=>{const n=el.dataset.n.toLowerCase();lsetup.recent=(lsetup.recent||[]).filter(r=>r.toLowerCase()!==n);
    const sv=ls.get('thegame_local')||{};sv.names=(sv.names||[]).filter(r=>String(r).toLowerCase()!==n);ls.set('thegame_local',sv);
    const m=document.querySelector('.modal.addp-m');if(m)drawAddPlayer(m);buzz(10)},
  'l-del':el=>{lsetup.names.splice(+el.dataset.i,1);refresh()},
  'l-opt':el=>{const k=el.dataset.k;lsetup.opts[k]=!lsetup.opts[k];SFX.tap();refresh()},
  'l-start':()=>startLocal(),
  'l-begin':el=>{if(!L||!TG.begin(L,el.dataset.id||null))return;buzz(20);SFX.chime();L.view='pass';lastHand=null;lgo()},
  'l-show':()=>{L.view='turn';lastHand=null;sel=null;lgo()},
  card:el=>{if(!L)return;const c=+el.dataset.c;sel=sel===c?null:c;SFX.tap();lDyn()},
  pile:el=>{if(!L||L.phase!=='play')return;if(sel==null){toast('Prima tocca una carta della tua mano');return}
    const c=sel,pi=+el.dataset.i;sel=null;if(!TG.play(L,TG.cur(L),pi,c)){toast('Lì non entra');lDyn();return}
    buzz(15);SFX.pop();if(L.phase==='end')lgo();else lDyn()},
  undo:()=>{if(!L)return;TG.undo(L,TG.cur(L));lDyn()},
  end:()=>{if(!L)return;const before=TG.cur(L);if(!TG.end(L,before))return;buzz(20);SFX.whoosh();sel=null;
    if(L.phase==='end')return lgo();
    if(TG.cur(L)!==before){L.view='pass';lastHand=null;lgo()}else{lastHand=null;lDyn()}},
  giveup:()=>{if(!L)return;if(confirm('Chiudere la partita? Si contano le carte rimaste.')){TG.finish(L,'stuck',TG.cur(L));lgo()}},
  'l-again':()=>{const names=L.order.map(id=>LP(id).name);lsetup={opts:{...L.opts},names,recent:lsetup?lsetup.recent:[]};startLocal()},
  'l-home':()=>{L=null;setDock('');goHome()},
  'l-exit':()=>{if(L.phase==='end'||confirm('Uscire dalla partita? Questa partita andrà persa.')){L=null;setDock('');goHome()}},
  stab:el=>{statsTab=el.dataset.t;refresh()}
};
function localGuard(){
  if(view==='local'&&L&&L.phase!=='end'){
    if(confirm('Uscire dalla partita? Questa partita andrà persa.')){L=null;setDock('');return false}
    return true;
  }
  return false;
}
