// ===== The Game · regole, tavolo, stanza online =====
const FIRE=[22,33,44,55,66,77],MAXP=5;

// ===== Regole (funzioni pure sullo stato del tavolo) =====
const TG={
  isFire:(g,c)=>!!(g.opts&&g.opts.fire&&FIRE.includes(c)),
  top:p=>p.cards.length?p.cards[p.cards.length-1]:(p.dir==='up'?1:100),
  can(p,c){const t=TG.top(p);return p.dir==='up'?(c>t||c===t-10):(c<t||c===t+10)},
  isBack(p,c){const t=TG.top(p);return p.dir==='up'?c===t-10:c===t+10},
  min:g=>g.deck.length?(g.opts.pro?3:2):1,
  handSize:(n,pro)=>(n===1?8:n===2?7:6)-(pro?1:0),
  remaining:g=>g.deck.length+g.order.reduce((s,id)=>s+(g.hands[id]||[]).length,0),
  cur:g=>g.order[g.turn],
  nm(g,id){const p=(g.players||[]).find(x=>x.id===id);return p?p.name:'Qualcuno'},
  log(g,m){g.log=(g.log||[]).concat(m).slice(-5)},
  // distribuisce le carte: g.order deve essere già pronto
  deal(g){
    const n=g.order.length,hs=TG.handSize(n,g.opts.pro);
    const deck=[];for(let i=2;i<=99;i++)deck.push(i);
    const d=shuffle(deck),hands={},stats={};
    g.order.forEach(id=>{hands[id]=d.splice(0,hs).sort((a,b)=>a-b);stats[id]={played:0,backs:0}});
    Object.assign(g,{phase:n===1?'play':'choose',votes:{},result:null,hands,deck:d,turn:0,turnNo:1,played:[],signals:{},stats,
      piles:[{dir:'up',cards:[]},{dir:'up',cards:[]},{dir:'down',cards:[]},{dir:'down',cards:[]}]});
    g.log=[n===1?'Partita in solitario: 8 carte in mano.':'Carte distribuite: decidete chi inizia.'];
    return g;
  },
  // fine della scelta: id di chi inizia, oppure null = a caso
  begin(g,id){
    if(g.phase!=='choose')return false;
    let i=id?g.order.indexOf(id):-1;
    const rnd=i<0;if(rnd)i=Math.floor(Math.random()*g.order.length);
    g.turn=i;g.phase='play';g.votes={};
    g.log=['Si parte! Inizia '+TG.nm(g,TG.cur(g))+(rnd?' (scelto a caso).':'.')];
    return true;
  },
  // voto unanime? restituisce l'id scelto da tutti, altrimenti null
  agreed(g){const v=g.order.map(id=>(g.votes||{})[id]);return v.every(x=>x&&x===v[0])?v[0]:null},
  finish(g,reason,pid){
    g.phase='end';g.played=[];
    const r=TG.remaining(g);g.result={reason,remaining:r,won:reason!=='fire'&&r===0};
    if(reason==='stuck')TG.log(g,TG.nm(g,pid)+' non riesce a calare: fine partita.');
    if(reason==='fire')TG.log(g,'Una carta di fuoco è rimasta scoperta.');
    if(g.result.won)TG.log(g,'Tutte le 98 carte calate!');
    return true;
  },
  play(g,pid,pi,c){
    const p=g.piles[pi],hand=g.hands[pid]||[];
    if(!p||!hand.includes(c)||!TG.can(p,c))return false;
    const back=TG.isBack(p,c);
    g.hands[pid]=hand.filter(x=>x!==c);
    g.played.push({pi,c,fb:p.fireBy==null?null:p.fireBy,back});
    p.cards.push(c);
    if(TG.isFire(g,c))p.fireBy=g.turnNo+1;else delete p.fireBy;
    const st=g.stats[pid]||(g.stats[pid]={played:0,backs:0});st.played++;if(back)st.backs++;
    if(!g.deck.length&&g.order.every(id=>!(g.hands[id]||[]).length))TG.finish(g,'win',pid);
    return true;
  },
  undo(g,pid){
    const m=g.played.pop();if(!m)return false;
    const p=g.piles[m.pi];p.cards.pop();
    if(m.fb==null)delete p.fireBy;else p.fireBy=m.fb;
    g.hands[pid].push(m.c);g.hands[pid].sort((a,b)=>a-b);
    const st=g.stats[pid];if(st){st.played--;if(m.back)st.backs--}
    return true;
  },
  canEnd(g,pid){const n=g.played.length,h=g.hands[pid]||[];return n>=TG.min(g)||!h.length},
  end(g,pid){
    if(!TG.canEnd(g,pid))return false;
    const n=g.played.length;
    TG.log(g,TG.nm(g,pid)+' ha calato '+n+(n===1?' carta.':' carte.'));
    if(g.piles.some(p=>p.fireBy!=null&&p.fireBy<=g.turnNo))return TG.finish(g,'fire',pid);
    g.hands[pid]=(g.hands[pid]||[]).concat(g.deck.splice(0,n)).sort((a,b)=>a-b);
    if(!g.hands[pid].length)TG.log(g,TG.nm(g,pid)+' ha finito le carte.');
    const N=g.order.length;let nx=-1;
    for(let k=1;k<=N;k++){const i=(g.turn+k)%N;if((g.hands[g.order[i]]||[]).length){nx=i;break}}
    if(nx<0)return TG.finish(g,'win',pid);
    g.turn=nx;g.turnNo++;g.played=[];
    return true;
  },
  // la mano ha almeno una carta che entra da qualche parte?
  anyMove(g,pid){return(g.hands[pid]||[]).some(c=>g.piles.some(p=>TG.can(p,c)))},
  verdict(r){
    if(r.reason==='fire')return['Bruciati!','Una carta di fuoco è rimasta scoperta oltre il turno del giocatore successivo.'];
    if(r.won)return['Avete battuto The Game!','Tutte le 98 carte sono sulle pile. Provate la versione per professionisti o On Fire.'];
    if(r.remaining<10)return['Risultato brillante','Meno di 10 carte rimaste: ottimo lavoro di squadra.'];
    if(r.remaining<25)return['Ci siete quasi','Sotto le 10 carte il risultato è brillante. Riprovate!'];
    return['Il gioco ha vinto','Saltate meno numeri e usate la mossa al contrario: si scende sotto 10.'];
  }
};

// ===== Disegno carte e tavolo (usato sia online sia con un solo telefono) =====
const cardHtml=(n,fire,extra,st)=>`<span class="gc ${fire?'fire':''} ${extra||''}"${st?` style="${st}"`:''}><i class="tl">${n}</i><b>${n}</b><i class="br">${n}</i></span>`;
const dirHtml=d=>d==='up'?'<span class="gc dir up"><span class="arr"></span><b>1</b></span>':'<span class="gc dir down"><b>100</b><span class="arr"></span></span>';
const tilt=c=>((c*37)%11)-5;
// o: {viewer, myTurn, signals:{own,list}, act:'data-a'|'data-go'}
function tableHtml(g,o){
  const tops=g.piles.map(TG.top),live=g.phase==='play',A=o.act||'data-a';
  const piles=g.piles.map((p,i)=>{
    const t=tops[i],has=p.cards.length;let cls='pile',tag='';
    if(sel!=null&&o.myTurn){if(TG.can(p,sel)){if(TG.isBack(p,sel)){cls+=' back';tag=`<span class="tag10">${p.dir==='up'?'−10':'+10'}</span>`}else cls+=' ok'}else cls+=' no'}
    const land=has&&lastTops[i]!==undefined&&lastTops[i]!==t?'land':'';
    const fw=p.fireBy!=null&&live?`<span class="firewarn">🔥 ${p.fireBy===g.turnNo?'Copritela in questo turno':'Da coprire entro il prossimo turno'}</span>`:'';
    let sigs='';
    if(o.signals){const s=(g.signals&&g.signals[i])||{};
      const chips=Object.entries(s).filter(([,v])=>v).map(([id,v])=>`<span class="sig ${v}">${esc(TG.nm(g,id))} · ${v==='stop'?'Stop':'Vicina'}</span>`).join('');
      const mine=s[o.viewer];
      const sb=o.signals.own&&live?`<button type="button" class="sigbtn" ${A}="sig" data-i="${i}">${mine==='stop'?'Stop → Vicina':mine==='near'?'Togli segnale':'Segnala'}</button>`:'';
      sigs=`<div class="sigrow">${chips}${sb}</div>`}
    return`<div class="pilew"><button type="button" class="${cls}" ${A}="pile" data-i="${i}" aria-label="Pila ${p.dir==='up'?'crescente':'decrescente'}, in cima ${t}">
      <span class="pdir"><i>${p.dir==='up'?'▲':'▼'}</i>${p.dir==='up'?'1 → 99':'100 → 2'}</span>
      <span class="slot">${has?p.cards.slice(-3,-1).map(c=>cardHtml(c,TG.isFire(g,c),'under',`transform:rotate(${tilt(c)}deg)`)).join('')+cardHtml(t,TG.isFire(g,t),land,`transform:rotate(${tilt(t)/2}deg)`):dirHtml(p.dir)}</span>
      <span class="pcount">${has} ${has===1?'carta':'carte'}</span>${tag}${fw}</button>${sigs}</div>`}).join('');
  lastTops=tops;
  return`<div class="tbl"><div class="thead"><div class="deckinfo"><span class="stack" aria-hidden="true"><span class="cback"></span><span class="cback"></span><span class="cback"></span></span><span>Mazzo<b>${g.deck.length}</b></span></div><div class="tstatus ${o.statusMine?'mine':''}">${o.status||''}</div></div>
    <div class="piles">${piles}</div></div>
    <ul class="tlog">${(g.log||[]).slice().reverse().slice(0,3).map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`;
}
function handHtml(g,pid,myTurn,A='data-a'){
  const my=g.hands[pid]||[];if(sel!=null&&(!myTurn||!my.includes(sel)))sel=null;
  const n=my.length,mid=(n-1)/2;let k=0;
  const html=`<div class="hand">${my.map((c,idx)=>{const ok=g.piles.some(p=>TG.can(p,c)),off=idx-mid;
    const isNew=!lastHand||!lastHand.includes(c);
    return`<button type="button" class="gc ${c===sel?'sel':''} ${TG.isFire(g,c)?'fire':''} ${myTurn&&!ok?'dead':''}${isNew?' deal':''}" style="--r:${(off*4).toFixed(1)}deg;--y:${(off*off*1.3).toFixed(1)}px;--i:${isNew?k++:0}" ${A}="card" data-c="${c}" ${myTurn?'':'disabled'} aria-label="Carta ${c}"><i class="tl">${c}</i><b>${c}</b><i class="br">${c}</i></button>`}).join('')}</div>`;
  lastHand=my.slice();return html;
}
function turnActions(g,pid,A='data-a'){
  const need=TG.min(g),done=g.played.length,my=g.hands[pid]||[];
  let d='';
  if(done<need&&my.length&&!TG.anyMove(g,pid))d+=`<div class="stuck"><span>Nessuna tua carta entra nelle pile.${done?' Puoi annullare e provare un altro ordine.':''}</span><button type="button" class="btn sm" ${A}="giveup">Chiudi la partita</button></div>`;
  d+=`<div class="tact"><button type="button" class="btn ghost" ${A}="undo" ${done?'':'disabled'}>Annulla</button><button type="button" class="btn primary" ${A}="end" ${TG.canEnd(g,pid)?'':'disabled'}>Fine turno · ${done}/${need}</button></div>`;
  return d;
}
function setDock(html){const d=$('#dock');if(d)d.innerHTML=html?`<div class="dockin">${html}</div>`:'';document.body.classList.toggle('ingame',!!html)}

// ===== Stato della stanza (eseguito dall'host) =====
function newState(){return{phase:'lobby',hostId:me.id,players:[{id:me.id,name:me.name,color:me.color||COLORS[0],uid:me.uid||null}],opts:{pro:false,fire:false},order:[],hands:{},deck:[],piles:[],turn:0,turnNo:0,played:[],signals:{},log:[],result:null,stats:{},matchId:null,rematch:[]}}
function pickColor(S,want){const used=new Set(S.players.map(p=>p.color));if(want&&/^#[0-9a-fA-F]{6}$/.test(want)&&!used.has(want))return want;return COLORS.find(c=>!used.has(c))||COLORS[S.players.length%COLORS.length]}
function ensureMe(){const p=state.players.find(x=>x.id===me.id);if(p){p.name=me.name;p.uid=me.uid||null}else state.players.unshift({id:me.id,name:me.name,color:pickColor(state,me.color),uid:me.uid||null});state.hostId=me.id}
function startMatch(S,ids){S.order=ids.slice(0,MAXP);S.matchId=uuid();S.rematch=[];TG.deal(S)}
function removeFromGame(S,id){
  const idx=S.order.indexOf(id);if(idx<0)return;
  if(S.phase==='play'&&TG.cur(S)===id)while(S.played.length)TG.undo(S,id);
  S.deck=shuffle(S.deck.concat(S.hands[id]||[]));delete S.hands[id];
  S.order.splice(idx,1);Object.values(S.signals||{}).forEach(m=>delete m[id]);
  if(S.votes){delete S.votes[id];Object.keys(S.votes).forEach(k=>{if(S.votes[k]===id)delete S.votes[k]})}
  if(!S.order.length){S.phase='lobby';return}
  if(idx<S.turn)S.turn--;
  S.turn%=S.order.length;
  if(S.phase==='play'&&!(S.hands[TG.cur(S)]||[]).length){const N=S.order.length;let nx=-1;for(let k=0;k<N;k++){const i=(S.turn+k)%N;if((S.hands[S.order[i]]||[]).length){nx=i;break}}if(nx<0)TG.finish(S,'win');else{S.turn=nx;S.played=[]}}
  TG.log(S,'Le carte di chi è uscito tornano nel mazzo.');
}

function handle(a){
  const S=state;if(!S)return;const p=S.players.find(x=>x.id===a.from),isH=a.from===S.hostId,turnOk=S.phase==='play'&&TG.cur(S)===a.from;
  let ok=true;
  switch(a.type){
    case 'join':{const name=String(a.name||'?').trim().slice(0,22)||'?';const uid=typeof a.uid==='string'&&/^[0-9a-f-]{36}$/.test(a.uid)?a.uid:null;
      if(p){p.name=name;p.uid=uid}
      else{if(S.phase==='lobby'&&S.players.length>=MAXP){if(channel)channel.send({type:'broadcast',event:'full',payload:{to:a.from}});return}
        S.players.push({id:a.from,name,color:pickColor(S,a.color),uid})}break}
    case 'opts':if(isH&&S.phase==='lobby'){S.opts={pro:!!a.pro,fire:!!a.fire}}else ok=false;break;
    case 'start':if(isH&&S.phase==='lobby'&&S.players.length>=1)startMatch(S,S.players.map(x=>x.id));else ok=false;break;
    case 'vote':if(S.phase==='choose'&&S.order.includes(a.from)&&S.order.includes(a.id)){S.votes=S.votes||{};S.votes[a.from]=S.votes[a.from]===a.id?null:a.id;const w=TG.agreed(S);if(w)TG.begin(S,w)}else ok=false;break;
    case 'begin':if(isH&&S.phase==='choose')TG.begin(S,S.order.includes(a.id)?a.id:null);else ok=false;break;
    case 'play':ok=turnOk&&TG.play(S,a.from,+a.pi,+a.c);break;
    case 'undo':ok=turnOk&&TG.undo(S,a.from);break;
    case 'end':ok=turnOk&&TG.end(S,a.from);break;
    case 'giveup':ok=turnOk&&TG.finish(S,'stuck',a.from);break;
    case 'sig':if(S.phase==='play'&&S.order.includes(a.from)){const v=a.v==='stop'||a.v==='near'?a.v:null;S.signals[a.i]=Object.assign({},S.signals[a.i],{[a.from]:v})}else ok=false;break;
    case 'kick':if(isH&&a.id!==S.hostId){removeFromGame(S,a.id);S.players=S.players.filter(x=>x.id!==a.id)}else ok=false;break;
    case 'leave':if(S.phase==='lobby'&&!isH)S.players=S.players.filter(x=>x.id!==a.from);else ok=false;break;
    case 'again':if(isH&&S.phase==='end'){S.phase='lobby';S.rematch=[];S.players=S.players.filter(x=>online.has(x.id)||x.id===S.hostId).slice(0,MAXP)}else ok=false;break;
    case 'rematch':if(S.phase==='end'&&p){S.rematch=S.rematch||[];if(!S.rematch.includes(a.from))S.rematch.push(a.from);
      const here=S.players.filter(x=>online.has(x.id)||x.id===S.hostId).map(x=>x.id);
      if(isH||here.every(id=>S.rematch.includes(id))){S.players=S.players.filter(x=>here.includes(x.id));startMatch(S,here)}}else ok=false;break;
    default:return;
  }
  if(ok)push();
}

// ===== Rete (canale Supabase per stanza) =====
function push(){if(!isHost||!state)return;ls.set('thegame_host',{code,state,at:Date.now()});if(channel)channel.send({type:'broadcast',event:'state',payload:state});render()}
function send(a){a.from=me.id;if(isHost)handle(a);else if(channel)channel.send({type:'broadcast',event:'action',payload:a})}
async function enterRoom(c,host){
  try{await enterRoomInner(c,host)}catch(e){console.error(e);leave();state=null;goHome('Impossibile collegarsi: '+(e&&e.message||e))}
}
async function enterRoomInner(c,host){
  const client=getClient();
  code=c;isHost=host;online=new Set();lastKey='';seenPlayers=new Set();sel=null;lastTops=[];lastHand=null;
  $('#tabs').innerHTML='';document.body.classList.remove('has-tabs');
  if(window.onEnteredRoom)onEnteredRoom(c);
  setUrl('?r='+c);
  if(channel){try{await client.removeChannel(channel)}catch(e){}}
  $('#top').innerHTML='';setDock('');
  $('#app').className='';
  $('#app').innerHTML=`<div class="center"><div class="spin"></div>Connessione al tavolo ${esc(c)}…</div>`;lastKey='connecting';
  if(!host)state=null;
  channel=client.channel('thegame-'+c,{config:{broadcast:{self:false},presence:{key:me.id}}});
  channel
    .on('broadcast',{event:'state'},({payload})=>{
      if(isHost)return;clearTimeout(joinTimer);state=payload;
      if(!state.players.find(p=>p.id===me.id)&&Date.now()-lastJoin>2000){lastJoin=Date.now();send({type:'join',name:me.name,uid:me.uid,color:me.color})}
      render();
    })
    .on('broadcast',{event:'action'},({payload})=>{if(isHost)handle(payload)})
    .on('broadcast',{event:'hello'},()=>{if(isHost)push()})
    .on('broadcast',{event:'full'},({payload})=>{if(!isHost&&payload&&payload.to===me.id){leave();goHome('Il tavolo è pieno: The Game si gioca al massimo in 5.')}})
    .on('presence',{event:'sync'},()=>{online=new Set(Object.keys(channel.presenceState()));if(isHost&&state)push();else render()})
    .subscribe(async st=>{
      if(st==='SUBSCRIBED'){
        await channel.track({name:me.name});
        if(isHost){ensureMe();push()}
        else{
          lastJoin=Date.now();send({type:'join',name:me.name,uid:me.uid,color:me.color});
          channel.send({type:'broadcast',event:'hello',payload:{}});
          clearTimeout(joinTimer);
          joinTimer=setTimeout(()=>{if(!state){leave();goHome(`Tavolo ${c} non trovato. Controlla il codice: chi l'ha creato deve avere la pagina aperta.`)}},6000);
        }
      }else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){toast('Connessione instabile, riprovo…')}
    });
  if(host){clearTimeout(joinTimer);joinTimer=setTimeout(()=>{if(lastKey==='connecting'){leave();state=null;goHome("Il server di gioco non risponde. Apri il gioco dal suo link online (GitHub Pages) e non dall'anteprima o dal file sul computer, poi riprova.")}},9000)}
}
function leave(){clearTimeout(joinTimer);if(channel&&sbc){try{sbc.removeChannel(channel)}catch(e){}}channel=null;state=null;code=null;isHost=false;online=new Set();sel=null;setDock('');setUrl(location.pathname);if(window.onLeftRoom)onLeftRoom()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&channel){try{channel.track({name:me.name})}catch(e){}if(!isHost)channel.send({type:'broadcast',event:'hello',payload:{}})}});

// ===== Schermate della stanza =====
const playerOf=id=>state.players.find(x=>x.id===id)||{name:'?',color:'#fff'};
function optsHtml(o,can,A){
  const it=(k,ic,t,d,cls='')=>`<button type="button" class="opt ${cls} ${o[k]?'on':''}" ${A}="opt" data-k="${k}" ${can?'':'disabled'} aria-pressed="${!!o[k]}"><span class="oi">${ic}</span><div><b>${t}</b><small>${d}</small></div><span class="tg"></span></button>`;
  return`<div class="opts">${it('pro','💀','Versione per professionisti','Almeno 3 carte a turno e una carta in meno in mano.')}${it('fire','🔥','Espansione On Fire','22, 33, 44, 55, 66 e 77 bruciano: copritele entro il turno successivo.','fire')}</div>`;
}
const VIEWS={
  lobby:()=>`
    <div class="card share"><div class="lbl">Codice del tavolo</div><div class="bigcode">${[...code].map((ch,i)=>`<span style="--i:${i}">${esc(ch)}</span>`).join('')}</div><div id="qr" class="qr"></div><button class="btn ghost sm" data-a="copy">Condividi link d'invito</button></div>
    <h3 id="pcount">Giocatori</h3>
    <div id="plist" class="plist"></div>
    <div id="invfr"></div>
    <h3>Regole</h3>
    <div id="optbox"></div>
    ${isHost?`<button class="btn primary big" data-a="start" id="startBtn" style="margin-top:18px">Inizia la partita</button><p class="hint" id="startHint" style="margin-top:10px"></p>`:`<p class="wait" style="margin-top:18px">In attesa che l'host avvii la partita…</p>`}`,
  play:()=>`<div id="tablebox"></div>`,
  choose:()=>`<div class="choose"><p class="lbl tc">Carte distribuite</p><h1 class="headline tc">Chi inizia?</h1>
    <p class="sub tc">Guardate le vostre carte e decidete insieme chi ha la mano migliore. Senza dire i numeri!</p>
    <div id="votebox" class="flist"></div><div id="choosehint"></div>
    ${isHost?`<button type="button" class="btn ghost big" data-a="begin" data-id="" style="margin-top:14px">🎲 Scegli a caso</button>`:''}</div>`,
  end:()=>{
    const S=state,r=S.result||{remaining:0},[t,sub]=TG.verdict(r),pct=Math.round((98-r.remaining)/98*100);
    return`<div class="bigres ${r.won?'win':''} ${r.reason==='fire'?'burn':''}"><p class="lbl">${r.won?'Carte rimaste':'Carte non calate'}</p><div class="n">${r.remaining}</div><h2>${esc(t)}</h2><p>${esc(sub)}</p>
      <div class="meter"><span style="width:${pct}%"></span></div><div class="meterl"><span>${98-r.remaining} calate</span><span>98</span></div>
      <div class="rtags">${S.opts.pro?'<span class="tag">💀 Professionisti</span>':''}${S.opts.fire?'<span class="tag">🔥 On Fire</span>':''}<span class="tag">${S.order.length===1?'Solitario':S.order.length+' giocatori'}</span></div></div>
      <h3>La squadra</h3>
      <div class="flist">${S.order.map(id=>{const p=playerOf(id),st=(S.stats||{})[id]||{played:0,backs:0};return`<div class="frow">${av(p)}<div class="fi"><b>${nm(p)}</b><small>${st.played} ${st.played===1?'carta calata':'carte calate'}${st.backs?` · ${st.backs} ${st.backs===1?'mossa':'mosse'} al contrario`:''}</small></div></div>`}).join('')}</div>
      <button class="btn big sharebtn" data-go="share" style="margin-top:18px">📸 Condividi il risultato</button>
      <button class="btn primary big" data-a="rematch" id="rematchBtn" style="margin-top:10px">🔁 Rivincita</button>
      <div id="rematchst"></div>
      ${isHost?`<button class="btn ghost big" data-a="again" style="margin-top:10px">Cambia giocatori o regole</button>`:''}
      <button class="btn ghost big" data-a="exit-end" style="margin-top:10px">Torna alla home</button>`}
};

function renderTop(){
  const S=state,inGame=S.phase!=='lobby',cur=S.phase==='play'?TG.cur(S):null;
  const list=inGame?S.order.map(playerOf):[];
  $('#top').innerHTML=`<div class="bar g3"><button class="exit" data-a="exit" aria-label="Esci dal tavolo"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Esci</button><button class="codechip" data-a="copy" aria-label="Condividi il codice ${esc(code)}">🔗 ${esc(code)}</button>${soundBtn('iconbtn sm sndb')}</div>
  ${inGame?`<div class="scores">${list.map(p=>{const n=(S.hands[p.id]||[]).length;return`<span class="sc ${online.has(p.id)?'':'off'} ${p.id===cur?'psy':''} ${!n&&S.phase==='play'?'out':''}">${av(p,'sm')}${nm(p)}${p.id===me.id?' (tu)':''} <span class="cnt">${n?`<span class="cback"></span>${n}`:'fuori'}</span></span>`}).join('')}</div>`:''}`;
}
function render(){
  if(!state||!code)return;
  const S=state;
  if($('#tabs').innerHTML){$('#tabs').innerHTML='';document.body.classList.remove('has-tabs')}
  renderTop();
  const key=[S.phase,S.matchId||'',isHost?'H':''].join('#');
  if(key!==lastKey){
    const prevPhase=lastKey.split('#')[0];lastKey=key;
    $('#app').innerHTML=(VIEWS[S.phase]||VIEWS.lobby)();enterAnim();
    const qr=$('#qr');if(qr&&window.QRCode){try{new QRCode(qr,{text:inviteLink(),width:150,height:150,colorDark:'#1c0503',colorLight:'#ffffff'})}catch(e){}}
    if(S.phase==='choose'){lastTops=[];lastHand=null;sel=null;buzz(30);SFX.whoosh()}
    if(S.phase==='play'&&prevPhase!=='play'){lastTops=[];sel=null;if(prevPhase!=='choose'){lastHand=null;buzz(30);SFX.whoosh()}else SFX.chime()}
    if(S.phase==='end'&&prevPhase!=='end'){const r=S.result||{};if(r.won){confetti(220,600);SFX.fanfare(.6);setTimeout(()=>confetti(140),2000)}else if(r.remaining<10&&r.reason!=='fire'){confetti(120,600);SFX.fanfare(.6)}else SFX.drum(0,.8);if(window.recordMatch)recordMatch()}
  }
  updateDyn();
}
let prevTurnKey='';
function updateDyn(){
  const S=state;
  const pl=$('#plist');if(pl){pl.innerHTML=S.players.map(p=>{const isNew=!seenPlayers.has(p.id);return`<div class="pl ${online.has(p.id)?'':'off'} ${isNew?'new':''}">${av(p)}<span>${nm(p)}</span>${p.id===S.hostId?'<em>host</em>':''}${p.id===me.id?'<em>tu</em>':''}${isHost&&p.id!==S.hostId?`<button class="x" data-a="kick" data-id="${p.id}">rimuovi</button>`:''}</div>`}).join('');if(seenPlayers.size&&S.players.some(p=>!seenPlayers.has(p.id)&&p.id!==me.id))SFX.join();S.players.forEach(p=>seenPlayers.add(p.id))}
  const pc=$('#pcount');if(pc)pc.textContent=`Giocatori · ${S.players.length}/${MAXP}`;
  const ob=$('#optbox');if(ob)ob.innerHTML=optsHtml(S.opts||{},isHost,'data-a');
  const sb=$('#startBtn');if(sb){const n=S.players.length;sb.textContent=n===1?'Gioca in solitario':`Inizia la partita (${n} giocatori)`;const h=$('#startHint');if(h)h.textContent=n===1?'Da solo giochi con 8 carte in mano. Aspetta gli amici o inizia.':'Dopo la distribuzione scegliete insieme chi inizia.'}
  const rb=$('#rematchBtn');if(rb){const votes=(S.rematch||[]).filter(id=>S.players.some(p=>p.id===id)),mine=votes.includes(me.id),others=votes.filter(v=>v!==me.id).length;
    rb.disabled=!isHost&&mine;rb.textContent=isHost?(others?`🔁 Rivincita · ${others} ${others===1?'pronto':'pronti'}`:'🔁 Rivincita'):mine?'Pronto! Aspetto gli altri…':'🔁 Rivincita';
    const rs=$('#rematchst');if(rs)rs.innerHTML=votes.length?`<p class="hint" style="margin:10px 0 0">Vogliono la rivincita:</p><div class="chips" style="margin-top:6px">${votes.map(id=>{const p=playerOf(id);return`<span class="chip done">${av(p,'sm')}${nm(p)}</span>`}).join('')}</div>`:''}
  if(window.renderInviteFriends)renderInviteFriends();
  if(S.phase==='play'){
    const cur=TG.cur(S),myTurn=cur===me.id,playing=S.order.includes(me.id),need=TG.min(S),done=S.played.length;
    const status=myTurn?(done<need?`Tocca a te · ancora ${need-done}`:'Tocca a te · puoi chiudere'):`Tocca a ${esc(TG.nm(S,cur))}${done?' · '+done+' calate':''}`;
    const tb=$('#tablebox');if(tb)tb.innerHTML=tableHtml(S,{viewer:me.id,myTurn,signals:{own:playing},status,statusMine:myTurn});
    let d='';
    if(!playing)d='<p class="spect">Stai guardando la partita. Entri dalla prossima.</p>';
    else if(!(S.hands[me.id]||[]).length)d='<p class="spect">Hai finito le tue carte. Gli altri continuano.</p>';
    else{d=handHtml(S,me.id,myTurn);if(myTurn)d+=turnActions(S,me.id)}
    setDock(d);
    const tk=cur+'#'+S.turnNo;if(tk!==prevTurnKey){if(prevTurnKey&&myTurn){buzz([30,50,30]);SFX.chime()}prevTurnKey=tk}
  }else if(S.phase==='choose'){
    const playing=S.order.includes(me.id),votes=S.votes||{},mine=votes[me.id];
    const vb=$('#votebox');if(vb)vb.innerHTML=S.order.map(id=>{const p=playerOf(id),who=S.order.filter(v=>votes[v]===id);
      return`<button type="button" class="frow vote ${mine===id?'on':''}" data-a="vote" data-id="${id}" ${playing?'':'disabled'}>${av(p)}<div class="fi"><b>${nm(p)}${id===me.id?' (tu)':''}</b><small>${who.length?'Votato da '+who.map(v=>esc(playerOf(v).name)).join(', '):'Nessun voto'}</small></div>${isHost?`<span class="btn sm primary gostart" data-a="begin" data-id="${id}">Inizia</span>`:`<span class="vcount">${who.length}</span>`}</button>`}).join('');
    const ch=$('#choosehint');if(ch){const n=S.order.filter(id=>votes[id]).length;ch.innerHTML=`<p class="hint" style="margin-top:12px">${playing?(mine?'Hai votato. ':'Tocca chi secondo te deve iniziare. '):''}Quando votate tutti la stessa persona si parte${isHost?', oppure scegli tu con Inizia':''}. Voti: ${n}/${S.order.length}</p>`}
    setDock(playing?handHtml(S,me.id,false):'<p class="spect">Stai guardando la partita. Entri dalla prossima.</p>');
  }else setDock('');
}

// ===== Azioni UI =====
async function copyLink(){const link=inviteLink();if(navigator.share){try{await navigator.share({title:'The Game',text:'Siediti al mio tavolo di The Game: '+code,url:link});return}catch(e){if(e&&e.name==='AbortError')return}}try{await navigator.clipboard.writeText(link);toast('Link copiato!')}catch(e){prompt('Copia il link:',link)}}
function act(a,el){
  if(!code&&typeof LOCAL_ACT!=='undefined'&&LOCAL_ACT[a])return LOCAL_ACT[a](el);
  switch(a){
    case 'copy':copyLink();break;
    case 'exit':if(confirm(isHost?"Sei l'host: se esci la partita si ferma per tutti (potrai riprenderla dalla home). Uscire?":'Uscire dal tavolo?')){if(!isHost&&state&&state.phase==='lobby')send({type:'leave'});setTimeout(()=>{leave();goHome()},100)}break;
    case 'start':buzz(30);send({type:'start'});break;
    case 'vote':buzz(12);SFX.tap();send({type:'vote',id:el.dataset.id});break;
    case 'begin':buzz(20);send({type:'begin',id:el.dataset.id||null});break;
    case 'opt':{if(!isHost)return;const o=Object.assign({},state.opts);o[el.dataset.k]=!o[el.dataset.k];SFX.tap();send({type:'opts',...o});break}
    case 'kick':send({type:'kick',id:el.dataset.id});break;
    case 'card':{const c=+el.dataset.c;sel=sel===c?null:c;SFX.tap();updateDyn();break}
    case 'pile':{if(!state||state.phase!=='play')return;if(sel==null){if(TG.cur(state)===me.id)toast('Prima tocca una carta della tua mano');return}
      const c=sel,pi=+el.dataset.i;sel=null;if(!TG.can(state.piles[pi],c)){toast('Lì non entra');updateDyn();return}buzz(15);SFX.pop();send({type:'play',pi,c});break}
    case 'undo':send({type:'undo'});break;
    case 'end':buzz(20);SFX.whoosh();send({type:'end'});break;
    case 'giveup':if(confirm('Chiudere la partita? Si contano le carte rimaste.'))send({type:'giveup'});break;
    case 'sig':{const i=+el.dataset.i,cv=((state.signals||{})[i]||{})[me.id]||null;SFX.tap();send({type:'sig',i,v:cv===null?'stop':cv==='stop'?'near':null});break}
    case 'again':send({type:'again'});break;
    case 'rematch':buzz(20);SFX.pop();send({type:'rematch'});break;
    case 'exit-end':leave();goHome();break;
  }
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled)act(b.dataset.a,b)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&!b.disabled&&window.go)go(b.dataset.go,b)});
