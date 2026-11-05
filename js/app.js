// ===== The Game · account, amici, inviti, statistiche e schermate fuori dalla stanza =====
const GAME='thegame',GAME_NAMES={thegame:'The Game',sintonia:'Sintonia',nomination:'Nomination',nonhomai:'Non ho mai'};
let statsTab='online';
let session=null,profile=null,view='welcome',pendingRoom=null,homeErr='';
let friends={accepted:[],incoming:[],outgoing:[]},invites=[],onlineMap={},profCache={};
let presenceCh=null,userCh=null,statsCache=null,invitedHere=new Set(),loginMode='login';
const recorded=new Set(ls.get('thegame_recorded')||[]);
const TABS=['home','amici','stats'];
const ICON={
  phone:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
  plus:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  enter:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',
  back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  bell:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/></svg>',
  user:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>',
  mail:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  chart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  qr:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8"/></svg>',
  search:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  x:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  play:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18a9 9 0 0 1 18 0M12 18l4-6"/></svg>',
  people:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-5-5"/></svg>'
};
const guestPreview=n=>'anon_'+(String(n||'').toLowerCase().replace(/[^a-z0-9._]/g,'').slice(0,16)||'…');
const cleanUser=v=>String(v||'').toLowerCase().replace(/[^a-z0-9._]/g,'').slice(0,16);
const isFriendOnline=id=>!!onlineMap[id];
const ago=t=>{const s=(Date.now()-new Date(t).getTime())/1000;if(s<60)return'adesso';if(s<3600)return Math.floor(s/60)+' min fa';if(s<86400)return Math.floor(s/3600)+' h fa';const d=Math.floor(s/86400);return d===1?'ieri':d+' giorni fa'};

// ===== Router =====
let navStack=[];
function show(v,err,o={}){
  if(code)return;
  if(o.root)navStack=[];
  else if(!o.back&&view&&view!==v&&SCREENS[view]&&view!=='username'){navStack.push(view);if(navStack.length>20)navStack.shift();try{history.pushState({sint:'v'},'')}catch(e){}}
  view=v;homeErr=err||'';
  const html=(SCREENS[v]||SCREENS.welcome)();
  $('#top').innerHTML='';setDock('');
  $('#app').innerHTML=html;enterAnim();
  renderTabs();
  if(BIND[v])BIND[v]();
  window.scrollTo(0,0);
}
function refresh(){if(!code&&SCREENS[view]){const y=window.scrollY;const ae=document.activeElement&&document.activeElement.id;if(ae&&/^(user|gname|codein|fsearch|lemail|lpass)$/.test(ae))return refreshParts();$('#app').innerHTML=SCREENS[view]();renderTabs();if(BIND[view])BIND[view]();window.scrollTo(0,y)}}
function refreshParts(){const el=$('#fresults');if(el&&view==='amici')searchFriends(true)}
function renderTabs(){
  const t=$('#tabs');
  if(!profile||!TABS.includes(view)){t.innerHTML='';document.body.classList.remove('has-tabs');return}
  document.body.classList.add('has-tabs');
  const badge=friends.incoming.length?`<span class="tb-badge">${friends.incoming.length}</span>`:'';
  t.innerHTML=`<button type="button" data-go="home" class="${view==='home'?'on':''}">${ICON.play}Gioca</button><button type="button" data-go="amici" class="${view==='amici'?'on':''}">${ICON.people}Amici${badge}</button><button type="button" data-go="stats" class="${view==='stats'?'on':''}">${ICON.chart}Profilo</button>`;
}
function goHome(err){if(err)toast(err,4000);if(profile)show('home','',{root:true});else show('welcome',err,{root:true})}
function backNow(){const prev=navStack.pop()||(profile?'home':'welcome');show(prev,'',{back:true})}
function goBack(){if(navStack.length){try{history.back()}catch(e){backNow()}}else show(profile?'home':'welcome','',{root:true})}
window.addEventListener('popstate',()=>{
  document.querySelectorAll('.modal').forEach(m=>m.remove());
  if(code){
    if(confirm(isHost?"Sei l'host: se esci la partita si ferma per tutti (potrai riprenderla dalla home). Uscire?":'Uscire dal tavolo?')){leave();goHome()}
    else{try{history.pushState({sint:'room'},'')}catch(e){}}
    return;
  }
  if(window.localGuard&&localGuard()){try{history.pushState({sint:'v'},'')}catch(e){}return}
  backNow();
});

// ===== Schermate =====
const playCards=(sub1,sub2)=>`
  <button type="button" class="playcard create" data-go="create"><span class="pi">${ICON.plus}</span><span class="pt"><b>Crea un tavolo</b><small>${sub1}</small></span></button>
  <button type="button" class="playcard join" data-go="entra"><span class="pi">${ICON.enter}</span><span class="pt"><b>Entra in un tavolo</b><small>${sub2}</small></span></button>`;
const resumeBtn=()=>{const s=ls.get('thegame_host');if(!(s&&s.state&&s.state.hostId===me.id&&s.state.phase!=='end'))return'';
  const S=s.state,n=(S.players||[]).length,lobby=S.phase==='lobby';
  const info=lobby?`Tavolo ${esc(s.code)} · in attesa · ${n} ${n===1?'giocatore':'giocatori'}`:`Tavolo ${esc(s.code)} · mazzo ${(S.deck||[]).length} · ${n} ${n===1?'giocatore':'giocatori'}`;
  return`<div class="resume"><span class="pi sm rs">${ICON.play}</span><div class="rt"><b>${lobby?'Tavolo aperto':'Partita in corso'}</b><small>${info}${s.at?' · '+ago(s.at):''}</small></div><button type="button" class="btn sm primary" data-go="resume">Riprendi</button><button type="button" class="iconbtn sm" data-go="resume-x" aria-label="Chiudi la partita">${ICON.x}</button></div>`};
function level(xp){return{lv:Math.floor(xp/500)+1,cur:xp%500}}

const SCREENS={
  welcome:()=>`
    <div class="topline slim">${soundBtn('iconbtn sm sndb')}<button type="button" class="linkbtn plain" data-go="login">${ICON.user} Accedi</button></div>
    ${homeErr?`<div class="err">${esc(homeErr)}</div>`:''}
    ${webOk?'':`<div class="err">Stai aprendo il gioco come file o in anteprima: per giocare con gli amici caricalo online (es. GitHub Pages) e apri quel link.</div>`}
    <div class="hero2">
      <div class="herofan" aria-hidden="true">${dirHtml('up')}${cardHtml(37)}${cardHtml(66,true)}${cardHtml(99)}</div>
      <h1 class="tglogo"><span>The</span>Game</h1>
      <p class="script">Gioca finché puoi…</p>
      <p class="sub tc">Una sola squadra contro 98 carte</p>
    </div>
    <div class="actions">
      ${pendingRoom?`<button type="button" class="btn big join2 tile" data-go="create">${ICON.plus}<span>Crea un nuovo tavolo</span><small>Sei l'host</small></button><button type="button" class="btn primary big tile" data-go="g-join">${ICON.enter}<span>Entra nel tavolo ${esc(pendingRoom)}</span><small>Ti hanno invitato</small></button>`
        :`<button type="button" class="btn primary big tile" data-go="create">${ICON.plus}<span>Crea un tavolo</span><small>Sei l'host</small></button><button type="button" class="btn big join2 tile" data-go="entra">${ICON.enter}<span>Entra in un tavolo</span><small>Codice o QR</small></button>`}
      <button type="button" class="btn big tile solo" data-go="local">${ICON.phone||''}<span>Un solo telefono</span><small>Passatevelo a turno</small></button><button type="button" class="btn big tile howt" data-go="rules"><span class="qic">?</span><span>Come si gioca</span><small>Le regole in un minuto</small></button>
      ${resumeBtn()}
    </div>
    ${me.name?`<button type="button" class="whoami" data-go="gname">${av({name:me.name,color:me.color},'sm')}Giochi come <b>${esc(me.name)}</b><span>cambia</span></button>`:''}
    <div class="foot2"><button type="button" class="linkbtn plain" data-go="login">Accedi per statistiche e amici</button></div>
    <yeezik-hub-link></yeezik-hub-link>`,

  username:()=>{const changing=!!profile;return`
    <div class="topline">${changing?`<button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button>`:'<span></span>'}<span class="lbl" style="margin:0">${changing?'Cambia nome utente':'Ultimo passo'}</span><span></span></div>
    <div style="display:flex;justify-content:center;margin-top:10px"><span class="av xl" id="uav" style="--c:${esc(profile?profile.color:me.color)}">${esc((profile?profile.username:'?')[0].toUpperCase())}</span></div>
    <h1 class="headline tc">Scegli il tuo<br>nome utente</h1>
    <p class="sub tc">Ti serve per giocare, farti trovare dagli amici e salvare le tue partite. È solo tuo: nessun altro può usarlo.</p>
    <div><label class="lbl" for="user">Nome utente</label>
      <div class="uwrap" id="uwrap"><input id="user" maxlength="16" placeholder="es. yeezik" value="${esc(profile?profile.username:'')}" autocomplete="off" autocapitalize="off" spellcheck="false"><span class="ustate" id="ustate"></span></div>
      <p class="umsg" id="umsg"></p></div>
    <div id="usug"></div>
    <ul class="urules"><li>Da 3 a 16 caratteri</li><li>Lettere minuscole, numeri, punto e trattino basso</li><li>Puoi cambiarlo una volta ogni 30 giorni</li></ul>
    <button type="button" class="btn primary big" id="usave" data-go="usave" disabled>${changing?'Salva':'Continua'}</button>
    ${changing?'':`<button type="button" class="linkbtn" data-go="logout">Non sei tu? Esci dall'account</button>`}`},

  home:()=>{const st=statsCache;const L=st?level(st.xp):null;
    const invs=invites.slice(0,2).map(i=>{const p=profCache[i.from_id]||{username:'un amico',color:'#4dd6ff'};return`<div class="invite-banner">${av(p)}<div><b>${nm(p)} ti ha invitato</b><small>Tavolo ${esc(i.room_code)} · ${ago(i.created_at)}</small></div><button type="button" class="btn sm primary" data-go="accept-invite" data-id="${i.id}">Entra</button></div>`}).join('');
    const on=friends.accepted.filter(f=>isFriendOnline(f.id));
    return`
    <div class="acct-top">
      <button type="button" class="mechip" data-go="stats">${av({name:profile.username,color:profile.color},'sm')}<b>${nm(profile)}</b>${L?`<span class="lv">LV ${L.lv}</span>`:''}</button>
      <span class="tr">${soundBtn('iconbtn sndb')}<button type="button" class="iconbtn" data-go="amici" aria-label="Amici${friends.incoming.length?' · '+friends.incoming.length+' richieste':''}">${ICON.people}${friends.incoming.length?`<span class="cntb">${friends.incoming.length}</span>`:''}</button></span>
    </div>
    ${homeErr?`<div class="err">${esc(homeErr)}</div>`:''}
    <div class="hero2 compact">
      <div class="herofan" aria-hidden="true">${dirHtml('up')}${cardHtml(37)}${cardHtml(66,true)}${cardHtml(99)}</div>
      <h1 class="tglogo"><span>The</span>Game</h1>
      <p class="script">Gioca finché puoi…</p>
      <p class="sub tc">Una sola squadra contro 98 carte</p>
    </div>
    ${invs}
    <div class="actions">
      <button type="button" class="btn primary big tile" data-go="create">${ICON.plus}<span>Crea un tavolo</span><small>Sei l'host</small></button>
      <button type="button" class="btn big join2 tile" data-go="entra">${ICON.enter}<span>Entra in un tavolo</span><small>Codice, QR o invito</small></button>
      <button type="button" class="btn big tile solo" data-go="local">${ICON.phone||''}<span>Un solo telefono</span><small>Passatevelo a turno</small></button><button type="button" class="btn big tile howt" data-go="rules"><span class="qic">?</span><span>Come si gioca</span><small>Le regole in un minuto</small></button>
      ${resumeBtn()}
    </div>
    ${friends.accepted.length?`<div class="sechead"><h3>Amici online · ${on.length}</h3><button type="button" class="linkbtn" data-go="amici">Vedi tutti</button></div>
    <div class="fstrip">${on.map(f=>{const o=onlineMap[f.id]||{};return`<button type="button" class="fbub" data-go="${o.room?'join-friend':'challenge'}" data-id="${f.id}">${av({name:f.username,color:f.color},'lg')}<i class="${o.room?'busy':''}"></i><span>${nm(f)}</span></button>`}).join('')||'<p class="empty" style="text-align:left;padding:6px 2px">Nessun amico online adesso</p>'}</div>`
    :`<button type="button" class="addfr" data-go="amici"><span class="pi sm">${ICON.people}</span><span><b>Aggiungi i tuoi amici</b><small>Poi li inviti al tuo tavolo con un tocco</small></span></button>`}
    <yeezik-hub-link></yeezik-hub-link>`},

  entra:()=>{const invs=profile?invites:[];return`
    <div class="topline"><button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button><b class="ttl">Entra in un tavolo</b><span></span></div>
    <div class="card codecard"><label for="codein" class="sub" style="text-align:center">Scrivi il codice di 4 lettere</label>
      <div class="codeboxes" id="codeboxes"><span></span><span></span><span></span><span></span><input id="codein" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Codice tavolo" value="${esc(pendingRoom||'')}"></div>
      <button type="button" class="btn primary big" data-go="join-code">Entra</button></div>
    <div class="or">oppure</div>
    <button type="button" class="btn big" data-go="scan"><span class="gold">${ICON.qr}</span>Scansiona il QR</button>
    ${invs.length?`<h3>Inviti ricevuti · ${invs.length}</h3><div class="flist">${invs.map(i=>{const p=profCache[i.from_id]||{username:'?',color:'#fff'};return`<div class="frow">${av(p)}<div class="fi"><b>${nm(p)}</b><small>Tavolo ${esc(i.room_code)} · ${ago(i.created_at)}</small></div><button type="button" class="btn sm primary" data-go="accept-invite" data-id="${i.id}">Entra</button></div>`}).join('')}</div>`:''}
    <p class="hint" style="margin-top:22px">Chi entra a partita iniziata guarda e gioca dalla prossima</p>`},

  amici:()=>{
    const row=(f,right,sub,cls='')=>`<div class="frow ${cls}">${av({name:f.username,color:f.color})}${isFriendOnline(f.id)?`<i class="ondot ${onlineMap[f.id].room?'busy':''}"></i>`:''}<div class="fi"><b>${nm(f)}</b><small>${sub}</small></div>${right}</div>`;
    const on=friends.accepted.filter(f=>isFriendOnline(f.id)),off=friends.accepted.filter(f=>!isFriendOnline(f.id));
    return`
    <div class="topline"><button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button><b class="ttl">Amici</b><span style="width:44px"></span></div>
    <label class="search">${ICON.search}<input id="fsearch" placeholder="Cerca per nome utente" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
    <div id="fresults"></div>
    ${friends.incoming.length?`<h3 class="pink">Richieste · ${friends.incoming.length}</h3><div class="flist">${friends.incoming.map(f=>row(f,`<button type="button" class="iconbtn sm" data-go="decline" data-id="${f.id}" aria-label="Rifiuta">${ICON.x}</button><button type="button" class="btn sm primary" data-go="accept" data-id="${f.id}">Accetta</button>`,'Vuole essere tuo amico','req')).join('')}</div>`:''}
    <h3>Online · ${on.length}</h3>
    <div class="flist">${on.length?on.map(f=>{const o=onlineMap[f.id];return o.room?row(f,`<button type="button" class="btn sm outline" data-go="join-friend" data-id="${f.id}">Raggiungi</button>`,`<span class="busyt">A un tavolo · ${esc(o.room)}</span>`):row(f,`<button type="button" class="btn sm primary" data-go="challenge" data-id="${f.id}">Sfida</button>`,o.other?`Sta giocando a ${esc(o.other)}`:'Online')}).join(''):'<p class="empty">Nessun amico online in questo momento</p>'}</div>
    <h3>Offline · ${off.length}</h3>
    <div class="flist dim">${off.length?off.map(f=>row(f,`<button type="button" class="iconbtn sm" data-go="unfriend" data-id="${f.id}" aria-label="Rimuovi ${esc(f.username)}">${ICON.x}</button>`,'Offline')).join(''):`<p class="empty">${friends.accepted.length?'Tutti i tuoi amici sono online':'Cerca il nome utente di un amico qui sopra per aggiungerlo'}</p>`}</div>
    ${friends.outgoing.length?`<h3>Richieste inviate · ${friends.outgoing.length}</h3><div class="flist dim">${friends.outgoing.map(f=>row(f,`<button type="button" class="linkbtn" data-go="cancelreq" data-id="${f.id}">Annulla</button>`,'In attesa')).join('')}</div>`:''}`},

  stats:()=>{const st=statsCache;
    if(!st)return`<div class="center"><div class="spin"></div>Carico le statistiche…</div>`;
    const L=level(st.xp),T=st[statsTab]||st.online;
    return`
    <div class="topline"><button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button><b class="ttl">Profilo</b><span style="width:44px"></span></div>
    <div class="phead">${av({name:profile.username,color:profile.color},'xl')}<div class="pinfo"><b>${nm(profile)}</b><div class="lvrow"><span class="lv">LV ${L.lv}</span><span class="lvbar"><span style="width:${L.cur/5}%"></span></span></div><small>${L.cur} / 500 XP al livello ${L.lv+1}</small></div></div>
    <div class="seg wide stab"><button type="button" data-go="stab" data-t="online" class="${statsTab==='online'?'on':''}">🌐 Online</button><button type="button" data-go="stab" data-t="offline" class="${statsTab==='offline'?'on':''}">📱 Un telefono</button></div>
    <div class="sgrid"><div class="scard"><small>Partite</small><b>${T.matches}</b></div><div class="scard"><small>Vinte (98 su 98)</small><b class="y">${T.wins}</b></div><div class="scard"><small>Brillanti (meno di 10)</small><b class="p">${T.bright}</b></div><div class="scard"><small>Record</small><b class="c">${T.best==null?'–':T.best}</b><small>${T.best==null?'':T.best===1?'carta rimasta':'carte rimaste'}</small></div><div class="scard"><small>Carte calate</small><b>${T.played}</b></div><div class="scard"><small>Mosse al contrario</small><b class="c">${T.backs}</b></div></div>
    ${T.mate?`<div class="soul"><div class="ring"><svg width="66" height="66" viewBox="0 0 66 66" aria-hidden="true"><circle cx="33" cy="33" r="28" fill="none" stroke="#3a120a" stroke-width="7"/><circle cx="33" cy="33" r="28" fill="none" stroke="#2ea8e6" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(T.mate.pct*1.76).toFixed(0)} 176" transform="rotate(-90 33 33)"/></svg><b>${T.mate.pct}%</b></div><div><small class="cy">Compagno di squadra</small><b>${esc(T.mate.name)}</b><span>Con lui calate di più: ${T.mate.n} partite insieme</span></div></div>`:''}
    <h3>Ultime partite</h3>
    <div class="flist">${T.recent.length?T.recent.map(r=>`<div class="frow"><span class="posb ${r.won?'p1':r.remaining<10?'p3':''}">${r.won?'🏆':r.burned?'🔥':r.remaining}</span><div class="fi"><b>${r.others&&r.others.length?'Con '+esc(r.others.slice(0,3).join(', '))+(r.others.length>3?' e altri':''):'In solitario'}</b><small>${ago(r.created_at)}${r.pro?' · 💀 Pro':''}${r.fire?' · 🔥 On Fire':''}</small></div><b class="ptsr">${r.won?'Vinta':r.burned?'Bruciati':r.remaining+' rimaste'}</b></div>`).join(''):`<p class="empty">${statsTab==='online'?'Gioca la tua prima partita online con un account per vedere qui le statistiche':'Le partite su un solo telefono appaiono qui'}</p>`}</div>
    <button type="button" class="btn ghost big danger" data-go="reset-stats" style="margin-top:22px">Azzera statistiche</button>
    ${profile.badge?`<p class="hint" style="margin-top:16px">${VBADGE} Account verificato: il nome utente non si può cambiare</p><button type="button" class="btn ghost big" data-go="logout" style="margin-top:10px">Esci</button>`:`<div class="grid2" style="margin-top:22px"><button type="button" class="btn" data-go="rename">Cambia nome</button><button type="button" class="btn ghost" data-go="logout">Esci</button></div>`}`}
};

// ===== Collegamenti delle schermate =====
const BIND={
  welcome(){},
  username(){
    const i=$('#user');let t=null,seq=0;
    const set=(ok,msg,sug)=>{$('#uwrap').className='uwrap '+(ok===true?'ok':ok===false?'bad':'');$('#ustate').innerHTML=ok===true?ICON.check:ok===false?ICON.x:'';$('#umsg').textContent=msg||'';$('#umsg').className='umsg '+(ok===true?'ok':ok===false?'bad':'');$('#usug').innerHTML=sug&&sug.length?`<p class="sub" style="margin:0 0 8px">Liberi per te:</p><div class="chips left">${sug.map(s=>`<button type="button" class="sugchip" data-go="usug" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>`:'';$('#usave').disabled=ok!==true;const a=$('#uav');if(a)a.textContent=(i.value||'?')[0].toUpperCase()};
    const check=async()=>{
      const v=i.value;const my=++seq;
      if(profile&&v===profile.username)return set(null,'È il tuo nome attuale');
      if(v.length<3)return set(null,v?'Almeno 3 caratteri':'');
      if(/^anon_/.test(v))return set(false,'I nomi che iniziano con anon_ sono per gli ospiti');
      set(null,'Controllo…');
      const base=v.replace(/[._]+$/,'');
      const cands=[v,`${base}.${['dj','yo','xo','live'][Math.floor(Math.random()*4)]}`,`${base}_${10+Math.floor(Math.random()*90)}`,`${base}${100+Math.floor(Math.random()*900)}`,`the.${base}`,`${base}.it`].map(x=>x.slice(0,16));
      const {data,error}=await sbc.rpc('usernames_available',{p_names:cands});
      if(my!==seq)return;
      if(error)return set(null,'Non riesco a controllare il nome, riprova');
      if(data.includes(v))set(true,`${v} è libero`);else set(false,`${v} è già preso`,data.filter(x=>x!==v).slice(0,3));
    };
    i.oninput=()=>{const c=cleanUser(i.value);if(c!==i.value)i.value=c;clearTimeout(t);t=setTimeout(check,350)};
    i.onkeydown=e=>{if(e.key==='Enter'&&!$('#usave').disabled)go('usave')};
    if(i.value)check();setTimeout(()=>i.focus(),100);
  },
  entra(){
    const i=$('#codein'),boxes=[...document.querySelectorAll('#codeboxes span')];
    const paint=()=>{const v=i.value;boxes.forEach((b,k)=>{b.textContent=v[k]||'';b.classList.toggle('cur',document.activeElement===i&&k===Math.min(v.length,3))})};
    i.oninput=()=>{i.value=i.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4);paint();if(i.value.length===4)buzz(10)};
    i.onfocus=i.onblur=paint;i.onkeydown=e=>{if(e.key==='Enter')go('join-code')};
    $('#codeboxes').onclick=()=>i.focus();paint();if(!i.value)setTimeout(()=>i.focus(),150);
  },
  amici(){const s=$('#fsearch');let t=null;s.oninput=()=>{clearTimeout(t);t=setTimeout(()=>searchFriends(),300)}},
  stats(){if(!statsCache)loadStats().then(()=>{if(view==='stats')refresh()})},
  home(){if(!statsCache)loadStats().then(()=>{if(view==='home')refresh()})}
};

// ===== Azioni =====
async function go(a,el){
  const id=el&&el.dataset.id;
  switch(a){
    case 'home':show('home','',{root:true});break;
    case 'amici':case 'stats':if(view===a)return;if(TABS.includes(view)){navStack=[];view='home'}show(a);break;
    case 'back':goBack();break;
    case 'create':withName(createRoom);break;
    case 'entra':withName(()=>show('entra'));break;
    case 'g-join':if(profile||me.name){const r=pendingRoom;pendingRoom=null;joinRoom(r)}else openNameSheet(()=>{const r=pendingRoom;pendingRoom=null;if(r)joinRoom(r)},pendingRoom);break;
    case 'gname':openNameSheet(()=>refresh());break;
    case 'rules':openRules();break;
    case 'resume-x':if(confirm('Chiudere questa partita? Non potrai più riprenderla.')){ls.del('thegame_host');refresh()}break;
    case 'resume':{const s=ls.get('thegame_host');if(s&&s.state){state=s.state;enterRoom(s.code,true)}break}
    case 'join-code':{const c=($('#codein')||{}).value||'';if(c.length!==4){toast('Il codice ha 4 lettere');return}pendingRoom=null;joinRoom(c);break}
    case 'scan':scanQR();break;
    case 'login':openLogin();break;
    case 'google':googleLogin();break;
    case 'logout':if(confirm("Uscire dall'account?")){await sbc.auth.signOut();}break;
    case 'reset-stats':openResetStats();break;
    case 'rename':if(profile&&profile.badge){toast('Gli account verificati non possono cambiare nome utente');return}show('username');break;
    case 'usug':{const i=$('#user');i.value=el.dataset.v;i.dispatchEvent(new Event('input'));break}
    case 'usave':saveUsername();break;
    case 'accept-invite':{const inv=invites.find(x=>x.id===id);if(!inv)return;sbc.from('invites').delete().eq('id',id).then(()=>{});invites=invites.filter(x=>x.id!==id);joinRoom(inv.room_code);break}
    case 'join-friend':{const o=onlineMap[id];if(o&&o.room)joinRoom(o.room);else toast('Non è più a un tavolo');break}
    case 'challenge':{const c=roomCode();invitedHere=new Set();state=newState();await enterRoom(c,true);await sendInvite(id,c);break}
    case 'add':addFriend(id,el);break;
    case 'accept':{el.disabled=true;const {error}=await sbc.from('friendships').update({status:'accepted'}).eq('requester',id).eq('addressee',profile.id);if(error)toast('Non sono riuscito ad accettare');else{toast('Ora siete amici!');buzz(20)}await loadFriends();refresh();break}
    case 'decline':case 'cancelreq':case 'unfriend':{
      if(a==='unfriend'&&!confirm('Rimuovere questo amico?'))return;
      await sbc.from('friendships').delete().or(`and(requester.eq.${id},addressee.eq.${profile.id}),and(requester.eq.${profile.id},addressee.eq.${id})`);
      await loadFriends();refresh();break}
    case 'sound':{SFX.toggle();document.querySelectorAll('.sndbtn').forEach(b=>{b.innerHTML=soundIcon();b.setAttribute('aria-label',SFX.on?'Disattiva i suoni':'Attiva i suoni')});toast(SFX.on?'Suoni attivi 🔊':'Suoni disattivati 🔇',1500);break}
    case 'share':if(code&&state)shareOnline();else if(typeof L!=='undefined'&&L)shareLocal();break;
    case 'invite':{el.disabled=true;await sendInvite(id,code);renderInviteFriends();break}
    default:if(typeof LOCAL_GO!=='undefined'&&LOCAL_GO[a])LOCAL_GO[a](el);
  }
}

// ===== Ospite =====
async function ensureIdentity(){
  if(profile)return true;
  const i=$('#gname');const raw=(i?i.value:guestSaved.raw||'').trim();
  if(!raw||!/[a-zA-Z0-9]/.test(raw)){toast('Scrivi il tuo nome');if(i)i.focus();return false}
  if(me.name&&guestSaved.raw===raw&&me.name.startsWith('anon_'))return true;
  try{
    const {data,error}=await getClient().rpc('claim_guest_name',{p_name:raw,p_device:deviceId});
    if(error)throw error;
    me.name=data;Object.assign(guestSaved,{raw,name:data,color:me.color});ls.set('thegame_guest',guestSaved);
    if(data!==guestPreview(raw))toast(`Quel nome era già usato: giochi come ${data}`,3500);
    return true;
  }catch(e){toast('Non riesco a registrare il nome, controlla la connessione');return false}
}
function withName(next){if(profile||me.name)next();else openNameSheet(next)}
function openNameSheet(next,room){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="sheet" role="dialog" aria-label="Il tuo nome"><div class="grab"></div>
    ${room?`<div class="invite-banner" style="margin-bottom:14px"><span class="pi sm">${ICON.enter}</span><div><b>Ti hanno invitato al tavolo ${esc(room)}</b><small>Scegli il nome con cui giocare</small></div></div>`:''}
    <h2 style="text-align:left;margin:4px 0 4px">Come ti chiami?</h2>
    <p class="hint" style="text-align:left;margin:0 0 16px">Così ti riconoscono gli amici al tavolo.</p>
    <form id="nform"><input id="gname" maxlength="16" placeholder="Es. pietro" value="${esc(guestSaved.raw||'')}" autocomplete="off" autocapitalize="off" spellcheck="false">
    <p class="preview">Giocherai come <b id="gprev">${esc(guestPreview(guestSaved.raw))}</b></p>
    <button type="submit" class="btn primary big" id="ngo" style="margin-top:14px">${room?`Entra nel tavolo ${esc(room)}`:'Gioca'}</button></form>
    <p class="hint" style="margin:16px 0 0">Vuoi salvare statistiche e amici? <button type="button" class="linkbtn" id="nlogin">Accedi</button></p></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m)close()});
  const i=m.querySelector('#gname');i.oninput=()=>{m.querySelector('#gprev').textContent=guestPreview(i.value)};
  m.querySelector('#nlogin').onclick=()=>{close();openLogin()};
  m.querySelector('#nform').onsubmit=async e=>{e.preventDefault();const b=m.querySelector('#ngo');b.disabled=true;
    if(guestSaved.raw!==i.value.trim())me.name='';
    const ok=await ensureIdentity();b.disabled=false;if(ok){close();buzz(15);next&&next()}};
  document.body.appendChild(m);setTimeout(()=>i.focus(),300);
}
function openRules(){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="sheet notes" role="dialog" aria-label="Come si gioca"><div class="grab"></div><h2 style="margin:4px 0 4px">Come si gioca</h2>${howtoHtml()}<button class="btn primary big close" type="button" style="margin-top:20px">Ho capito</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  document.body.appendChild(m);
}
function createRoom(){invitedHere=new Set();state=newState();enterRoom(roomCode(),true)}
async function joinRoom(c){
  if(!profile&&!me.name){pendingRoom=c;show('welcome');return}
  const s=ls.get('thegame_host');
  if(s&&s.code===c&&s.state&&s.state.hostId===me.id){state=s.state;return enterRoom(c,true)}
  sbc&&profile&&sbc.from('invites').delete().eq('to_id',profile.id).eq('room_code',c).then(()=>{});
  invites=invites.filter(x=>x.room_code!==c);
  enterRoom(c,false);
}

// ===== Accesso =====
async function googleLogin(){
  toast('Accesso con Google presto disponibile');return;
  try{
    const back=location.origin+location.pathname+(pendingRoom?'?r='+pendingRoom:'');
    const {error}=await getClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:back}});
    if(error)throw error;
  }catch(e){toast(/provider is not enabled|Unsupported provider/i.test(e.message||'')?'Accesso con Google non ancora attivo: usa l\'email':'Accesso con Google non riuscito',4000)}
}
function openLogin(){
  const m=document.createElement('div');m.className='modal';
  const draw=()=>{m.innerHTML=`<div class="sheet" role="dialog" aria-label="Accedi"><div class="grab"></div>
    <div class="seg wide"><button type="button" data-m="login" class="${loginMode==='login'?'on':''}">Accedi</button><button type="button" data-m="signup" class="${loginMode==='signup'?'on':''}">Registrati</button></div>
    <h2 style="text-align:left;margin:16px 0 4px">${loginMode==='login'?'Bentornato':'Crea il tuo account'}</h2>
    <p class="hint" style="text-align:left;margin:0 0 14px">${loginMode==='login'?'Accedi per ritrovare statistiche e amici.':'Poi sceglierai il tuo nome utente.'}</p>
    <form id="lform"><label class="lbl" for="lemail">Email</label><input id="lemail" type="email" autocomplete="email" required>
    <label class="lbl" for="lpass" style="margin-top:12px">Password</label><input id="lpass" type="password" minlength="6" autocomplete="${loginMode==='login'?'current-password':'new-password'}" required>
    <p class="umsg bad" id="lerr"></p>
    <button type="submit" class="btn primary big" id="lgo">${loginMode==='login'?'Accedi':'Crea account'}</button></form>
    <div class="or">oppure</div><button type="button" class="btn google big" id="lgoogle" disabled aria-disabled="true" title="Presto disponibile"><svg class="glogo" width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Continua con Google<span class="soon">presto</span></button>
    <button class="btn ghost close" type="button">Chiudi</button></div>`;
    m.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{loginMode=b.dataset.m;draw()});
    // accesso con Google disattivato per il momento
    const fg=m.querySelector('#lforgot');
    if(fg)fg.onclick=async()=>{
      const email=m.querySelector('#lemail').value.trim(),err=m.querySelector('#lerr');
      if(!/^\S+@\S+\.\S+$/.test(email)){err.className='umsg bad';err.textContent='Scrivi prima la tua email qui sopra';m.querySelector('#lemail').focus();return}
      fg.disabled=true;
      const {error}=await sbc.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      fg.disabled=false;
      if(error&&/rate limit|too many/i.test(error.message||'')){err.className='umsg bad';err.textContent='Troppe richieste, riprova tra un po\u2019'}
      else if(error){err.className='umsg bad';err.textContent='Non riesco a mandare l\u2019email, riprova più tardi'}
      else{err.className='umsg ok';err.textContent='Se l\u2019email è registrata ti arriva un link per scegliere una nuova password. Controlla anche lo spam.'}
    };
    m.querySelector('#lform').onsubmit=async e=>{
      e.preventDefault();const email=m.querySelector('#lemail').value.trim(),password=m.querySelector('#lpass').value,btn=m.querySelector('#lgo'),err=m.querySelector('#lerr');
      if(password.length<6){err.textContent='La password deve avere almeno 6 caratteri';return}
      btn.disabled=true;err.textContent='';
      try{
        if(loginMode==='login'){const {error}=await sbc.auth.signInWithPassword({email,password});if(error)throw error;close()}
        else{const {data,error}=await sbc.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;
          if(!data.session){err.className='umsg ok';err.textContent='Ti abbiamo mandato un’email: apri il link per confermare l’account, poi accedi.'}else close()}
      }catch(x){const msg=x.message||'';err.className='umsg bad';err.textContent=/Invalid login/i.test(msg)?'Email o password sbagliate':/already registered|already been registered/i.test(msg)?'Questa email ha già un account: accedi':/not confirmed/i.test(msg)?'Devi prima confermare l’email dal link che ti abbiamo mandato':/rate limit/i.test(msg)?'Troppi tentativi, riprova tra poco':'Non riuscito: '+msg}
      btn.disabled=false;
    };
  };
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  draw();document.body.appendChild(m);setTimeout(()=>{const e=m.querySelector('#lemail');if(e)e.focus()},300);
}
async function saveUsername(){
  const v=$('#user').value,btn=$('#usave');btn.disabled=true;
  let res;
  if(profile)res=await sbc.from('profiles').update({username:v}).eq('id',profile.id).select().single();
  else res=await sbc.from('profiles').insert({id:session.user.id,username:v,color:me.color||COLORS[0]}).select().single();
  if(res.error){const m=res.error.message||'';$('#umsg').className='umsg bad';$('#umsg').textContent=res.error.code==='23505'?`${v} è appena stato preso, scegline un altro`:/verificati/.test(m)?'Gli account verificati non possono cambiare nome utente':/30 giorni/.test(m)?'Puoi cambiare il nome utente una volta ogni 30 giorni':'Non riuscito, riprova';btn.disabled=false;return}
  const first=!profile;profile=res.data;setAccountMe();
  if(first){startUserRealtime();confetti(80);toast(`Benvenuto, ${profile.username}!`)}else toast('Nome utente aggiornato');
  if(pendingRoom){const r=pendingRoom;pendingRoom=null;joinRoom(r)}else show('home','',{root:true});
}
function setAccountMe(){me={id:profile.id,name:profile.username,uid:profile.id,color:profile.color}}

async function onSession(s){
  const prevUid=session&&session.user&&session.user.id;
  session=s;
  if(!s){
    profile=null;stopUserRealtime();statsCache=null;friends={accepted:[],incoming:[],outgoing:[]};invites=[];
    me={id:deviceId,name:guestSaved.name||'',uid:null,color:guestSaved.color||COLORS[0]};
    if(!code)show('welcome','',{root:true});return;
  }
  if(profile&&prevUid===s.user.id)return;
  const {data,error}=await sbc.from('profiles').select('*').eq('id',s.user.id).maybeSingle();
  if(error){toast('Non riesco a caricare il profilo');if(!code)show('welcome','',{root:true});return}
  profile=data;
  if(!profile){if(!code)show('username','',{root:true});return}
  setAccountMe();startUserRealtime();
  if(code)return;
  if(pendingRoom){const r=pendingRoom;pendingRoom=null;joinRoom(r)}else show('home','',{root:true});
}

// ===== Amici =====
async function fetchProfiles(ids){
  const need=[...new Set(ids)].filter(x=>x&&!profCache[x]);
  if(need.length){const {data}=await sbc.from('profiles').select('id,username,color').in('id',need);(data||[]).forEach(p=>profCache[p.id]=p)}
  return ids.map(x=>profCache[x]).filter(Boolean);
}
async function loadFriends(){
  if(!profile)return;
  const {data}=await sbc.from('friendships').select('*');
  const rows=data||[],uid=profile.id;
  await fetchProfiles(rows.map(r=>r.requester===uid?r.addressee:r.requester));
  const P=id=>profCache[id];
  friends={
    accepted:rows.filter(r=>r.status==='accepted').map(r=>P(r.requester===uid?r.addressee:r.requester)).filter(Boolean).sort((a,b)=>a.username.localeCompare(b.username)),
    incoming:rows.filter(r=>r.status==='pending'&&r.addressee===uid).map(r=>P(r.requester)).filter(Boolean),
    outgoing:rows.filter(r=>r.status==='pending'&&r.requester===uid).map(r=>P(r.addressee)).filter(Boolean)
  };
}
async function loadInvites(){
  if(!profile)return;
  const since=new Date(Date.now()-3*3600e3).toISOString();
  const {data}=await sbc.from('invites').select('*').eq('to_id',profile.id).eq('game',GAME).gte('created_at',since).order('created_at',{ascending:false}).limit(10);
  invites=data||[];await fetchProfiles(invites.map(i=>i.from_id));
}
async function searchFriends(keep){
  const box=$('#fresults'),s=$('#fsearch');if(!box||!s)return;
  const q=cleanUser(s.value);if(q.length<2){box.innerHTML='';return}
  const {data}=await sbc.from('profiles').select('id,username,color').ilike('username',q.replace(/[_%]/g,m=>'\\'+m)+'%').neq('id',profile.id).order('username').limit(8);
  (data||[]).forEach(p=>profCache[p.id]=p);
  const st=p=>friends.accepted.some(f=>f.id===p.id)?'<span class="tag ok">Amici</span>':friends.outgoing.some(f=>f.id===p.id)?'<span class="tag">Richiesta inviata</span>':friends.incoming.some(f=>f.id===p.id)?`<button type="button" class="btn sm primary" data-go="accept" data-id="${p.id}">Accetta</button>`:`<button type="button" class="btn sm primary" data-go="add" data-id="${p.id}">Aggiungi</button>`;
  box.innerHTML=(data&&data.length)?`<div class="flist" style="margin-top:10px">${data.map(p=>`<div class="frow">${av({name:p.username,color:p.color})}<div class="fi"><b>${nm(p)}</b><small>${isFriendOnline(p.id)?'Online':'Giocatore'}</small></div>${st(p)}</div>`).join('')}</div>`:`<p class="empty">Nessun giocatore trovato con “${esc(q)}”</p>`;
}
async function addFriend(id,el){
  if(el)el.disabled=true;
  const {error}=await sbc.from('friendships').insert({requester:profile.id,addressee:id});
  if(error&&error.code!=='23505'){toast('Richiesta non inviata');if(el)el.disabled=false;return}
  toast('Richiesta di amicizia inviata');await loadFriends();searchFriends();refresh();
}

// ===== Inviti =====
async function sendInvite(toId,room){
  if(!profile||!room)return;
  const {error}=await sbc.from('invites').insert({from_id:profile.id,to_id:toId,room_code:room,game:GAME});
  if(error&&error.code!=='23505'){toast('Invito non inviato');return}
  invitedHere.add(toId);const p=profCache[toId];toast(`Invito inviato${p?' a '+p.username:''}`);buzz(15);
}
function renderInviteFriends(){
  const box=$('#invfr');if(!box||!state||state.phase!=='lobby')return;
  if(!profile){box.innerHTML=`<p class="hint" style="margin-top:14px">Con un account puoi invitare gli amici direttamente da qui.</p>`;return}
  if(!friends.accepted.length){box.innerHTML=`<h3>Invita dagli amici</h3><p class="empty">Aggiungi amici dal tuo profilo per invitarli qui con un tocco.</p>`;return}
  const inRoom=new Set(state.players.map(p=>p.uid).filter(Boolean));
  const list=[...friends.accepted].sort((a,b)=>(isFriendOnline(b.id)-isFriendOnline(a.id))||a.username.localeCompare(b.username));
  box.innerHTML=`<h3>Invita dagli amici</h3><div class="flist">${list.map(f=>{const on=isFriendOnline(f.id),o=onlineMap[f.id]||{};
    const right=inRoom.has(f.id)?`<span class="tag ok">${ICON.check}Entrato</span>`:invitedHere.has(f.id)?'<span class="tag gold">Invito inviato</span>':`<button type="button" class="btn sm ${on?'primary':'outline'}" data-go="invite" data-id="${f.id}">Invita</button>`;
    const sub=inRoom.has(f.id)?'Al tavolo':on?(o.room?`A un altro tavolo · ${esc(o.room)}`:o.other?`Sta giocando a ${esc(o.other)}`:'Online'):'Offline · riceverà l’invito';
    return`<div class="frow ${on?'':'dim1'}">${av({name:f.username,color:f.color})}${on?'<i class="ondot"></i>':''}<div class="fi"><b>${nm(f)}</b><small>${sub}</small></div>${right}</div>`}).join('')}</div>`;
}

// ===== Tempo reale: amici online, inviti, richieste =====
function startUserRealtime(){
  if(!profile||presenceCh)return;
  loadFriends().then(()=>{refresh();if(code)renderInviteFriends()});
  loadInvites().then(refresh);
  presenceCh=sbc.channel('yeezik-online',{config:{presence:{key:profile.id}}});
  presenceCh.on('presence',{event:'sync'},()=>{
    const st=presenceCh.presenceState(),m={};
    for(const [k,arr] of Object.entries(st)){const last=arr[arr.length-1]||{};const r=arr.find(x=>x.room);const g=r?(r.game||GAME):null;m[k]={room:g===GAME?r.room:null,other:r&&g!==GAME?(GAME_NAMES[g]||'un altro gioco'):null,username:last.username}}
    onlineMap=m;if(code)renderInviteFriends();else if(view==='home'||view==='amici')refresh();
  }).subscribe(s=>{if(s==='SUBSCRIBED')trackPresence()});
  userCh=sbc.channel('user-'+profile.id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'invites',filter:'to_id=eq.'+profile.id},async({new:inv})=>{
      if(inv.game&&inv.game!==GAME)return;
      await fetchProfiles([inv.from_id]);invites=[inv,...invites.filter(x=>x.id!==inv.id)];
      const p=profCache[inv.from_id];buzz([30,60,30]);SFX.chime();
      if(code)toast(`${p?p.username:'Un amico'} ti invita al tavolo ${inv.room_code}`,5000);
      else{toast(`${p?p.username:'Un amico'} ti ha invitato a giocare!`,4000);refresh()}
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'friendships',filter:'addressee=eq.'+profile.id},async(ev)=>{await loadFriends();if(ev.eventType==='INSERT'){buzz(20);toast('Nuova richiesta di amicizia')}renderTabs();refresh();if(code)renderInviteFriends()})
    .on('postgres_changes',{event:'*',schema:'public',table:'friendships',filter:'requester=eq.'+profile.id},async(ev)=>{await loadFriends();if(ev.eventType==='UPDATE')toast('Richiesta di amicizia accettata!');refresh();if(code)renderInviteFriends()})
    .subscribe();
}
function stopUserRealtime(){try{presenceCh&&sbc.removeChannel(presenceCh)}catch(e){}try{userCh&&sbc.removeChannel(userCh)}catch(e){}presenceCh=null;userCh=null;onlineMap={}}
function trackPresence(){if(presenceCh&&profile)try{presenceCh.track({username:profile.username,room:code||null,game:code?GAME:null})}catch(e){}}
function onEnteredRoom(c){trackPresence();try{history.pushState({sint:'room'},'','?r='+c)}catch(e){}}
function onLeftRoom(){invitedHere=new Set();setTimeout(trackPresence,0)}

// ===== Azzera statistiche =====
function openResetStats(){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="sheet" role="dialog" aria-label="Azzera statistiche"><div class="grab"></div>
    <div class="warnic">⚠️</div>
    <h2 style="margin:6px 0 6px">Azzerare le statistiche?</h2>
    <p class="hint" style="margin:0 0 6px">Partite, vittorie, record, carte calate e livello ripartono da zero, sia online sia su un telefono.</p>
    <p class="hint" style="margin:0 0 16px"><b style="color:var(--text)">Non si può annullare.</b> Amici e nome utente restano.</p>
    <button type="button" class="btn big dangerfill" id="rsgo">Sì, azzera tutto</button>
    <button type="button" class="btn ghost big close" style="margin-top:10px">Annulla</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  m.querySelector('#rsgo').onclick=async e=>{
    const b=e.currentTarget;b.disabled=true;b.textContent='Azzero…';
    const now=new Date().toISOString();
    const [a,p]=await Promise.all([
      sbc.from('thegame_results').delete().eq('user_id',profile.id),
      sbc.from('profiles').select('*').eq('id',profile.id).single()
    ]);
    if(p.error||a.error){b.disabled=false;b.textContent='Sì, azzera tutto';toast('Non sono riuscito ad azzerare, riprova');return}
    profile=p.data;statsCache=null;close();buzz(30);toast('Statistiche azzerate');
    await loadStats();if(view==='stats'||view==='home')refresh();
  };
  document.body.appendChild(m);
}

// ===== Statistiche =====
async function loadStats(){
  if(!profile)return;
  const {data}=await sbc.from('thegame_results').select('*').eq('user_id',profile.id).order('created_at',{ascending:false}).limit(500);
  const rows=data||[];
  const sum=list=>{
    const mates={};list.forEach(r=>(r.others||[]).forEach(n=>{const m=mates[n]=mates[n]||{n:0,played:0};m.n++;m.played+=98-r.remaining}));
    let mate=null;for(const [name,m] of Object.entries(mates)){if(m.n<2)continue;const avg=m.played/m.n;if(!mate||avg>mate.avg)mate={name,avg,n:m.n}}
    if(mate)mate.pct=Math.round(mate.avg/98*100);
    return{matches:list.length,wins:list.filter(r=>r.won).length,bright:list.filter(r=>!r.burned&&r.remaining<10).length,
      best:list.filter(r=>!r.burned).reduce((b,r)=>b==null||r.remaining<b?r.remaining:b,null),
      played:list.reduce((s,r)=>s+r.cards_played,0),backs:list.reduce((s,r)=>s+r.reverse_moves,0),mate,recent:list.slice(0,6)};
  };
  const xp=rows.reduce((s,r)=>s+25+r.cards_played*3+(r.won?250:!r.burned&&r.remaining<10?100:0),0);
  statsCache={xp,online:sum(rows.filter(r=>r.mode==='online')),offline:sum(rows.filter(r=>r.mode==='offline'))};
}
async function saveResult(row){
  if(!profile||recorded.has(row.match_id))return;
  recorded.add(row.match_id);ls.set('thegame_recorded',[...recorded].slice(-200));
  const r=await sbc.from('thegame_results').insert(row);
  if(r.error){console.warn(r.error);return}
  statsCache=null;toast('Partita salvata nelle tue statistiche');
}
async function recordMatch(){
  const S=state;if(!profile||!S||!S.matchId||!S.result||!S.order.includes(me.id))return;
  const st=(S.stats||{})[me.id]||{played:0,backs:0};
  saveResult({match_id:S.matchId,mode:'online',room_code:code,players:Math.min(5,S.order.length),remaining:S.result.remaining,won:!!S.result.won,burned:S.result.reason==='fire',pro:!!S.opts.pro,fire:!!S.opts.fire,
    cards_played:Math.max(0,Math.min(98,st.played)),reverse_moves:Math.max(0,Math.min(98,st.backs)),others:S.order.filter(id=>id!==me.id).map(id=>String(TG.nm(S,id)).slice(0,22)).slice(0,5)});
}

// ===== Lettura QR =====
function loadJsQR(){
  if(window.jsQR)return Promise.resolve(true);
  return new Promise(res=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';sc.onload=()=>res(!!window.jsQR);sc.onerror=()=>res(false);document.head.appendChild(sc)});
}
async function scanQR(){
  const m=document.createElement('div');m.className='modal center-modal';
  m.innerHTML=`<div class="scanbox"><video playsinline muted autoplay></video><div class="scanframe"></div><p id="scanmsg">Avvio la fotocamera…</p><button class="btn ghost close" type="button">Annulla</button></div>`;
  document.body.appendChild(m);
  const msg=t=>{const e=m.querySelector('#scanmsg');if(e)e.textContent=t};
  let stream=null,alive=true;
  const stop=()=>{alive=false;if(stream)stream.getTracks().forEach(t=>t.stop());m.remove()};
  m.querySelector('.close').onclick=stop;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){msg('Questo browser non può usare la fotocamera. Inquadra il QR con l’app Fotocamera del telefono.');return}
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})}
  catch(e){msg(e&&e.name==='NotAllowedError'?'Serve il permesso della fotocamera: consentilo nelle impostazioni del browser e riprova.':'Non riesco ad aprire la fotocamera. Puoi inquadrare il QR con l’app Fotocamera del telefono.');return}
  if(!alive){stream.getTracks().forEach(t=>t.stop());return}
  const v=m.querySelector('video');v.srcObject=stream;try{await v.play()}catch(e){}
  let det=null;
  if('BarcodeDetector' in window){try{const f=await BarcodeDetector.getSupportedFormats();if(f.includes('qr_code'))det=new BarcodeDetector({formats:['qr_code']})}catch(e){}}
  if(!det&&!(await loadJsQR())){msg('Non riesco a caricare il lettore QR. Controlla la connessione.');return}
  msg('Inquadra il QR del tavolo');
  const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
  const found=t=>{let c=null;try{c=new URL(t).searchParams.get('r')}catch(e){c=t}c=String(c||'').toUpperCase().replace(/[^A-Z]/g,'');
    if(c.length===4){buzz(30);if(typeof SFX!=='undefined')SFX.pop();stop();pendingRoom=null;joinRoom(c);return true}
    msg('Questo QR non è di un tavolo di The Game');return false};
  (async function loop(){
    if(!alive)return;
    try{
      if(v.readyState>=2&&v.videoWidth){
        if(det){const r=await det.detect(v);if(r&&r[0]&&found(r[0].rawValue||''))return}
        else{const w=Math.min(640,v.videoWidth),h=Math.round(w*v.videoHeight/v.videoWidth);cv.width=w;cv.height=h;cx.drawImage(v,0,0,w,h);const img=cx.getImageData(0,0,w,h);const q=jsQR(img.data,w,h,{inversionAttempts:'dontInvert'});if(q&&q.data&&found(q.data))return}
      }
    }catch(e){}
    setTimeout(loop,180);
  })();
}

// ===== Versione e patch notes =====
const VERSION='2.2';
// tipi di voce: n = nuovo, m = migliorato, c = corretto
const NOTES=[
  {v:'2.2',d:'5 novembre 2026',items:[
    ['n','A inizio partita scegliete voi chi inizia: votate la persona con la mano migliore, oppure a caso']
  ]},
  {v:'2.1',d:'3 novembre 2026',items:[
    ['c','Sfondo di fuoco senza la riga orizzontale e fermo dietro i contenuti anche su iPhone'],
    ['n','Nuova icona e favicon']
  ]},
  {v:'2.0',d:'3 novembre 2026',items:[
    ['n','Nuova casa nello stile di Yeezik Games, con i colori del gioco vero'],
    ['n','Account, nome utente, amici online e inviti al tavolo con un tocco'],
    ['n','Statistiche: partite, vittorie, record, carte calate e mosse al contrario'],
    ['n','Modalità Un solo telefono: vi passate il telefono a turno, anche in solitario'],
    ['n','QR del tavolo, suoni e immagine del risultato da condividere'],
    ['m','Il tavolo ora passa da un server: chi lo crea può chiudere e riprendere la partita']
  ]},
  {v:'1.0',d:'3 novembre 2026',first:true,items:[]}
];
const NTAG={n:['Nuovo','tn'],m:['Migliorato','tm'],c:['Corretto','tc2']};
function howtoHtml(){
  return`<div class="howto">
    <div class="hcard hero-h">
      <div class="hpiles">${dirHtml('up')}${dirHtml('up')}${dirHtml('down')}${dirHtml('down')}</div>
      <p>Giocate <b>tutti nella stessa squadra</b> contro il gioco.<br>Dovete calare tutte le <b>98 carte</b>, numerate da 2 a 99, su quattro pile.</p>
    </div>

    <h3>Le pile</h3>
    <div class="hcard hex">
      <div class="hrow"><span class="hk">▲ 2 pile</span><b>salgono da 1: ogni carta più alta di quella in cima</b></div>
      <div class="hrow"><span class="hk">▼ 2 pile</span><b>scendono da 100: ogni carta più bassa</b></div>
      <div class="hseq">${cardHtml(4)}<span class="arrow">→</span>${cardHtml(8)}<span class="arrow">→</span>${cardHtml(13)}</div>
      <p class="hnote" style="margin:0">Si possono saltare numeri, ma conviene saltarne il meno possibile.</p>
    </div>

    <h3>Il tuo turno</h3>
    <div class="hflow">
      <div class="hstep"><span class="hic">🃏</span><b>1. Cala</b><small>almeno 2 carte, dove e come vuoi</small></div>
      <div class="harr">→</div>
      <div class="hstep"><span class="hic">➕</span><b>2. Pesca</b><small>tante carte quante ne hai calate</small></div>
      <div class="harr">→</div>
      <div class="hstep"><span class="hic">👉</span><b>3. Passa</b><small>tocca al prossimo</small></div>
    </div>
    <p class="hnote">Quando il mazzo finisce basta calarne <b>1</b>. Chi finisce le carte esce, gli altri continuano.</p>

    <h3>Mossa al contrario</h3>
    <div class="hcard hex">
      <div class="hseq">${cardHtml(47)}<span class="arrow">←</span>${cardHtml(37)}</div>
      <p class="hnote" style="margin:0">Su una pila che sale puoi calare una carta <b>esattamente 10 sotto</b>; su una che scende, <b>esattamente 10 sopra</b>. Quante volte vuoi. Nel gioco la pila si illumina di <b style="color:var(--cyan)">blu</b>.</p>
    </div>

    <h3>Vietato dire i numeri</h3>
    <div class="hcard"><p class="hnote" style="margin:0">Parlate quanto volete, ma senza nominare i valori delle carte. Online avete due segnali per pila:</p><div class="hsig"><span class="sig stop">Stop · non giocate qui</span><span class="sig">Vicina · ho una carta che ci sta</span></div></div>

    <h3>Come va a finire</h3>
    <div class="hpts tg3">
      <div class="hpt r0"><b>0</b><small>Avete battuto il gioco</small></div>
      <div class="hpt r1"><b>&lt;10</b><small>Risultato brillante</small></div>
      <div class="hpt r2"><b>10+</b><small>Riprovate</small></div>
    </div>
    <p class="hnote">La partita finisce quando chi è di turno non riesce a calare il minimo. Si contano le carte rimaste in mano e nel mazzo.</p>

    <h3>Varianti</h3>
    <div class="hmodes">
      <div class="hcard"><span class="hic">💀</span><b>Professionisti</b><small>Almeno 3 carte a turno e una carta in meno in mano.</small></div>
      <div class="hcard"><span class="hic">🔥</span><b>On Fire</b><small>22, 33, 44, 55, 66 e 77 vanno coperte entro il turno del giocatore dopo, o avete perso.</small></div>
    </div>

    <h3>Modalità</h3>
    <div class="hmodes">
      <div class="hcard"><span class="hic">🌐</span><b>Online</b><small>Da 1 a 5, ognuno dal suo telefono. Codice, QR o invito.</small></div>
      <div class="hcard"><span class="hic">📱</span><b>Un solo telefono</b><small>Ve lo passate a turno: ognuno vede solo la sua mano.</small></div>
    </div>
  </div>`;
}
function renderVer(){const b=$('#verBtn');if(!b)return;const seen=ls.get('thegame_ver')===VERSION;b.innerHTML=`The Game - ver <b>${VERSION}</b>${seen?'':'<span class="dot"></span>'}`;b.setAttribute('aria-label','Novità della versione '+VERSION)}
function openNotes(){
  ls.set('thegame_ver',VERSION);renderVer();
  const m=document.createElement('div');m.className='modal';
  const news=NOTES.map((n,k)=>`<div class="pn ${k===0?'latest':''}">
      <div class="pnh"><span class="pnv">v${n.v}</span>${k===0?'<span class="pnnow">attuale</span>':''}<small>${esc(n.d)}</small></div>
      ${n.first?'<p class="pnfirst">🎉 Prima versione di The Game online.</p>':`<ul class="pnl">${n.items.map(([t,x])=>`<li><span class="ptag ${NTAG[t][1]}">${NTAG[t][0]}</span><span>${esc(x)}</span></li>`).join('')}</ul>`}
    </div>`).join('');
  m.innerHTML=`<div class="sheet notes" role="dialog" aria-label="Novità"><div class="grab"></div><h2 style="margin:4px 0 14px">Novità</h2>${news}<button class="btn ghost big close" type="button" style="margin-top:18px">Chiudi</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  document.body.appendChild(m);
}
$('#verBtn').addEventListener('click',()=>openNotes());

// ===== Nuova password (dal link dell'email) =====
function openNewPassword(){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="sheet" role="dialog" aria-label="Nuova password"><div class="grab"></div>
    <h2 style="text-align:left;margin:4px 0 4px">Scegli una nuova password</h2>
    <p class="hint" style="text-align:left;margin:0 0 14px">Almeno 6 caratteri.</p>
    <form id="pform"><label class="lbl" for="np1">Nuova password</label><input id="np1" type="password" minlength="6" autocomplete="new-password" required>
    <label class="lbl" for="np2" style="margin-top:12px">Ripeti la password</label><input id="np2" type="password" minlength="6" autocomplete="new-password" required>
    <p class="umsg bad" id="perr"></p><button type="submit" class="btn primary big" id="pgo">Salva la password</button></form></div>`;
  document.body.appendChild(m);setTimeout(()=>{const e=m.querySelector('#np1');if(e)e.focus()},300);
  m.querySelector('#pform').onsubmit=async e=>{e.preventDefault();
    const a=m.querySelector('#np1').value,b=m.querySelector('#np2').value,err=m.querySelector('#perr'),btn=m.querySelector('#pgo');
    if(a.length<6){err.textContent='La password deve avere almeno 6 caratteri';return}
    if(a!==b){err.textContent='Le due password non coincidono';return}
    btn.disabled=true;const {error}=await sbc.auth.updateUser({password:a});btn.disabled=false;
    if(error){err.textContent=/different from the old|same/i.test(error.message||'')?'Scegli una password diversa da quella vecchia':'Non riuscito: '+error.message;return}
    m.classList.add('closing');setTimeout(()=>m.remove(),200);toast('Password aggiornata!');buzz(20);
  };
}

// ===== Spunta verificata =====
async function loadBadges(){try{const {data}=await sbc.rpc('player_badges');devIds=new Set((data||[]).filter(x=>x.badge==='dev').map(x=>x.id));if(code)render();else refresh()}catch(e){}}

// ===== Avvio =====
(async function boot(){
  renderVer();
  const qp=new URLSearchParams(location.search),hp=new URLSearchParams(location.hash.slice(1));
  const r=(qp.get('r')||'').toUpperCase().replace(/[^A-Z]/g,'');
  if(r.length===4)pendingRoom=r;
  const oerr=hp.get('error_description')||qp.get('error_description');
  if(sbc)loadBadges();
  if(!sbc){show('welcome','Libreria di connessione non caricata. Controlla la connessione internet e ricarica la pagina.');return}
  $('#app').innerHTML=`<div class="center"><div class="spin"></div>Avvio…</div>`;
  let recoveryShown=false;const recover=()=>{if(recoveryShown)return;recoveryShown=true;setTimeout(openNewPassword,600)};
  sbc.auth.onAuthStateChange((ev,sess)=>{if(ev==='PASSWORD_RECOVERY')recover();if(ev==='SIGNED_IN'||ev==='SIGNED_OUT'||ev==='PASSWORD_RECOVERY')setTimeout(()=>onSession(sess),0)});
  let s=null;try{const {data}=await sbc.auth.getSession();s=data.session}catch(e){}
  if(RECOVERY&&s)recover();
  if(s)await onSession(s);
  else if(pendingRoom&&me.name){const c=pendingRoom;pendingRoom=null;joinRoom(c)}
  else{show('welcome','',{root:true});if(pendingRoom)setTimeout(()=>{if(!code&&!profile&&pendingRoom)openNameSheet(()=>{const r=pendingRoom;pendingRoom=null;if(r)joinRoom(r)},pendingRoom)},350)}
  if(oerr)toast(decodeURIComponent(oerr).replace(/\+/g,' '),5000);
  if(location.hash&&/access_token|error/.test(location.hash))setUrl(location.pathname+location.search);
})();
