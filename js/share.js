// ===== The Game · immagine del risultato da condividere (formato storia 1080×1920) =====
// data: {players:[{name,color,played,backs}], remaining, won, burned, pro, fire, offline}
async function makeResultImage(data){
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  try{await document.fonts.load('700 120px Oswald');await document.fonts.load('900 40px Rubik');await document.fonts.load('700 60px Caveat')}catch(e){}
  const F=(w,s,f='Rubik')=>`${w} ${s}px ${f}, system-ui, sans-serif`;
  // sfondo di fuoco
  let g=x.createRadialGradient(W/2,H*1.1,0,W/2,H*1.1,H*1.05);
  g.addColorStop(0,'#f2852a');g.addColorStop(.3,'#d9471a');g.addColorStop(.58,'#9b1b0e');g.addColorStop(.82,'#4a0a06');g.addColorStop(1,'#1c0503');
  x.fillStyle=g;x.fillRect(0,0,W,H);
  g=x.createLinearGradient(0,0,0,H*.45);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H*.45);
  for(let i=0;i<60;i++){const ex=Math.random()*W,ey=H*.4+Math.random()*H*.6,r=1.5+Math.random()*3;x.save();x.shadowColor='#ff6a1f';x.shadowBlur=12;x.fillStyle=`rgba(255,${150+Math.random()*60|0},70,${.4+Math.random()*.5})`;x.beginPath();x.arc(ex,ey,r,0,7);x.fill();x.restore()}
  const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
  // titolo
  x.textAlign='center';x.textBaseline='alphabetic';
  x.save();x.shadowColor='rgba(0,0,0,.6)';x.shadowOffsetY=8;x.fillStyle='#fff';
  x.font=F(700,230,'Oswald');const gw=x.measureText('GAME').width;x.font=F(700,110,'Oswald');const tw=x.measureText('THE').width;
  const sx=W/2-(gw+tw+24)/2;x.textAlign='left';x.fillText('THE',sx,330);x.font=F(700,230,'Oswald');x.fillText('GAME',sx+tw+24,330);x.restore();
  x.textAlign='center';x.save();x.translate(W/2,410);x.rotate(-.06);x.font=F(700,74,'Caveat');x.fillStyle='#fff';x.fillText('Gioca finché puoi…',0,0);x.restore();
  // numero
  const y0=520;rr(110,y0,860,640,56);x.fillStyle='rgba(28,5,3,.82)';x.fill();x.lineWidth=4;x.strokeStyle=data.burned?'rgba(46,168,230,.7)':'rgba(255,179,71,.6)';x.stroke();
  x.font=F(800,34);x.fillStyle='#dca68a';x.fillText(data.won?'CARTE RIMASTE':'CARTE NON CALATE',W/2,y0+80);
  x.font=F(700,300,'Oswald');x.lineWidth=14;x.strokeStyle=data.burned?'#031628':'#000';x.lineJoin='round';x.strokeText(String(data.remaining),W/2,y0+380);
  x.save();x.shadowColor=data.burned?'#2ea8e6':'#ff8a2e';x.shadowBlur=50;x.fillStyle=data.won?'#ffcf4a':'#fff';x.fillText(String(data.remaining),W/2,y0+380);x.restore();
  const [t]=TG.verdict({remaining:data.remaining,won:data.won,reason:data.burned?'fire':''});
  x.font=F(700,64,'Oswald');x.fillStyle='#fff';x.fillText(t.toUpperCase(),W/2,y0+480);
  const pct=(98-data.remaining)/98;rr(200,y0+530,680,26,13);x.fillStyle='#3a120a';x.fill();
  const bg=x.createLinearGradient(200,0,880,0);bg.addColorStop(0,'#e23a12');bg.addColorStop(.5,'#ff6a1f');bg.addColorStop(1,'#ffb347');rr(200,y0+530,Math.max(26,680*pct),26,13);x.fillStyle=bg;x.fill();
  x.font=F(600,30);x.fillStyle='#dca68a';x.fillText(`${98-data.remaining} carte calate su 98`,W/2,y0+600);
  // squadra
  let y=y0+720;
  const tags=[data.offline?'📱 Un solo telefono':'🌐 Online',data.players.length===1?'Solitario':data.players.length+' giocatori'];if(data.pro)tags.push('💀 Professionisti');if(data.fire)tags.push('🔥 On Fire');
  x.font=F(700,32);x.fillStyle='#ffb347';x.fillText(tags.join('  ·  '),W/2,y);y+=50;
  data.players.slice(0,5).forEach(p=>{
    rr(160,y,760,100,28);x.fillStyle='rgba(42,11,6,.88)';x.fill();
    x.save();x.shadowColor=p.color;x.shadowBlur=24;x.fillStyle=p.color;x.beginPath();x.arc(225,y+50,32,0,7);x.fill();x.restore();
    x.fillStyle='#1c0503';x.font=F(900,32);x.textBaseline='middle';x.fillText((p.name||'?').replace(/^anon_/,'')[0].toUpperCase(),225,y+52);x.textBaseline='alphabetic';
    x.textAlign='left';x.fillStyle='#fff4ec';x.font=F(800,38);let n=p.name;while(x.measureText(n).width>420&&n.length>2)n=n.slice(0,-2)+'…';x.fillText(n,280,y+64);
    x.textAlign='right';x.fillStyle='#ffb347';x.font=F(700,44,'Oswald');x.fillText(String(p.played),880,y+66);x.font=F(600,22);x.fillStyle='#dca68a';x.fillText('calate',880,y+90);x.textAlign='center';
    y+=116;
  });
  x.fillStyle='#ffe6d6';x.font=F(500,30);x.fillText(new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}),W/2,H-120);
  x.fillStyle='#fff';x.font=F(700,36);x.fillText('Gioca anche tu: yeezik-games.github.io/the-game',W/2,H-70);
  return new Promise(res=>c.toBlob(res,'image/png'));
}
async function shareResult(data){
  toast('Preparo l’immagine…',1500);
  const blob=await makeResultImage(data);if(!blob){toast('Non riesco a creare l’immagine');return}
  const file=new File([blob],'the-game-risultato.png',{type:'image/png'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'The Game',text:'Guarda com’è andata a The Game! https://yeezik-games.github.io/the-game/'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const url=URL.createObjectURL(blob);
  const m=document.createElement('div');m.className='modal center-modal';
  m.innerHTML=`<div class="sharebox"><img src="${url}" alt="Immagine del risultato"><p class="hint">Tieni premuto sull’immagine per salvarla, oppure scaricala.</p><div class="grid2"><a class="btn primary" href="${url}" download="the-game-risultato.png">Scarica</a><button class="btn ghost close" type="button">Chiudi</button></div></div>`;
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close')){m.remove();URL.revokeObjectURL(url)}});
  document.body.appendChild(m);
}
const shareData=(g,players,offline)=>({remaining:g.result.remaining,won:!!g.result.won,burned:g.result.reason==='fire',pro:!!g.opts.pro,fire:!!g.opts.fire,offline,
  players:g.order.map(id=>{const p=players(id),st=(g.stats||{})[id]||{played:0};return{name:p.name,color:p.color,played:st.played}})});
function shareOnline(){if(state&&state.result)shareResult(shareData(state,playerOf,false))}
function shareLocal(){if(L&&L.result)shareResult(shareData(L,LP,true))}
