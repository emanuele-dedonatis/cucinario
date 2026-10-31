(function(){
/* ---------- Categorie (collezione categories sul server) ----------
   Le crea la famiglia da Impostazioni → Obiettivi settimanali: {name, color (indice della tavolozza --k0…--k9 in app.css),
   order, goal:{min, max}}. Ogni ingrediente ha una lista di categorie e una ricetta ha quelle dei suoi ingredienti:
   sono i tag di ricette e ingredienti, i filtri, i reparti della spesa e gli obiettivi della settimana. */
const NCOL=10;
let CAT=[],catById={}; // CAT = categorie in ordine
const normGoal=g=>({min:(g&&g.min)||0,max:g&&g.max!=null?g.max:null});
function rebuildCats(){CAT=Object.keys(S.cats).map(id=>({...S.cats[id],id,goal:normGoal(S.cats[id].goal)}))
  .sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name,"it"));catById=Object.fromEntries(CAT.map(c=>[c.id,c]))}
const ingCats=x=>((x&&x.cats)||[]).filter(id=>catById[id]);
// rows = [[nome, quantità, unità]]; look(nome) → ingrediente. Categorie nell'ordine della lista
function recipeCats(rows,look){look=look||(n=>ING[n]);const s=new Set();for(const [n] of rows)for(const id of ingCats(look(n)))s.add(id);return CAT.filter(c=>s.has(c.id)).map(c=>c.id)}

/* ---------- Pasto e tipo ----------
   Ogni ricetta è adatta a pranzo e/o cena (meals: fisso, almeno uno) e a uno o più tipi (types: collezione types,
   personalizzabile; all'inizio Feriale e Festivo). La settimana tipo (settings.schedule: {pranzo:[7], cena:[7]} da lunedì
   a domenica, null = qualsiasi) dice il tipo di ogni pasto; un giorno può cambiarlo (plan.kinds, es. festivo infrasettimanale).
   "Riempi" usa solo le ricette adatte al pasto e al suo tipo. */
const MEALS=["pranzo","cena"];
let TYP=[],typById={};
function rebuildTypes(){TYP=Object.keys(S.types).map(id=>({...S.types[id],id})).sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name,"it"));typById=Object.fromEntries(TYP.map(t=>[t.id,t]))}
const tname=id=>typById[id]?typById[id].name:"";
const FE="tferiale0000000",FS="tfestivo0000000";
const DEF_SCHED={pranzo:[FE,FE,FE,FE,FE,FS,FS],cena:[FE,FE,FE,FE,FS,FS,FS]};
const dayIdx=k=>(new Date(k+"T12:00").getDay()+6)%7;
const schedOf=(k,m)=>{const v=((S.schedule||DEF_SCHED)[m]||[])[dayIdx(k)];return typById[v]?v:null};
const kindChanged=(k,m)=>{const o=(S.plan[k]||{}).kinds;return!!o&&m in o};
// tipo del pasto: quello cambiato per quel giorno, se c'è, altrimenti quello della settimana tipo; null = qualsiasi
const kindOf=(k,m)=>{if(kindChanged(k,m)){const v=S.plan[k].kinds[m];return typById[v]?v:null}return schedOf(k,m)};
// una ricetta senza tipi (es. dopo aver eliminato il suo unico tipo) va bene per tutti
const fits=(r,k,m)=>{const t=kindOf(k,m);return r.meals.includes(m)&&(!t||!r.ty.length||r.ty.includes(t))};
const mealsLbl=ms=>ms.length===2?"Pranzo e cena":ms[0]==="pranzo"?"Solo pranzo":"Solo cena";
const recMeta=r=>[mealsLbl(r.meals),r.ty.map(tname).join(", ")].filter(Boolean).join(" · ");

/* ---------- Ricette e ingredienti (collezioni recipes e ingredients sul server) ----------
   Dentro l'app una ricetta è {id, n:nome, k:[categorie], i:[[ingrediente, quantità, unità]], s:[passi], v, archived},
   con le quantità per una persona adulta; l'olio è un ingrediente come gli altri.
   Nella settimana ogni pasto ha le sue persone [adulti, bambini] e un bambino mangia S.people.kid % di un adulto.
   v = illustrazione: b = base del piatto, c = colore base, x = elementi [forma, colore, quantità, grandezza];
   senza v se ne usa una predefinita (DEFV). */
const pplFactor=([a,b])=>a+b*S.people.kid/100;
const pplLbl=([a,b])=>[a?`${a} ${a===1?"adulto":"adulti"}`:"",b?`${b} ${b===1?"bambino":"bambini"}`:""].filter(Boolean).join(" e ");
let R=[],DRAFTS=[],byId={},ING={}; // R = ricette attive (elenco, selettore, riempimento); DRAFTS = in costruzione; byId comprende anche quelle eliminate; ING = catalogo per nome
const grams=(q,u,x)=>(u==="g"||u==="ml")?q:q*((x&&x.unit_g)||100);
function rebuildRecipes(){
  rebuildCats();rebuildTypes();
  ING={};for(const id in S.ingr)ING[S.ingr[id].name]={...S.ingr[id],id};
  byId={};
  for(const id in S.recipes){const x=S.recipes[id],rows=x.ingredients||[];
    const meals=MEALS.filter(m=>(x.meals||MEALS).includes(m));
    byId[id]={id,n:x.name||"",k:recipeCats(rows),meals:meals.length?meals:MEALS,ty:TYP.filter(t=>(x.types||[]).includes(t.id)).map(t=>t.id),v:x.vis||null,s:x.steps||[],l:Array.isArray(x.links)?x.links:[],dr:!!x.draft,archived:!!x.archived,i:rows.map(([n,q,u])=>[n,q,u])}}
  // pasti salvati quando le ricette stavano nel codice: "ceci" ora è il record "rceci0000000000"
  for(const id in S.recipes){const old=/^r([a-z]+)0*$/.exec(id);if(old&&!byId[old[1]])byId[old[1]]=byId[id]}
  const live=Object.keys(S.recipes).map(id=>byId[id]).filter(r=>!r.archived).sort((a,b)=>a.n.localeCompare(b.n,"it"));
  R=live.filter(r=>!r.dr);DRAFTS=live.filter(r=>r.dr); // le ricette in costruzione non vanno nella settimana
  for(const k in nutCache)delete nutCache[k];for(const k in svgCache)delete svgCache[k];
}
// ingredienti in comune tra due ricette (escludo erbe e piccole cose che non cambiano il lavoro in cucina)
const MINOR=new Set(["Aglio","Basilico","Rosmarino","Prezzemolo","Limone","Farina","Capperi","Parmigiano","Burro","Vino bianco","Olio extravergine"]);
function shared(a,b){if(!a||!b||a.id===b.id)return[];const bn=new Set(b.i.map(x=>x[0]));return a.i.map(x=>x[0]).filter(n=>!MINOR.has(n)&&bn.has(n))}
const LINK_ICO=`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`;
const prevDinner=k=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),-1))]||{}).cena;return typeof v==="string"?byId[v]:null};

/* ---------- Valori nutrizionali (dal catalogo ingredienti, per 100 g) ---------- */
const nutCache={};
// look(nome) → {c,p,f,fib,unit_g}: l'editor passa anche gli ingredienti non ancora salvati
function nutrition(r,look){
  if(!look&&nutCache[r.id])return nutCache[r.id];
  let C=0,P=0,F=0,Fi=0;
  const add=(x,g)=>{C+=(x.c||0)*g/100;P+=(x.p||0)*g/100;F+=(x.f||0)*g/100;Fi+=(x.fib||0)*g/100};
  for(const [n,q,u] of r.i){const x=(look||(n=>ING[n]))(n);if(x)add(x,grams(q,u,x))}
  const kc=C*4,kp=P*4,kf=F*9,tot=kc+kp+kf||1;
  const pc=Math.round(kc/tot*100),pp=Math.round(kp/tot*100);
  const n={kcal:Math.round(tot),c:pc,p:pp,f:100-pc-pp,fib:Math.round(Fi),gC:Math.round(C),gP:Math.round(P),gF:Math.round(F)};
  if(!look)nutCache[r.id]=n;
  return n;
}
const FIB_LOW=4,FIB_GOOD=8;
const fibCls=f=>f<FIB_LOW?"low":f>=FIB_GOOD?"good":"";
const fibWord=f=>f<FIB_LOW?"poche":f>=FIB_GOOD?"buone":"discrete";
const mbar=n=>`<span class="mbar" aria-label="Carboidrati ${n.c}%, proteine ${n.p}%, grassi ${n.f}%"><i class="c" style="width:${n.c}%"></i><i class="p" style="width:${n.p}%"></i><i class="f" style="width:${n.f}%"></i></span>`;
/* ---------- Bilanciamento rispetto agli intervalli impostati ---------- */
const MAC=[["c","Carboidrati","gC"],["p","Proteine","gP"],["f","Grassi","gF"]];
function checkBalance(n){const g=S.ranges,out=[];
  for(const [k,name] of MAC){const [lo,hi]=g[k],fem=k==="p";if(n[k]<lo)out.push(`${name.toLowerCase()} ${fem?"basse":"bassi"} (${n[k]}%, minimo ${lo}%)`);else if(n[k]>hi)out.push(`${name.toLowerCase()} ${fem?"alte":"alti"} (${n[k]}%, massimo ${hi}%)`)}
  if(n.fib<g.fib)out.push(`poche fibre (${n.fib} g, minimo ${g.fib} g)`);
  return out}
const SCALE=80; // la barra va da 0 a 80%
function nutHtml(n,noRanges){const g=S.ranges,bad=checkBalance(n);
  const row=(k,name,gk)=>{const [lo,hi]=g[k],v=n[k],st=v<lo?"low":v>hi?"high":"ok";
    return `<div class="mrow ${st}"><div class="mtop"><span><i class="sw" style="background:var(--m-${k})"></i>${name}</span><span><b>${v}%</b> <small>${n[gk]} g</small></span></div>
      <div class="rtrack"><span class="band" style="left:${lo/SCALE*100}%;width:${(hi-lo)/SCALE*100}%"></span><span class="mark" style="left:${Math.min(v,SCALE)/SCALE*100}%;background:var(--m-${k})"></span></div>
      <div class="mnote">${st==="ok"?`nell'intervallo ${lo}–${hi}%`:st==="low"?`sotto di ${lo-v} punti · intervallo ${lo}–${hi}%`:`sopra di ${v-hi} punti · intervallo ${lo}–${hi}%`}</div></div>`};
  const fst=n.fib<g.fib?"low":"ok";
  return `<div class="nut">
   <div class="verdict ${bad.length?"warn":"ok"}"><b>${bad.length?"Da rivedere":"Pasto bilanciato"}</b>${bad.length?`<span>${bad.map(x=>x[0].toUpperCase()+x.slice(1)).join(" · ")}</span>`:`<span>Tutti i valori sono nei tuoi intervalli.</span>`}</div>
   <h4>A persona <span>circa ${n.kcal} kcal</span></h4>
   ${MAC.map(m=>row(...m)).join("")}
   <div class="mrow ${fst}"><div class="mtop"><span><i class="sw" style="background:var(--m-fib)"></i>Fibre</span><span><b>${n.fib} g</b></span></div>
     <div class="rtrack"><span class="band" style="left:${g.fib/16*100}%;right:0"></span><span class="mark" style="left:${Math.min(n.fib,16)/16*100}%;background:var(--m-fib)"></span></div>
     <div class="mnote">${fst==="ok"?`almeno ${g.fib} g ✓`:`ne mancano ${g.fib-n.fib} g · aggiungi verdure, legumi o cereali integrali`}</div></div>
   <div class="row" style="justify-content:space-between"><small>Percentuali sulle calorie. Valori stimati, compreso l'olio indicato nella ricetta.</small>${noRanges?"":`<button class="btn ghost" data-ranges style="padding:6px 12px;font-size:13px">Intervalli</button>`}</div></div>`}
function openRanges(back){
  const draw=()=>{const g=S.ranges;$("#sheetBody").innerHTML=`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Un pasto è bilanciato quando ogni valore cade nel suo intervallo. Le percentuali sono sulle calorie della porzione.</p><div class="grows">
    ${MAC.map(([k,name])=>`<div class="grow"><div class="gtop"><b>${name}</b><span style="color:var(--muted);font-size:13px">${g[k][0]}–${g[k][1]}%</span></div><div class="gctl">
      ${["Minimo","Massimo"].map((l,i)=>`<div class="stepper"><label>${l}</label><div><button data-k="${k}" data-i="${i}" data-d="-5" aria-label="Meno">−</button><output>${g[k][i]}%</output><button data-k="${k}" data-i="${i}" data-d="5" aria-label="Più">+</button></div></div>`).join("")}</div></div>`).join("")}
    <div class="grow"><div class="gtop"><b>Fibre</b><span style="color:var(--muted);font-size:13px">per pasto</span></div><div class="gctl"><div class="stepper"><label>Almeno</label><div><button data-k="fib" data-d="-1" aria-label="Meno">−</button><output>${g.fib} g</output><button data-k="fib" data-d="1" aria-label="Più">+</button></div></div></div></div>
    </div>${back?`<div style="margin-top:12px"><button class="btn" data-back>Torna alla ricetta</button></div>`:""}`};
  openSheet("Intervalli di un pasto bilanciato","");draw();
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-back]")){back();return}
    const b=e.target.closest("[data-k]");if(!b)return;const k=b.dataset.k,d=+b.dataset.d;
    if(k==="fib")S.ranges.fib=Math.max(0,Math.min(20,S.ranges.fib+d));
    else{const r=S.ranges[k],i=+b.dataset.i;r[i]=Math.max(0,Math.min(80,r[i]+d));if(r[0]>r[1])r[i?0:1]=r[i]}
    save();queueSettings("ranges");draw();renderRec()};
}

/* ---------- Illustrazioni dei piatti (SVG generato) ---------- */
const TABLE = [["#c8dae6","#b5cad9"],["#ead8bd","#dcc5a3"],["#efd3e2","#e3bfd2"],["#cfe8e2","#b9dcd3"],["#ecd0cc","#dfbcb6"],["#ece5bd","#ddd4a3"],["#ddd3ec","#cbbfe0"],["#d6e8cf","#c2dbb8"],["#f3dcc6","#e9c7a6"],["#dfe3e6","#cdd3d8"]]; // tavolo, per colore della categoria
function rng(seed){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
// illustrazione per le ricette nuove, finché non hanno una foto
const DEFV={lenticchie:{b:"half",c:"#7a5233",x:[["dot","#5c3c24",16,4],["dot","#e8873a",4,4]]},fagioli:{b:"soup",c:"#a4573b",x:[["bean","#c98a7a",9,7],["leaf","#4f7d3a",2,5]]},
  ceci:{b:"soup",c:"#d8b36a",x:[["dot","#e9cf8f",14,5],["leaf","#4f7d3a",2,5]]},pesce:{b:"none",x:[["fillet","#f4efe6",1,28],["dot","#e8463a",5,5],["leaf","#4f9a3a",3,5]]},
  carne:{b:"none",x:[["fillet","#c99a6a",2,18],["leaf","#4f9a3a",4,5]]},uova:{b:"disc",c:"#f0c548",x:[["dot","#e7b13a",6,4],["leaf","#6fa04a",3,5]]},
  latticini:{b:"none",x:[["cube","#f8f6ef",6,9],["round","#e0443a",3,8],["leaf","#3f8f3a",3,5]]}};
// illustrazione predefinita e colore del tavolo dalla prima categoria della ricetta
const DEFV_COL=[DEFV.pesce,DEFV.lenticchie,DEFV.fagioli,DEFV.ceci,DEFV.carne,DEFV.latticini,DEFV.uova];
const svgCache={};
function dishSvg(r){
  if(svgCache[r.id])return svgCache[r.id];
  const c0=catById[r.k[0]],col=c0?(c0.color||0)%NCOL:9;
  const rnd=rng(r.id),v=r.v||DEFV_COL[col%DEFV_COL.length],[t1,t2]=TABLE[col];
  const W=160,H=100,cx=80,cy=50,PR=42;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">`;
  s+=`<rect width="${W}" height="${H}" fill="${t1}"/>`;
  for(let i=0;i<6;i++)s+=`<rect x="${i*30-5}" y="0" width="12" height="${H}" fill="${t2}" opacity=".35"/>`;
  s+=`<ellipse cx="${cx+3}" cy="${cy+4}" rx="${PR+1}" ry="${PR+1}" fill="#000" opacity=".12"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${PR}" fill="#f6f5f1"/><circle cx="${cx}" cy="${cy}" r="${PR-6}" fill="#fbfaf7" stroke="#e7e4dc" stroke-width="1"/>`;
  const inR=PR-9;
  const pt=(rad)=>{const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*rad;return[cx+Math.cos(a)*d,cy+Math.sin(a)*d]};
  const b=v.b;
  if(b==="soup"){s+=`<circle cx="${cx}" cy="${cy}" r="${inR}" fill="${v.c}"/><circle cx="${cx-6}" cy="${cy-8}" r="${inR*0.5}" fill="#fff" opacity=".08"/>`}
  else if(b==="sauce"){s+=`<path d="M${cx-inR+3},${cy} C${cx-inR},${cy-inR+4} ${cx+inR-6},${cy-inR} ${cx+inR-2},${cy-2} C${cx+inR},${cy+inR-6} ${cx-inR+8},${cy+inR} ${cx-inR+3},${cy}Z" fill="${v.c}"/>`}
  else if(b==="disc"){s+=`<circle cx="${cx}" cy="${cy}" r="${inR-1}" fill="${v.c}"/><circle cx="${cx}" cy="${cy}" r="${inR-1}" fill="none" stroke="#c8902a" stroke-width="2.5" opacity=".6"/>`}
  else if(b==="wrap"){s+=`<path d="M${cx-30},${cy+12} L${cx+30},${cy+12} A30 30 0 0 0 ${cx-30},${cy+12}Z" fill="${v.c}" transform="rotate(-12 ${cx} ${cy})"/><path d="M${cx-30},${cy+12} L${cx+30},${cy+12}" stroke="#d9b876" stroke-width="2" transform="rotate(-12 ${cx} ${cy})"/>`}
  else if(b==="half"){s+=`<path d="M${cx},${cy-inR} A${inR} ${inR} 0 0 0 ${cx},${cy+inR}Z" fill="${v.c}"/>`;for(let i=0;i<40;i++){const a=rnd()*Math.PI-Math.PI/2,d=Math.sqrt(rnd())*(inR-3);s+=`<ellipse cx="${cx+4+Math.cos(a)*d}" cy="${cy+Math.sin(a)*d}" rx="2.6" ry="1.2" fill="#fbf8ef" transform="rotate(${rnd()*180} ${cx+4+Math.cos(a)*d} ${cy+Math.sin(a)*d})"/>`}}
  else if(b==="grain"){s+=`<circle cx="${cx}" cy="${cy}" r="${inR-2}" fill="${v.c}"/>`;for(let i=0;i<55;i++){const [x,y]=pt(inR-4);s+=`<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.1" fill="#fff" opacity=".45" transform="rotate(${rnd()*180} ${x} ${y})"/>`}}
  else if(b==="spaghetti"){for(let i=0;i<22;i++){const [x,y]=pt(inR-10);const r1=6+rnd()*12;s+=`<path d="M${x-r1},${y} q${r1},${-r1*1.2} ${r1*2},0 t${r1*0.8},${r1*0.3}" fill="none" stroke="${i%3?"#f0cf7a":"#e6be62"}" stroke-width="2.4" stroke-linecap="round"/>`}
    s+=`<circle cx="${cx}" cy="${cy}" r="${inR*0.55}" fill="${v.c}" opacity=".85"/>`}
  // elementi
  for(const [shape,col,count,size] of v.x){
    for(let k=0;k<count;k++){
      const rad=(count===1)?0:(shape==="fillet"&&count<=3?12:inR-size*0.6);
      let [x,y]=count===1?[cx+(rnd()-.5)*6,cy+(rnd()-.5)*6]:pt(Math.max(rad,4));
      const rot=rnd()*180;
      if(shape==="dot")s+=`<circle cx="${x}" cy="${y}" r="${size/2}" fill="${col}"/>`;
      else if(shape==="round")s+=`<circle cx="${x}" cy="${y}" r="${size/2}" fill="${col}" stroke="#000" stroke-opacity=".12" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${size/5}" fill="#fff" opacity=".35"/>`;
      else if(shape==="leaf")s+=`<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${size/2.2}" fill="${col}" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(shape==="short")s+=`<rect x="${x-size/2}" y="${y-size/3}" width="${size}" height="${size/1.6}" rx="${size/4}" fill="${col}" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(shape==="cube")s+=`<rect x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size}" rx="1.5" fill="${col}" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(shape==="bean")s+=`<ellipse cx="${x}" cy="${y}" rx="${size/1.6}" ry="${size/2.6}" fill="${col}" transform="rotate(${rot} ${x} ${y})"/><ellipse cx="${x}" cy="${y}" rx="${size/4}" ry="${size/7}" fill="#5a2a22" opacity=".5" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(shape==="stick")s+=`<rect x="${x-size/2}" y="${y-1.6}" width="${size}" height="3.2" rx="1.6" fill="${col}" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(shape==="wedge")s+=`<path d="M${x-size/2},${y+size/3} Q${x},${y-size*0.8} ${x+size/2},${y+size/3}Z" fill="${col}" stroke="#c9963a" stroke-width=".8" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(shape==="ball")s+=`<circle cx="${x}" cy="${y}" r="${size/2}" fill="${col}"/><circle cx="${x-size/6}" cy="${y-size/6}" r="${size/6}" fill="#fff" opacity=".2"/>`;
      else if(shape==="mush")s+=`<path d="M${x-size/2},${y} A${size/2} ${size/2} 0 0 1 ${x+size/2},${y}Z" fill="${col}" transform="rotate(${rot} ${x} ${y})"/><rect x="${x-size/7}" y="${y}" width="${size/3.5}" height="${size/2.5}" fill="#efe3cc" transform="rotate(${rot} ${x} ${y})"/>`;
      else if(shape==="egg")s+=`<ellipse cx="${x+(k?13:-13)}" cy="${y}" rx="${size/1.6}" ry="${size/2}" fill="#fff"/><circle cx="${x+(k?13:-13)}" cy="${y}" r="${size/4.2}" fill="#f2a516"/>`;
      else if(shape==="fillet"){const w=size,h=size*0.5;const yy=count>1?y:cy;const xx=count>1?x:cx-4;s+=`<rect x="${xx-w/2}" y="${yy-h/2}" width="${w}" height="${h}" rx="${h/2.2}" fill="${col}" transform="rotate(${count>1?rot:-14} ${xx} ${yy})"/>`;if(col==="#f2875a")for(let j=0;j<4;j++)s+=`<path d="M${xx-w/2+5+j*6},${yy-h/2+2} l4,${h-4}" stroke="#fbd0b8" stroke-width="1.4" transform="rotate(-14 ${xx} ${yy})"/>`;}
      else if(shape==="fish"){s+=`<g transform="rotate(-10 ${cx} ${cy})"><path d="M${cx-28},${cy} Q${cx-6},${cy-15} ${cx+18},${cy} Q${cx-6},${cy+15} ${cx-28},${cy}Z" fill="${col}"/><path d="M${cx+16},${cy} l12,-9 v18Z" fill="${col}"/><circle cx="${cx-20}" cy="${cy-3}" r="2" fill="#2f2e25"/><path d="M${cx-10},${cy-6} q4,6 0,12 M${cx},${cy-7} q4,7 0,14" stroke="#8d99a0" stroke-width="1.2" fill="none"/></g>`}
    }
  }
  s+=`</svg>`;
  return svgCache[r.id]=s;
}
function photoHtml(r,extra){const p=S.photos[r.id];return `<div class="ph${extra?" "+extra:""}">${p?`<img src="${p}" alt="">`:dishSvg(r)}</div>`}

/* ---------- Date ---------- */
const DAYS=["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"];
const MONTHS=["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const pad=n=>String(n).padStart(2,"0");
const key=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
function mondayOf(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-(x.getDay()+6)%7);return x}
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
let today=new Date(),thisMonday=mondayOf(today);

/* ---------- Stato: copia locale (funziona offline) + sincronizzazione con PocketBase ----------
   Collezioni sul server: plan (un record per giorno), shopping (record unico "lista": spunte, "a casa", altro, pasti già comprati),
   settings (unico record: obiettivi, intervalli, orari), photos (una foto per ricetta), recipes, ingredients.
   Le modifiche vanno in una coda locale (outbox) e partono appena c'è rete; vince l'ultima scrittura per campo. */
const CACHE="cucinario-stato-v1",OUTBOX="cucinario-outbox-v1",COLS=["plan","shopping","settings","photos","recipes","ingredients","categories","types"];
const JSONF=new Set(["pranzo","cena","checks","have","ranges","times","ingredients","steps","links","vis","cats","goal","meals","types","kinds","schedule","people","extra","done"]);
const pb=new PocketBase(location.origin);pb.autoCancellation(false);
// id dei record deterministici (15 caratteri a-z0-9), così ogni dispositivo sa quale record aggiornare
const pad15=s=>(s.replace(/[^a-z0-9]/g,"")+"0".repeat(15)).slice(0,15);
function hash36(s){let a=0xdeadbeef,b=0x41c6ce57;for(const c of s){const x=c.charCodeAt(0);a=Math.imul(a^x,2654435761);b=Math.imul(b^x,1597334677)}
  a=Math.imul(a^a>>>16,2246822507)^Math.imul(b^b>>>13,3266489909);b=Math.imul(b^b>>>16,2246822507)^Math.imul(a^a>>>13,3266489909);
  return((b>>>0).toString(36)+(a>>>0).toString(36))}
const ID={plan:k=>pad15("p"+k),shopping:w=>pad15("w"+w),settings:()=>"settings0000000",photos:r=>pad15("ph"+hash36(r)),ingredients:n=>pad15("i"+hash36(n))};
const SHOP0=()=>({checks:{},have:{},extra:[],done:{}});
const defaults=()=>({plan:{},shop:SHOP0(),photos:{},credits:{},recipes:{},ingr:{},cats:{},types:{},shopMode:"casa",schedule:DEF_SCHED,
  ranges:{c:[45,60],p:[15,25],f:[20,35],fib:8},times:{pranzo:"18:00",cena:"23:00"},people:{a:2,b:1,kid:60},country:""});
let S=defaults(),outbox=[],netOk=true;
try{S=Object.assign(defaults(),JSON.parse(localStorage.getItem(CACHE))||{})}catch(e){}
try{outbox=JSON.parse(localStorage.getItem(OUTBOX))||[]}catch(e){}
delete S.goals; // gli obiettivi ora stanno nelle categorie
delete S.checks;delete S.have;delete S.extra; // spesa per settimana, prima della lista unica
rebuildRecipes();
function save(){try{localStorage.setItem(CACHE,JSON.stringify(S))}catch(e){}}
function queue(col,id,data,del){data=JSON.parse(JSON.stringify(data||{}));const e=outbox.find(x=>x.col===col&&x.id===id);
  if(del){if(e)outbox.splice(outbox.indexOf(e),1);outbox.push({col,id,data:{},del:true})}  // eliminazione: scarto le modifiche in coda
  else if(e){if(e.del){e.del=false;e.data={}}Object.assign(e.data,data)}else outbox.push({col,id,data});
  try{localStorage.setItem(OUTBOX,JSON.stringify(outbox))}catch(e){}
  renderSync();clearTimeout(queue._t);queue._t=setTimeout(flush,300)}
const queueSettings=f=>queue("settings",ID.settings(),{[f]:S[f]});
const queueShop=f=>queue("shopping",ID.shopping("lista"),{week:"lista",[f]:S.shop[f]});
// i campi json viaggiano come testo JSON: così una stringa resta una stringa (vedi JSONField.PrepareValue)
const wire=d=>Object.fromEntries(Object.entries(d).map(([k,v])=>[k,JSONF.has(k)?JSON.stringify(v??null):v]));
async function upsert(e){const body=wire(e.data);
  try{return await pb.collection(e.col).update(e.id,body)}catch(err){if(err.status!==404)throw err}
  try{return await pb.collection(e.col).create({id:e.id,...body})}
  catch(err){if(err.status===400)return await pb.collection(e.col).update(e.id,body);throw err}} // creato nel frattempo dall'altro telefono
let flushing=false;
async function flush(){
  if(flushing||!pb.authStore.token)return;flushing=true;
  try{while(outbox.length){const e=outbox[0],snap=JSON.stringify(e.data);
    try{if(e.del)await pb.collection(e.col).delete(e.id).catch(err=>{if(err.status!==404)throw err});else await upsert(e);netOk=true}
    catch(err){
      if(!err.status){netOk=false;break}                     // niente rete: riprovo più tardi
      if(err.status===401||err.status===403){showLogin();break}
      console.warn("Modifica scartata dal server",e,err)}     // dato non valido: non blocco la coda
    if(outbox[0]===e&&JSON.stringify(e.data)===snap)outbox.shift(); // se è cambiato mentre lo inviavo, lo rimando
    try{localStorage.setItem(OUTBOX,JSON.stringify(outbox))}catch(e){}}}
  finally{flushing=false;renderSync()}
}
// record del server → stato locale
function applyRec(col,r,del){
  if(col==="plan"){if(del)delete S.plan[r.date];else S.plan[r.date]={pranzo:r.pranzo??null,cena:r.cena??null,kinds:r.kinds||{},people:r.people||{}}}
  else if(col==="shopping"){if(r.week==="lista")S.shop=del?SHOP0():{checks:r.checks||{},have:r.have||{},extra:r.extra||[],done:r.done||{}}} // i vecchi record per settimana non servono più
  else if(col==="settings"){if(!del){for(const f of ["ranges","times","schedule","people"])if(r[f])S[f]=r[f];if("country" in r)S.country=r.country||""}}
  else if(col==="photos"){if(del||!r.image){delete S.photos[r.recipe];delete S.credits[r.recipe]}else{S.photos[r.recipe]=pb.files.getURL(r,r.image);if(r.credit)S.credits[r.recipe]=r.credit;else delete S.credits[r.recipe]}}
  else if(col==="recipes"){if(del)delete S.recipes[r.id];else S.recipes[r.id]={name:r.name,ingredients:r.ingredients||[],steps:r.steps||[],links:r.links||[],meals:r.meals||MEALS,types:r.types||[],vis:r.vis,draft:r.draft,archived:r.archived}}
  else if(col==="ingredients"){if(del)delete S.ingr[r.id];else S.ingr[r.id]={name:r.name,cats:r.cats||[],c:r.c,p:r.p,f:r.f,fib:r.fib,unit_g:r.unit_g}}
  else if(col==="categories"){if(del)delete S.cats[r.id];else S.cats[r.id]={name:r.name,color:r.color,order:r.order,goal:r.goal}}
  else if(col==="types"){if(del)delete S.types[r.id];else S.types[r.id]={name:r.name,order:r.order}}
}
// le modifiche locali non ancora inviate hanno la precedenza su quello che arriva dal server
function applyPending(){for(const {col,id,data,del} of outbox){
  if(del){if(col==="ingredients")delete S.ingr[id];else if(col==="recipes")delete S.recipes[id];else if(col==="categories")delete S.cats[id];else if(col==="types")delete S.types[id]}
  else if(col==="plan"){const p=S.plan[data.date]=S.plan[data.date]||{pranzo:null,cena:null};for(const m of ["pranzo","cena","kinds","people"])if(m in data)p[m]=data[m]}
  else if(col==="shopping"){for(const f of ["checks","have","extra","done"])if(f in data)S.shop[f]=data[f]}
  else if(col==="settings")Object.assign(S,data);
  else if(col==="recipes")S.recipes[id]=Object.assign(S.recipes[id]||{},data);
  else if(col==="ingredients")S.ingr[id]=Object.assign(S.ingr[id]||{},data);
  else if(col==="categories")S.cats[id]=Object.assign(S.cats[id]||{},data);
  else if(col==="types")S.types[id]=Object.assign(S.types[id]||{},data)}
  rebuildRecipes()}
async function pull(){
  const lists=await Promise.all(COLS.map(c=>pb.collection(c).getFullList({batch:1000})));
  S.plan={};S.shop=SHOP0();S.photos={};S.credits={};S.recipes={};S.ingr={};S.cats={};S.types={};
  COLS.forEach((c,i)=>lists[i].forEach(r=>applyRec(c,r)));
  applyPending();save();netOk=true;
}
async function sync(){if(!pb.authStore.token)return;try{await flush();await pull();renderAll()}catch(e){if(!e.status)netOk=false;else if(e.status===401||e.status===403)showLogin()}renderSync()}
async function connect(){
  for(const c of COLS)await pb.collection(c).subscribe("*",e=>{applyRec(c,e.record,e.action==="delete");applyPending();save();renderAll()});
  // a ogni (ri)connessione recupero quello che mi sono perso
  await pb.realtime.subscribe("PB_CONNECT",()=>{netOk=true;sync()});
  pb.realtime.onDisconnect=subs=>{if(subs.length){netOk=false;renderSync()}};
}
function renderSync(){const el=document.getElementById("sync");if(!el)return;const n=outbox.length;
  el.hidden=netOk;el.textContent=`Offline${n?` · ${n} ${n===1?"modifica":"modifiche"} da inviare`:" · dati salvati sul telefono"}`}
let offset=0,tab="week",recFilter=null;

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const weekStart=()=>addDays(thisMonday,offset*7);
const weekKeys=()=>Array.from({length:7},(_,i)=>key(addDays(weekStart(),i)));
const slot=(k,m)=>(S.plan[k]||{})[m]||null;
// un pasto è l'id di una ricetta oppure {o:"nota"} se è fuori casa
const rid=v=>typeof v==="string"&&byId[v]?byId[v].id:null; // id attuale (anche dai vecchi id), null se la ricetta non esiste
const outNote=v=>v&&typeof v==="object"?(v.o||""):null;
// v = id del tipo, null = qualsiasi, undefined = torna alla settimana tipo
function setKind(k,m,v){const p=S.plan[k]=S.plan[k]||{pranzo:null,cena:null};const o={...(p.kinds||{})};
  if(v===undefined)delete o[m];else o[m]=v;p.kinds=o;save();queue("plan",ID.plan(k),{date:k,kinds:o})}
const kindOpts=sel=>`<option value="">Qualsiasi</option>${TYP.map(t=>`<option value="${t.id}"${t.id===sel?" selected":""}>${esc(t.name)}</option>`).join("")}`;
// persone di un pasto [adulti, bambini]: quelle scelte per quel pasto, altrimenti quelle di casa
const peopleOf=(k,m)=>{const v=((S.plan[k]||{}).people||{})[m];return Array.isArray(v)?v:[S.people.a,S.people.b]};
function setPeople(k,m,pp){const p=S.plan[k]=S.plan[k]||{pranzo:null,cena:null};p.people={...(p.people||{}),[m]:pp};save();queue("plan",ID.plan(k),{date:k,people:p.people})}
// una ricetta scelta si ricorda le sue persone (pp, o quelle già proposte per il pasto)
function setSlot(k,m,id,pp){const p=S.plan[k]=S.plan[k]||{pranzo:null,cena:null};p[m]=id;const data={date:k,[m]:id};
  if(typeof id==="string"){p.people={...(p.people||{}),[m]:pp||peopleOf(k,m)};data.people=p.people}
  save();queue("plan",ID.plan(k),data)}
// − adulti + − bambini +: data-pp="a|b", data-d="±1"
const pplStepHtml=([a,b])=>`<div class="ppl">${[["a","Adulti",a],["b","Bambini",b]].map(([w,l,n])=>`<span class="pplf"><span>${l}</span><span class="qstep"><button data-pp="${w}" data-d="-1" aria-label="${l}: uno in meno" ${n<=0||a+b<=1?"disabled":""}>−</button><span class="qv">${n}</span><button data-pp="${w}" data-d="1" aria-label="${l}: uno in più" ${n>=20?"disabled":""}>+</button></span></span>`).join("")}</div>`;
const pplStep=(pp,b)=>{const x=[...pp],i=b.dataset.pp==="a"?0:1;x[i]=Math.max(0,Math.min(20,x[i]+ +b.dataset.d));return x[0]+x[1]?x:pp};
const tagHtml=id=>{const c=catById[id];return c?`<span class="tag k${(c.color||0)%NCOL}">${esc(c.name)}</span>`:""};
const tagsHtml=ids=>ids.map(tagHtml).join("");
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1900)}

/* ---------- Obiettivi (per categoria) ---------- */
// un pasto conta una volta per ognuna delle sue categorie
function counts(){const c=Object.fromEntries(CAT.map(x=>[x.id,0]));weekKeys().forEach(k=>["pranzo","cena"].forEach(m=>{const id=rid(slot(k,m));if(id)for(const x of byId[id].k)c[x]++}));return c}
function status(cat,c){const g=cat.goal,n=c[cat.id]||0;
  if(g.min&&n<g.min)return{cls:"warn",txt:`manca ${g.min-n}`,need:g.min-n};
  if(g.max!=null&&n>g.max)return{cls:"warn",txt:`+${n-g.max} di troppo`,over:n-g.max};
  if(g.min||g.max!=null)return{cls:"ok",txt:"✓"};
  return{cls:"",txt:"libero"}}
const goalLbl=g=>g.min&&g.max!=null?`${g.min}–${g.max}`:g.min?`≥${g.min}`:g.max!=null?`≤${g.max}`:"";
// bilanciamento della settimana: un'icona accanto alla data; il resoconto per categoria si apre toccandola
const BAL_ICO={ok:`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12.5 4 4 8-9"/></svg>`,
  warn:`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M12 5v9"/><circle cx="12" cy="19" r=".6" fill="currentColor"/></svg>`,
  none:`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v8M5.5 3v5a2.5 2.5 0 0 0 5 0V3M8 11v10M17 3c-2 0-3 3-3 7h3v11"/></svg>`};
function weekBal(){const c=counts(),issues=CAT.map(cat=>({cat,...status(cat,c)})).filter(s=>s.cls==="warn");
  const any=weekKeys().some(k=>["pranzo","cena"].some(m=>rid(slot(k,m))));
  return{c,issues,st:!any?"none":issues.length?"warn":"ok"}}
const issueTxt=s=>`${s.cat.name}: ${s.need?`manca${s.need>1?"no":""} ${s.need}`:`+${s.over} di troppo`}`;
function renderGoals(){const {issues,st}=weekBal(),b=$("#wbal");
  b.className="wbal "+st;b.innerHTML=BAL_ICO[st];
  b.setAttribute("aria-label",st==="ok"?"Settimana bilanciata":st==="warn"?`Settimana da sistemare: ${issues.map(issueTxt).join(", ")}`:"Settimana vuota");
  b.title=b.getAttribute("aria-label");
}
const goalsHtml=c=>CAT.length?`<div class="goals">${CAT.map(cat=>{const g=cat.goal,st=status(cat,c);
  return `<span class="goal ${st.cls}"><span class="gname">${esc(cat.name)}</span><span class="gnum">${c[cat.id]||0}${goalLbl(g)?`<span> / ${goalLbl(g)}</span>`:""}</span><span class="gstate">${st.txt}</span></span>`}).join("")}</div>`
  :`<p class="shopnote">Nessuna categoria: creale da «Modifica obiettivi» e assegnale agli ingredienti.</p>`;
function openWeekBal(){const {c,issues,st}=weekBal(),a=weekStart(),b=addDays(a,6);
  openSheet(`Obiettivi della settimana<small>${weekName(offset)} · ${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}</small>`,
    `<div class="verdict ${st==="ok"?"ok":"warn"}"><b>${st==="ok"?"Settimana bilanciata":st==="warn"?"Da sistemare":"Settimana vuota"}</b><span>${st==="ok"?"Tutti gli obiettivi sono rispettati.":st==="warn"?esc(issues.map(issueTxt).join(" · ")):"Nessun pasto ancora: prova «✦ Riempi»."}</span></div>
     <p style="margin:12px 0 8px;color:var(--muted);font-size:13.5px">Quante volte in settimana, tra pranzi e cene, per categoria.</p>${goalsHtml(c)}
     <div class="row" style="margin-top:14px"><button class="btn ghost" data-goals>Modifica obiettivi</button></div>`);
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-goals]"))openGoals(openWeekBal)};
}
$("#wbal").addEventListener("click",openWeekBal);
// obiettivi e categorie: creare, rinominare, cambiare colore, eliminare
function openGoals(back){
  if(typeof back!=="function")back=null;
  const self=()=>openGoals(back);
  const draw=()=>{$("#sheetBody").innerHTML=`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Le categorie si assegnano agli ingredienti e una ricetta ha quelle dei suoi ingredienti. Per ognuna puoi fissare quante volte a settimana, tra pranzi e cene. Tocca il nome per rinominarla o eliminarla.</p>
    ${CAT.length?`<div class="grows">${CAT.map(cat=>{const g=cat.goal;
    return `<div class="grow"><div class="gtop"><button class="catbtn" data-cat="${cat.id}" aria-label="Modifica ${esc(cat.name)}">${tagHtml(cat.id)}<span>✎</span></button><span style="color:var(--muted);font-size:13px">${goalLbl(g)?goalLbl(g)+" a settimana":"nessun vincolo"}</span></div>
    <div class="gctl"><div class="stepper"><label>Almeno</label><div><button data-c="${cat.id}" data-f="min" data-d="-1" aria-label="Meno">−</button><output>${g.min||"—"}</output><button data-c="${cat.id}" data-f="min" data-d="1" aria-label="Più">+</button></div></div>
    <div class="stepper"><label>Al massimo</label><div><button data-c="${cat.id}" data-f="max" data-d="-1" aria-label="Meno">−</button><output>${g.max==null?"—":g.max}</output><button data-c="${cat.id}" data-f="max" data-d="1" aria-label="Più">+</button></div></div></div></div>`}).join("")}</div>`
    :`<p class="empty-note" style="padding:20px 10px">Nessuna categoria.</p>`}
    <div class="row" style="margin-top:12px"><button class="btn ghost" data-newcat>＋ Nuova categoria</button>${back?`<button class="btn" data-back>Torna al resoconto</button>`:""}</div>`};
  openSheet("Obiettivi settimanali","");draw();
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-back]")){back();return}
    if(e.target.closest("[data-newcat]")){openCat(null,self);return}
    const cb=e.target.closest("[data-cat]");if(cb){openCat(cb.dataset.cat,self);return}
    const b=e.target.closest("[data-c]");if(!b)return;const id=b.dataset.c,g=normGoal(S.cats[id].goal),d=+b.dataset.d;
    if(b.dataset.f==="min"){g.min=Math.max(0,Math.min(14,(g.min||0)+d));if(g.max!=null&&g.max<g.min)g.max=g.min}
    else{ if(g.max==null){if(d<0)g.max=7}else{g.max+=d;if(g.max>7)g.max=null;else if(g.max<0)g.max=0} if(g.max!=null&&g.min>g.max)g.min=g.max}
    S.cats[id].goal=g;queue("categories",id,{goal:g});rebuildCats();save();draw();renderGoals();renderSettings()};
}
function openCat(id,back){
  const old=id?S.cats[id]:null,v={name:old?old.name:"",color:old?(old.color||0)%NCOL:CAT.length%NCOL};
  const users=old?Object.keys(S.ingr).filter(i=>(S.ingr[i].cats||[]).includes(id)).map(i=>S.ingr[i].name).sort((a,b)=>a.localeCompare(b,"it")):[];
  openSheet(old?`Categoria<small>${esc(old.name)}</small>`:"Nuova categoria",`<div class="editor">
    <label class="ef"><span>Nome</span><input class="txt" id="caName" value="${esc(v.name)}" placeholder="Es. Pesce" autocomplete="off"></label>
    <div class="ef"><span>Colore</span><div class="swatches">${Array.from({length:NCOL},(_,i)=>`<button class="swatch k${i}" data-col="${i}" aria-pressed="${i===v.color}" aria-label="Colore ${i+1}"></button>`).join("")}</div></div>
    ${old?`<div class="ef"><span>${users.length?`Ingredienti con questa categoria (${users.length})`:"Nessun ingrediente ha questa categoria"}</span>${users.length?`<p class="shopnote" style="margin:0">${esc(users.join(", "))}</p>`:""}</div>`:""}
    <p class="hint" id="caErr" hidden></p>
    <div class="row"><button class="btn" data-save>Salva</button><button class="btn ghost" data-cancel>Annulla</button>${old?`<button class="btn ghost" data-delete>Elimina</button>`:""}</div>
    <div id="delBox"></div></div>`);
  if(!old)setTimeout(()=>($("#caName")||{focus(){}}).focus(),260);
  const body=$("#sheetBody"),fail=msg=>{const el=$("#caErr");el.textContent=msg;el.hidden=false};
  body.oninput=e=>{if(e.target.id==="caName")v.name=e.target.value};
  body.onclick=e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.col){v.color=+b.dataset.col;body.querySelectorAll("[data-col]").forEach(x=>x.setAttribute("aria-pressed",x===b))}
    else if("cancel" in b.dataset)back();
    else if("delete" in b.dataset){$("#delBox").innerHTML=`<div class="confirm"><p>Eliminare la categoria <b>${esc(old.name)}</b>?${users.length?` Verrà tolta da ${users.length===1?"un ingrediente":users.length+" ingredienti"}.`:""} Il suo obiettivo sparisce.</p>
      <div class="row"><button class="btn danger" data-confirm>Elimina</button><button class="btn ghost" data-nodel>Annulla</button></div></div>`;$("#delBox").scrollIntoView({block:"nearest",behavior:"smooth"})}
    else if("nodel" in b.dataset)$("#delBox").innerHTML="";
    else if("confirm" in b.dataset){
      for(const i in S.ingr){const cs=S.ingr[i].cats||[];if(cs.includes(id)){const cats=cs.filter(x=>x!==id);S.ingr[i].cats=cats;queue("ingredients",i,{cats})}}
      delete S.cats[id];queue("categories",id,null,true);if(recFilter===id)recFilter=null;if(ingFilter===id)ingFilter=null;
      rebuildRecipes();save();renderAll();toast("Categoria eliminata");back()}
    else if("save" in b.dataset){
      const name=v.name.trim().replace(/\s+/g," ");if(!name)return fail("Manca il nome della categoria.");
      const dup=CAT.find(c=>c.id!==id&&c.name.toLowerCase()===name.toLowerCase());if(dup)return fail(`C'è già la categoria «${dup.name}».`);
      const nid=id||randId(),data=old?{name,color:v.color}:{name,color:v.color,order:Math.max(-1,...CAT.map(c=>c.order||0))+1,goal:{min:0,max:null}};
      S.cats[nid]=Object.assign(S.cats[nid]||{},data);queue("categories",nid,data);
      rebuildRecipes();save();renderAll();toast(old?"Categoria salvata":"Categoria aggiunta");back()}};
}

/* ---------- Header ---------- */
function renderHeader(){
  const a=weekStart(),b=addDays(a,6);
  const range=a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`:`${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
  const name=offset===0?"Questa settimana":offset===1?"Prossima settimana":offset===-1?"Settimana scorsa":(offset>0?`Tra ${offset} settimane`:`${-offset} settimane fa`);
  $("#weeklbl").innerHTML=`<small>${name}</small>${range}`;
  $("#title").textContent={week:"Settimana",shop:"Lista della spesa",rec:recMode==="ing"?"Ingredienti":"Ricette",set:"Impostazioni"}[tab];
  $("#weeknav").hidden=tab!=="week"; // la spesa non è per settimana
  $("#topRow").hidden=tab==="week";
  $("#autoBtn").hidden=tab!=="week";
  $("#wbal").hidden=tab!=="week";
}

/* ---------- Orari: quando un pasto è passato ---------- */
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const toMin=t=>{const[h,m]=t.split(":").map(Number);return h*60+m};
function isPast(k,m){const tk=key(new Date());if(k<tk)return true;if(k>tk)return false;return m?nowMin()>=toMin(S.times[m]):false}
function dayPast(k){return k<key(new Date())}
function openTimes(){
  openSheet("Orari dei pasti",`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Dopo quest'ora il pasto di oggi viene mostrato in grigio, come i giorni già passati.</p>
   <div class="trow"><span><b>Pranzo</b> passato dalle</span><input type="time" id="t-pranzo" value="${S.times.pranzo}"></div>
   <div class="trow"><span><b>Cena</b> passata dalle</span><input type="time" id="t-cena" value="${S.times.cena}"></div>`);
  $("#sheetBody").onchange=e=>{const id=e.target.id;if(!id||!e.target.value)return;S.times[id.slice(2)]=e.target.value;save();queueSettings("times");renderWeek();renderSettings()};
}
/* ---------- Tipi e settimana tipo ---------- */
function openPeople(){
  const P=S.people,draw=()=>{$("#sheetBody").innerHTML=`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Le ricette hanno le quantità per una persona adulta. Quando scegli un pasto dici per quante persone: si parte da queste.</p>
    ${pplStepHtml([P.a,P.b])}
    <h3 class="shh">Quanto mangia un bambino</h3>
    <div class="ppl"><span class="pplf"><span>Rispetto a un adulto</span><span class="qstep"><button data-kid="-5" aria-label="Meno" ${P.kid<=10?"disabled":""}>−</button><span class="qv">${P.kid}%</span><button data-kid="5" aria-label="Di più" ${P.kid>=100?"disabled":""}>+</button></span></span></div>
    <p class="shopnote">Es. con ${P.kid}%: 100 g di pasta a persona diventano ${Math.round(100*pplFactor([2,1]))} g per 2 adulti e 1 bambino.</p>`};
  openSheet("Persone e porzioni","");draw();
  $("#sheetBody").onclick=e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.pp){[P.a,P.b]=pplStep([P.a,P.b],b)}else if(b.dataset.kid)P.kid=Math.max(10,Math.min(100,P.kid+ +b.dataset.kid));else return;
    save();queueSettings("people");draw();renderAll()};
}
// paesi in cui il server sa filtrare Open Food Facts (vedi LANG in pb_hooks/off.pb.js)
const COUNTRIES=[["en:spain","Spagna"],["en:italy","Italia"],["en:france","Francia"],["en:portugal","Portogallo"],["en:germany","Germania"],["en:switzerland","Svizzera"],["en:united-kingdom","Regno Unito"]];
function openCountry(){
  const draw=()=>{$("#sheetBody").innerHTML=`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Cercando i valori di un ingrediente, i prodotti di Open Food Facts venduti in questo paese vengono per primi. Scrivi pure in italiano: «ceci» trova i garbanzos in Spagna.</p>
    <div class="choice">${[...COUNTRIES,["","Tutti i paesi"]].map(([id,n])=>`<button data-country="${id}" aria-pressed="${(S.country||"")===id}"><b>${n}</b></button>`).join("")}</div>`};
  openSheet("Paese della spesa","");draw();
  $("#sheetBody").onclick=e=>{const b=e.target.closest("[data-country]");if(!b)return;S.country=b.dataset.country;save();queueSettings("country");draw();renderSettings()};
}
function openTypes(){
  const draw=()=>{$("#sheetBody").innerHTML=`<h3 class="shh" style="margin-top:0">Tipi</h3>
    <p style="margin:0 0 8px;color:var(--muted);font-size:13.5px">Ogni ricetta ha uno o più tipi; ogni pasto della settimana ne ha uno e «Riempi» usa solo ricette di quel tipo. Tocca un tipo per rinominarlo o eliminarlo.</p>
    <div class="ichips">${TYP.map(t=>`<button class="chip tchip" data-typ="${t.id}">${esc(t.name)} ✎</button>`).join("")}<button class="chip tchip" data-newtyp>＋ Nuovo tipo</button></div>
    <h3 class="shh">Settimana tipo</h3>
    <p style="margin:0 0 8px;color:var(--muted);font-size:13.5px">Il tipo di ogni pasto, da lunedì a domenica. Una singola settimana si cambia dal menu «✦ Riempi».</p>${kindGridHtml(false)}`};
  openSheet("Pasti e tipi","");draw();
  $("#sheetBody").onchange=e=>{const t=e.target;if(!t.dataset.m)return;const sc={pranzo:[...(S.schedule||DEF_SCHED).pranzo],cena:[...(S.schedule||DEF_SCHED).cena]};
    sc[t.dataset.m][+t.dataset.day]=t.value||null;S.schedule=sc;save();queueSettings("schedule");renderWeek()};
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-newtyp]")){openType(null);return}const b=e.target.closest("[data-typ]");if(b)openType(b.dataset.typ)};
}
function openType(id){
  const old=id?S.types[id]:null,v={name:old?old.name:""},back=openTypes;
  const used=old?R.filter(r=>r.ty.includes(id)):[];
  openSheet(old?`Tipo<small>${esc(old.name)}</small>`:"Nuovo tipo",`<div class="editor">
    <label class="ef"><span>Nome</span><input class="txt" id="tyName" value="${esc(v.name)}" placeholder="Es. Veloce" autocomplete="off"></label>
    ${old?`<p class="shopnote" style="margin:0">${used.length?`${used.length} ${used.length===1?"ricetta":"ricette"} di questo tipo.`:"Nessuna ricetta di questo tipo."}</p>`:""}
    <p class="hint" id="tyErr" hidden></p>
    <div class="row"><button class="btn" data-save>Salva</button><button class="btn ghost" data-cancel>Annulla</button>${old?`<button class="btn ghost" data-delete>Elimina</button>`:""}</div>
    <div id="delBox"></div></div>`);
  if(!old)setTimeout(()=>($("#tyName")||{focus(){}}).focus(),260);
  const body=$("#sheetBody"),fail=msg=>{const el=$("#tyErr");el.textContent=msg;el.hidden=false};
  body.oninput=e=>{if(e.target.id==="tyName")v.name=e.target.value};
  body.onclick=e=>{const b=e.target.closest("button");if(!b)return;
    if("cancel" in b.dataset)back();
    else if("delete" in b.dataset){$("#delBox").innerHTML=`<div class="confirm"><p>Eliminare il tipo <b>${esc(old.name)}</b>?${used.length?` Verrà tolto da ${used.length===1?"una ricetta":used.length+" ricette"}.`:""} I pasti della settimana tipo che lo usavano diventano «qualsiasi».</p>
      <div class="row"><button class="btn danger" data-confirm>Elimina</button><button class="btn ghost" data-nodel>Annulla</button></div></div>`;$("#delBox").scrollIntoView({block:"nearest",behavior:"smooth"})}
    else if("nodel" in b.dataset)$("#delBox").innerHTML="";
    else if("confirm" in b.dataset){
      for(const x in S.recipes){const ts=S.recipes[x].types||[];if(ts.includes(id)){const types=ts.filter(t=>t!==id);S.recipes[x].types=types;queue("recipes",x,{types})}}
      const sc=S.schedule||DEF_SCHED;if(MEALS.some(m=>sc[m].includes(id))){S.schedule=Object.fromEntries(MEALS.map(m=>[m,sc[m].map(x=>x===id?null:x)]));queueSettings("schedule")}
      delete S.types[id];queue("types",id,null,true);rebuildRecipes();save();renderAll();toast("Tipo eliminato");back()}
    else if("save" in b.dataset){
      const name=v.name.trim().replace(/\s+/g," ");if(!name)return fail("Manca il nome del tipo.");
      const dup=TYP.find(t=>t.id!==id&&t.name.toLowerCase()===name.toLowerCase());if(dup)return fail(`C'è già il tipo «${dup.name}».`);
      const nid=id||randId(),data=old?{name}:{name,order:Math.max(-1,...TYP.map(t=>t.order||0))+1};
      S.types[nid]=Object.assign(S.types[nid]||{},data);queue("types",nid,data);rebuildRecipes();save();renderAll();toast(old?"Tipo salvato":"Tipo aggiunto");back()}};
}
/* ---------- Impostazioni ---------- */
function renderSettings(){
  const r=S.ranges;
  const gs=CAT.map(c=>{const l=goalLbl(c.goal);return l?`${c.name} ${l}`:null}).filter(Boolean).join(" · ")||(CAT.length?"Nessun vincolo":"Nessuna categoria");
  $("#setList").innerHTML=`
   <button class="setitem" data-s="goals"><span><b>Obiettivi settimanali e categorie</b><small>${esc(gs)}</small></span></button>
   <button class="setitem" data-s="ranges"><span><b>Pasto bilanciato</b><small>Carboidrati ${r.c[0]}–${r.c[1]}% · Proteine ${r.p[0]}–${r.p[1]}% · Grassi ${r.f[0]}–${r.f[1]}% · Fibre ≥${r.fib} g</small></span></button>
   <button class="setitem" data-s="types"><span><b>Pasti e tipi</b><small>${TYP.length?"Tipi: "+esc(TYP.map(t=>t.name).join(", "))+" · settimana tipo":"Nessun tipo"}</small></span></button>
   <button class="setitem" data-s="people"><span><b>Persone e porzioni</b><small>Di solito ${esc(pplLbl([S.people.a,S.people.b]))} · un bambino mangia il ${S.people.kid}% di un adulto</small></span></button>
   <button class="setitem" data-s="country"><span><b>Paese della spesa</b><small>${S.country?`Valori dei prodotti: prima quelli venduti in ${esc((COUNTRIES.find(c=>c[0]===S.country)||["",S.country])[1])}`:"Valori dei prodotti: tutti i paesi"}</small></span></button>
   <button class="setitem" data-s="times"><span><b>Orari dei pasti</b><small>Il pranzo passa alle ${S.times.pranzo}, la cena alle ${S.times.cena}</small></span></button>
   <button class="setitem" data-s="account"><span><b>Account</b><small>${esc(pb.authStore.record?.email||"")}</small></span></button>`;
}
$("#setList").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;({goals:openGoals,ranges:()=>openRanges(),types:openTypes,people:openPeople,country:openCountry,times:openTimes,account:openAccount})[b.dataset.s]()});
$("#closeSheet").addEventListener("click",()=>renderSettings());$("#scrim").addEventListener("click",()=>renderSettings());
function scrollToToday(smooth){
  const el=document.querySelector(".day.is-today");
  if(!el||tab!=="week"){window.scrollTo(0,0);return}
  const top=el.getBoundingClientRect().top+window.scrollY-$("header").getBoundingClientRect().bottom-10;
  window.scrollTo({top:Math.max(0,top),behavior:smooth?"smooth":"auto"});
}

/* ---------- Settimana ---------- */
function outPh(note){return `<div class="ph out"><svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><rect width="160" height="100" fill="#c8372d"/><rect width="160" height="100" fill="url(#og)"/><defs><linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2553f"/><stop offset="1" stop-color="#9f2420"/></linearGradient></defs>
  <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><circle cx="80" cy="50" r="27"/><path d="M61 31 L99 69"/></g>
  <g fill="#fff"><rect x="70" y="36" width="3" height="28" rx="1.5"/><path d="M66 36v9a5 5 0 0 0 10 0v-9h-2v8h-1.5v-8h-1.5v8h-1.5v-8z"/><path d="M87 36c4 0 5 6 5 12h-3v16h-3V36z"/></g></svg><span class="tag t-out">Fuori casa</span></div>`}
// le persone si mostrano solo se sono diverse da quelle di casa
const pplOdd=(k,m)=>{const [a,b]=peopleOf(k,m);return a!==S.people.a||b!==S.people.b};
function renderWeek(){
  renderGoals();
  const tk=key(new Date());
  $("#days").innerHTML=weekKeys().map((k,i)=>{const d=addDays(weekStart(),i),isT=k===tk;
    return `<div class="day${isT?" is-today":""}${dayPast(k)?" past":""}">
      <div class="dayhead"><span class="dname">${DAYS[i]}</span><span class="ddate">${d.getDate()} ${MONTHS[d.getMonth()]}</span>${isT?'<span class="badge">Oggi</span>':""}</div>
      <div class="slots">${["pranzo","cena"].map(m=>{const v=slot(k,m),o=outNote(v),r=rid(v)&&byId[rid(v)],past=isT&&isPast(k,m)?" past":"";
        const t=kindOf(k,m),ml=`<span class="meal">${m}${t?` · <span class="kind${kindChanged(k,m)?" changed":""}">${esc(tname(t))}</span>`:""}</span>`;
        if(o!==null)return `<button class="slot${past}" data-k="${k}" data-m="${m}">${ml}${outPh()}<span class="rname">${esc(o||"Pasto fuori casa")}</span></button>`;
        return r?`<button class="slot${past}" data-k="${k}" data-m="${m}">${ml}<div class="ph">${S.photos[r.id]?`<img src="${S.photos[r.id]}" alt="">`:dishSvg(r)}${r.k.length?`<span class="tags">${tagsHtml(r.k.slice(0,2))}</span>`:""}</div><span class="rname">${esc(r.n)}</span>${pplOdd(k,m)?`<span class="pplnote">${esc(pplLbl(peopleOf(k,m)))}</span>`:""}${m==="pranzo"&&shared(r,prevDinner(k)).length?`<span class="link">${LINK_ICO}con la cena di ieri</span>`:""}</button>`
                :`<button class="slot empty${past}" data-k="${k}" data-m="${m}">${ml}<div class="ph">+ Scegli</div></button>`}).join("")}</div></div>`}).join("");
}
// l'app installata può restare aperta per giorni: se è cambiato il giorno torno alla settimana di oggi
function checkDay(){const t=new Date();if(key(t)===key(today))return false;today=t;thisMonday=mondayOf(t);offset=0;renderAll();scrollToToday();return true}
setInterval(()=>{if(!checkDay()&&!$("#sheet").classList.contains("open"))renderWeek()},60000);
$("#days").addEventListener("click",e=>{const b=e.target.closest(".slot");if(!b)return;const{k,m}=b.dataset;const v=slot(k,m);
  if(outNote(v)!==null)openOut(k,m);else if(rid(v))openDetail(k,m);else openPicker(k,m)});

/* ---------- Riempimento automatico che rispetta gli obiettivi ---------- */
/* Cerco la combinazione di ricette che costa meno, partendo da scelte a caso e cambiando un pasto alla volta.
   Costi, dal più pesante: obiettivi non rispettati (minimi e massimi), stessa categoria a pranzo e a cena dello
   stesso giorno (contando anche i pasti scelti a mano), stessa ricetta ripetuta; un piccolo premio se il pranzo
   condivide ingredienti con la cena della sera prima, e un costo leggero sulle categorie già molto presenti (varietà). */
function autofill(all){
  const keys=weekKeys();
  // "rifai tutto" tiene i pasti fuori casa
  if(all)keys.forEach(k=>["pranzo","cena"].forEach(m=>{if(outNote(slot(k,m))===null&&slot(k,m))setSlot(k,m,null)}));
  const free=[];keys.forEach(k=>["pranzo","cena"].forEach(m=>{if(!slot(k,m))free.push(k+"|"+m)}));
  if(!free.length){toast("La settimana è già piena");return}
  // per ogni pasto solo le ricette adatte (pranzo/cena e tipo); se non ce ne sono resta vuoto
  const candOf=sl=>{const [k,m]=sl.split("|");return R.filter(r=>fits(r,k,m))};
  const cands=free.map(candOf),empty=free.filter((_,i)=>cands[i].length),cand=cands.filter(c=>c.length),skipped=free.length-empty.length;
  if(!empty.length){toast("Nessuna ricetta adatta a questi pasti");return}
  const pos=Object.fromEntries(empty.map((s,i)=>[s,i]));
  const prevKey=k=>key(addDays(new Date(k+"T12:00"),-1));
  const at=(a,k,m)=>{const i=pos[k+"|"+m];if(i!==undefined)return a[i];const id=rid(slot(k,m));return id?byId[id]:null};
  const fixed=[];keys.forEach(k=>["pranzo","cena"].forEach(m=>{const id=pos[k+"|"+m]===undefined&&rid(slot(k,m));if(id)fixed.push(byId[id])}));
  const lk={},link=(a,b)=>{const x=a.id+b.id;return x in lk?lk[x]:(lk[x]=Math.min(3,shared(a,b).length))};
  const cost=a=>{let s=0;const c={},used={};
    for(const r of fixed.concat(a)){used[r.id]=(used[r.id]||0)+1;for(const id of r.k)c[id]=(c[id]||0)+1}
    for(const cat of CAT){const n=c[cat.id]||0,g=cat.goal;if(n<g.min)s+=100*(g.min-n);if(g.max!=null&&n>g.max)s+=100*(n-g.max);s+=n*n*.3}
    for(const id in used)if(used[id]>1)s+=20*(used[id]-1);
    for(const k of keys){const p=at(a,k,"pranzo"),d=at(a,k,"cena");if(p&&d)s+=30*p.k.filter(x=>d.k.includes(x)).length;
      const ieri=at(a,prevKey(k),"cena");if(p&&ieri)s-=3*link(p,ieri)}
    return s};
  const pick=i=>cand[i][Math.floor(Math.random()*cand[i].length)];
  let best=null,bestC=Infinity;
  for(let t=0;t<6;t++){const a=empty.map((_,i)=>pick(i));let c=cost(a);
    for(let it=0;it<1500;it++){const i=Math.floor(Math.random()*a.length),old=a[i];a[i]=pick(i);const c2=cost(a);if(c2<=c)c=c2;else a[i]=old}
    if(c<bestC){best=a;bestC=c}}
  empty.forEach((s,i)=>{const [k,m]=s.split("|");setSlot(k,m,best[i].id)});
  save();renderAll();toast(`Aggiunti ${empty.length} pasti${skipped?` · ${skipped} senza ricette adatte`:""}`);
}
function weekName(o){return o===0?"Questa settimana":o===1?"Prossima settimana":o===-1?"Settimana scorsa":(o>0?`Tra ${o} settimane`:`${-o} settimane fa`)}
function cloneWeek(fromOff){
  const src=addDays(thisMonday,fromOff*7);let n=0;
  weekKeys().forEach((k,i)=>{const sk=key(addDays(src,i));["pranzo","cena"].forEach(m=>{
    if(outNote(slot(k,m))!==null)return; // i pasti fuori casa di questa settimana restano
    const id=rid((S.plan[sk]||{})[m]);if(id){setSlot(k,m,id,peopleOf(sk,m));n++}else if(slot(k,m))setSlot(k,m,null)})});
  save();renderAll();toast(`Copiati ${n} pasti`);
}
$("#autoBtn").addEventListener("click",()=>{
  // settimane passate (rispetto a quella visualizzata) con almeno una ricetta
  const past=[];
  for(let o=offset-1;o>=offset-8;o--){const st=addDays(thisMonday,o*7);const ids=[];
    for(let i=0;i<7;i++){const p=S.plan[key(addDays(st,i))]||{};["pranzo","cena"].forEach(m=>{const id=rid(p[m]);if(id)ids.push(id)})}
    if(ids.length)past.push({o,st,ids})}
  const fmtR=st=>{const b=addDays(st,6);return st.getMonth()===b.getMonth()?`${st.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`:`${st.getDate()} ${MONTHS[st.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`};
  openSheet("Riempi la settimana",`<h3 class="shh">A caso, rispettando gli obiettivi</h3><div class="choice">
    <button data-a="empty"><b>Riempi solo gli spazi vuoti</b><span>Tiene i pasti che hai già scelto.</span></button>
    <button data-a="all"><b>Rifai tutta la settimana</b><span>Nuova combinazione. I pasti fuori casa restano.</span></button></div>
    <h3 class="shh">Copia una settimana passata</h3>
    ${past.length?`<div class="choice">${past.map(p=>`<button data-clone="${p.o}"><b>${weekName(p.o)} · ${fmtR(p.st)}</b><span>${p.ids.length} pasti: ${esc([...new Set(p.ids)].slice(0,3).map(id=>byId[id].n).join(", "))}${new Set(p.ids).size>3?"…":""}</span></button>`).join("")}</div>`
      :`<p style="color:var(--muted);font-size:13.5px;margin:0">Nessuna settimana passata da copiare.</p>`}
    <h3 class="shh">Altro</h3><div class="choice"><button data-a="kinds"><b>Tipi di questa settimana</b><span>Es. un festivo infrasettimanale: cambia il tipo dei pasti solo per questa settimana.</span></button><button data-a="clear"><b>Svuota la settimana</b><span>Toglie tutti i pasti, anche quelli fuori casa.</span></button></div>`);
  $("#sheetBody").onclick=e=>{const cl=e.target.closest("[data-clone]");if(cl){closeSheet();cloneWeek(+cl.dataset.clone);return}
    const b=e.target.closest("[data-a]");if(!b)return;if(b.dataset.a==="kinds"){openWeekKinds();return}closeSheet();
    if(b.dataset.a==="clear"){weekKeys().forEach(k=>["pranzo","cena"].forEach(m=>{if(slot(k,m))setSlot(k,m,null)}));renderAll();toast("Settimana svuotata")}
    else autofill(b.dataset.a==="all")};
});

/* griglia giorni × pasti con il tipo di ognuno; week = questa settimana (cambi solo per i suoi giorni) o settimana tipo */
function kindGridHtml(week){return `<div class="kgrid"><span></span><b>Pranzo</b><b>Cena</b>${(week?weekKeys():DAYS).map((k,i)=>`<span>${DAYS[i]}${week?` <small>${addDays(weekStart(),i).getDate()}</small>`:""}</span>`+
  MEALS.map(m=>{const v=week?kindOf(k,m):((S.schedule||DEF_SCHED)[m]||[])[i];return `<select class="txt${week&&kindChanged(k,m)?" changed":""}" data-day="${i}" data-m="${m}" aria-label="${DAYS[i]} ${m}">${kindOpts(typById[v]?v:null)}</select>`}).join("")).join("")}</div>`}
function openWeekKinds(){
  const draw=()=>{const ch=weekKeys().some(k=>MEALS.some(m=>kindChanged(k,m)));
    $("#sheetBody").innerHTML=`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Vale solo per questa settimana; le altre seguono la settimana tipo (Impostazioni → Pasti e tipi). In evidenza i pasti cambiati.</p>${kindGridHtml(true)}
     <div class="row" style="margin-top:12px"><button class="btn" data-done>Fatto</button>${ch?`<button class="btn ghost" data-reset>Torna alla settimana tipo</button>`:""}</div>`};
  const a=weekStart(),b=addDays(a,6);
  openSheet(`Tipi di questa settimana<small>${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}</small>`,"");draw();
  $("#sheetBody").onchange=e=>{const t=e.target;if(!t.dataset.m)return;const k=weekKeys()[+t.dataset.day],m=t.dataset.m,v=t.value||null;
    setKind(k,m,v===schedOf(k,m)?undefined:v);draw();renderWeek()};
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-done]"))closeSheet();
    else if(e.target.closest("[data-reset]")){weekKeys().forEach(k=>MEALS.forEach(m=>{if(kindChanged(k,m))setKind(k,m,undefined)}));draw();renderWeek()}};
}

/* ---------- Foglio in basso ---------- */
function openSheet(title,html){$("#sheetTitle").innerHTML=title;$("#sheetBody").innerHTML=html;$("#sheetBody").onclick=null;$("#sheetBody").onchange=null;$("#sheetBody").oninput=null;$("#sheet").classList.add("open");$("#scrim").classList.add("open");$("#sheetBody").scrollTop=0}
function closeSheet(){$("#sheet").classList.remove("open");$("#scrim").classList.remove("open")}
$("#scrim").onclick=closeSheet;$("#closeSheet").onclick=closeSheet;
const slotLabel=(k,m)=>{const d=new Date(k+"T12:00");return `${DAYS[(d.getDay()+6)%7]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${m}`};
function filtersHtml(active,all){return [null,...CAT.map(c=>c.id)].map(t=>`<button data-f="${t||""}" aria-pressed="${(t||null)===active}">${t?esc(cname(t)):(all||"Tutte")}</button>`).join("")}
const cname=id=>catById[id]?catById[id].name:"";
function cardHtml(r,cur,showBal,extra){const ok=r.dr||!checkBalance(nutrition(r)).length;return `<button class="rcard${cur?" current":""}${r.dr?" draft":""}" data-id="${r.id}">${photoHtml(r)}<span class="rinfo"><span class="rname">${esc(r.n)}</span><span class="row" style="gap:6px">${tagsHtml(r.k)}</span><span class="meta">${esc(recMeta(r))}</span>${extra||""}</span>${showBal&&!ok?`<span class="warnico" title="Da rivedere" aria-label="Da rivedere"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20z" fill="currentColor"/><path d="M12 9v5" stroke="var(--surface)" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.4" fill="var(--surface)"/></svg></span>`:""}</button>`}

function openPicker(k,m,f){
  const cur=rid(slot(k,m)),c=counts();
  if(cur)for(const x of byId[cur].k)c[x]--; // il pasto che sto sostituendo non conta
  const miss=CAT.filter(x=>x.goal.min&&(c[x.id]||0)<x.goal.min),missId=new Set(miss.map(x=>x.id));
  // ricette che condividono ingredienti con la cena di ieri (per il pranzo) o col pranzo di domani (per la cena)
  const nextLunch=()=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),1))]||{}).pranzo;return typeof v==="string"?byId[v]:null};
  const partner=m==="pranzo"?prevDinner(k):nextLunch(),pl=m==="pranzo"?"la cena di ieri":"il pranzo di domani";
  const sh=Object.fromEntries(R.map(r=>[r.id,shared(r,partner)]));
  const needs=r=>r.k.some(x=>missId.has(x));
  const list=R.filter(r=>!f||r.k.includes(f)).sort((a,b)=>needs(b)-needs(a)||sh[b.id].length-sh[a.id].length);
  const ok=list.filter(r=>fits(r,k,m)),other=list.filter(r=>!fits(r,k,m)),t=kindOf(k,m);
  const card=r=>cardHtml(r,r.id===cur,false,sh[r.id].length?`<span class="link">${LINK_ICO}${esc(sh[r.id].slice(0,3).join(", ").toLowerCase())} come ${pl}</span>`:"");
  openSheet(`Scegli la ricetta<small>${slotLabel(k,m)}</small>`,
    `<button class="rcard outcard" data-out>${outPh()}<span class="rinfo"><span class="rname">Pasto fuori casa</span><span class="meta">Ristorante, da amici, salto il pasto… non conta per obiettivi e spesa</span></span></button>`+
    (miss.length&&!f?`<div class="hint">Questa settimana manca ancora: ${esc(miss.map(x=>`${x.name.toLowerCase()} (${x.goal.min-(c[x.id]||0)})`).join(", "))}</div>`:"")+
    `<div class="kpick"><span>Per quante persone</span></div>${pplStepHtml(peopleOf(k,m))}`+
    `<label class="kpick"><span>Tipo di questo pasto</span><select class="txt${kindChanged(k,m)?" changed":""}" data-kind>${kindOpts(t)}</select></label>`+
    `<div class="filters">${filtersHtml(f||null)}</div><div class="pick">${ok.map(card).join("")||`<p class="shopnote">Nessuna ricetta ${m==="pranzo"?"da pranzo":"da cena"}${t?` di tipo ${esc(tname(t).toLowerCase())}`:""}${f?" in questa categoria":""}.</p>`}</div>`+
    (other.length?`<h3 class="shh">Non adatte a questo pasto</h3><div class="pick other">${other.map(card).join("")}</div>`:""));
  $("#sheetBody").onchange=e=>{if(!e.target.dataset||!("kind" in e.target.dataset))return;const v=e.target.value||null;setKind(k,m,v===schedOf(k,m)?undefined:v);renderWeek();openPicker(k,m,f)};
  $("#sheetBody").onclick=e=>{
    if(e.target.closest("[data-out]")){openOut(k,m);return}
    const ps=e.target.closest("[data-pp]");if(ps){const st=$("#sheetBody").scrollTop;setPeople(k,m,pplStep(peopleOf(k,m),ps));renderAll();openPicker(k,m,f);$("#sheetBody").scrollTop=st;return}
    const fb=e.target.closest("[data-f]");if(fb){openPicker(k,m,fb.dataset.f||null);return}
    const b=e.target.closest("[data-id]");if(!b)return;setSlot(k,m,b.dataset.id);closeSheet();renderAll();
  };
}
const OUT_SUGG=["Cena da amici","Ristorante","Pizza","Pranzo al lavoro","Salto il pasto"];
function openOut(k,m){
  const cur=outNote(slot(k,m)),isNew=cur===null;
  openSheet(`Pasto fuori casa<small>${slotLabel(k,m)}</small>`,`${outPh()}
    <label for="outNote" style="display:block;font-weight:600;margin:12px 0 6px">Nota</label>
    <input id="outNote" class="txt" type="text" maxlength="40" placeholder="Es. Cena da Daniele" value="${esc(cur||"")}">
    <div class="filters" style="margin-top:8px">${OUT_SUGG.map(s=>`<button data-sugg="${esc(s)}">${esc(s)}</button>`).join("")}</div>
    <div class="row" style="margin-top:8px"><button class="btn" data-save>Salva</button>${isNew?"":`<button class="btn ghost" data-recipe>Scegli una ricetta</button><button class="btn ghost" data-remove>Togli</button>`}</div>`);
  const inp=$("#outNote");if(isNew)setTimeout(()=>inp.focus(),260);
  const doSave=()=>{setSlot(k,m,{o:inp.value.trim()});closeSheet();renderAll();toast("Pasto fuori casa salvato")};
  inp.onkeydown=e=>{if(e.key==="Enter")doSave()};
  $("#sheetBody").onclick=e=>{const sg=e.target.closest("[data-sugg]");if(sg){inp.value=sg.dataset.sugg;inp.focus();return}
    if(e.target.closest("[data-save]"))doSave();
    else if(e.target.closest("[data-recipe]"))openPicker(k,m);
    else if(e.target.closest("[data-remove]")){setSlot(k,m,null);closeSheet();renderAll();toast("Pasto tolto")}};
}
function fmtQty(q,u){const n=Math.round(q*10)/10;if(u==="g"&&n>=1000)return(n/1000).toString().replace(".",",")+" kg";return `${String(n).replace(".",",")} ${u}`}
// quantità per più persone, da cucinare: grammi interi, pezzi e cucchiai al mezzo
const scaleQty=(q,u,x)=>(u==="g"||u==="ml")?Math.round(q*x):Math.max(.5,Math.round(q*x*2)/2);
// pp = persone del pasto (dalla settimana): quantità per loro, con − + per cambiarle; senza pp quantità per una persona
function recipeHtml(r,pp){const x=pp?pplFactor(pp):1;return photoHtml(r,"hero")+(S.credits[r.id]?`<p class="credit">Foto: ${esc(S.credits[r.id])}</p>`:"")+
  `<div class="row photobtns"><button class="btn ghost" data-wphoto>🔍 Cerca foto</button><label class="btn ghost filebtn">${S.photos[r.id]?"Cambia foto":"Carica foto"}<input type="file" accept="image/*" data-photo="${r.id}"></label></div>
  <div class="row" style="margin-bottom:4px">${tagsHtml(r.k)}</div>
  <p class="rmeta">${esc(recMeta(r))}</p>
  ${r.dr?"":nutHtml(nutrition(r))}
  ${pp?`<h3 class="shh">Ingredienti <small>per ${esc(pplLbl(pp))}</small></h3>${pplStepHtml(pp)}`:`<h3 class="shh">Ingredienti <small>per una persona</small></h3>`}
  <ul class="ing">${r.i.map(i=>`<li><span>${esc(i[0])}</span><span>${!(i[1]>0)?"—":fmtQty(pp?scaleQty(i[1],i[2],x):i[1],i[2])}</span></li>`).join("")}</ul>
  ${r.l.length?`<h3 class="shh">Link</h3><div class="rlinks">${r.l.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(x.title||siteOf(x.url))}</b><small>${esc(x.title?siteOf(x.url):x.url.replace(/^https?:\/\//,"").slice(0,60))}</small></a>`).join("")}</div>`:""}
  ${r.s.length?`<h3 class="shh">Procedimento</h3>`:""}<ol class="steps">${r.s.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`}
// link della ricetta: una riga = un link; il testo prima dell'indirizzo è il titolo. Si può incollare anche tutto il testo
// che Instagram copia condividendo un post: prendo l'indirizzo. Senza http si aggiunge (es. "giallozafferano.it/…").
const siteOf=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return u}};
function parseLinks(text){return text.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{
  let m=/https?:\/\/[^\s<>"]+/i.exec(l)||/(?:^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s<>"]*|(?:[a-z0-9-]+\.)+(?:com|it|es|org|net|tv)\b[^\s<>"]*)/i.exec(l);
  if(!m)return null;const raw=m[1]||m[0],url=/^https?:/i.test(raw)?raw:"https://"+raw;
  try{new URL(url)}catch(e){return null}
  const title=l.replace(raw,"").replace(/[\s:·\-–|]+$/,"").replace(/^[\s:·\-–|]+/,"").trim().slice(0,80);
  return{url:url.replace(/[).,;]+$/,""),title}}).filter(Boolean)}
// foto della ricetta: ritagliata al centro a 960×600 e caricata; credit = autore · licenza · fonte per le foto dalla rete
function crop(blob){return new Promise((ok,ko)=>{const u=URL.createObjectURL(blob),img=new Image();
  img.onload=()=>{URL.revokeObjectURL(u);const W=960,H=600,cv=document.createElement("canvas");cv.width=W;cv.height=H;const sc=Math.max(W/img.width,H/img.height);
    cv.getContext("2d").drawImage(img,(W-img.width*sc)/2,(H-img.height*sc)/2,img.width*sc,img.height*sc);cv.toBlob(b=>b?ok(b):ko(new Error("foto")),"image/jpeg",0.8)};
  img.onerror=()=>{URL.revokeObjectURL(u);ko(new Error("foto"))};img.src=u})}
async function savePhoto(id,blob,credit){toast("Carico la foto…");
  try{const rec=await uploadPhoto(id,await crop(blob),credit);S.photos[id]=pb.files.getURL(rec,rec.image);if(credit)S.credits[id]=credit;else delete S.credits[id];save();renderAll();toast("Foto salvata");return true}
  catch(err){toast(err.status?"Foto non salvata":err.message==="foto"?"Questa foto non si apre":"Serve la connessione per caricare la foto");return false}}
function bindPhoto(after){$("#sheetBody").onchange=async e=>{const inp=e.target.closest("[data-photo]");if(!inp||!inp.files[0])return;if(await savePhoto(inp.dataset.photo,inp.files[0],""))after()}}
// come l'icona dei gruppi di WhatsApp: foto dalla rete cercate col nome della ricetta (Wikimedia Commons, tramite il nostro server)
function openPhotoSearch(id,back){const r=byId[id];let q=r.n,res=[];
  openSheet(`Cerca foto<small>${esc(r.n)}</small>`,`<form class="xadd" id="wsForm"><input class="txt" id="wsQ" type="search" value="${esc(q)}" aria-label="Cerca foto" autocomplete="off"><button class="btn">Cerca</button></form>
    <div id="wsRes"></div><div class="row" style="margin-top:12px"><button class="btn ghost" data-back>Indietro</button></div>`);
  const box=$("#wsRes");
  const run=async()=>{q=$("#wsQ").value.trim();if(!q)return;box.innerHTML=`<p class="offmsg">Cerco «${esc(q)}»…</p>`;
    try{res=(await pb.send("/api/cucinario/img/search",{query:{q}})).images||[]}
    catch(err){if(box.isConnected)box.innerHTML=`<p class="offmsg warn">${navigator.onLine?"La ricerca delle foto non risponde: riprova tra poco.":"Serve la connessione a internet."}</p>`;return}
    if(!box.isConnected)return;
    box.innerHTML=res.length?`<p class="offmsg">Tocca una foto per usarla. Vengono da Wikimedia Commons, con licenza libera: sotto la foto resta il nome dell'autore.</p><div class="wgrid">${res.map((x,i)=>`<button data-wi="${i}" title="${esc(x.title)}"><img src="${esc(x.thumb)}" alt="${esc(x.title)}" loading="lazy" onerror="this.parentNode.hidden=true"></button>`).join("")}</div>`
      :`<p class="offmsg warn">Nessuna foto per «${esc(q)}». Prova con meno parole (es. solo il piatto principale).</p>`};
  $("#wsForm").onsubmit=e=>{e.preventDefault();run()};
  $("#sheetBody").onclick=async e=>{if(e.target.closest("[data-back]")){back();return}
    const b=e.target.closest("[data-wi]");if(!b||b.disabled)return;const x=res[+b.dataset.wi];
    box.querySelectorAll("[data-wi]").forEach(y=>y.disabled=true);b.classList.add("loading");toast("Scarico la foto…");
    let blob=null,credit="";try{const rs=await fetch(`/api/cucinario/img/file?t=${encodeURIComponent(x.id)}`,{headers:{Authorization:pb.authStore.token}});if(rs.ok){blob=await rs.blob();credit=decodeURIComponent(rs.headers.get("X-Credit")||"")}}catch(err){}
    if(!blob){toast(navigator.onLine?"Questa foto non si scarica: provane un'altra":"Serve la connessione a internet");box.querySelectorAll("[data-wi]").forEach(y=>y.disabled=false);b.classList.remove("loading");return}
    if(await savePhoto(id,blob,credit||"Wikimedia Commons"))back();else{box.querySelectorAll("[data-wi]").forEach(y=>y.disabled=false);b.classList.remove("loading")}};
  run()}
async function uploadPhoto(recipe,blob,credit){const fd=new FormData();fd.append("recipe",recipe);fd.append("image",blob,recipe+".jpg");fd.append("credit",credit||"");
  // le foto caricate prima che le ricette fossero nel database hanno un id diverso da ID.photos: cerco per ricetta
  let cur=null;try{cur=await pb.collection("photos").getFirstListItem(pb.filter("recipe={:r}",{r:recipe}))}catch(err){if(err.status!==404)throw err}
  if(cur)return await pb.collection("photos").update(cur.id,fd);
  fd.append("id",ID.photos(recipe));return await pb.collection("photos").create(fd)}
function openDetail(k,m){
  const r=byId[rid(slot(k,m))];
  const nl=(()=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),1))]||{}).pranzo;return typeof v==="string"?byId[v]:null})();
  const p=m==="pranzo"?prevDinner(k):nl,sh=shared(r,p);
  const linkBox=sh.length?`<div class="linkbox">${LINK_ICO}<span>Si prepara insieme ${m==="pranzo"?"alla cena di ieri":"al pranzo di domani"}, <b>${esc(p.n)}</b>: in comune ${esc(sh.join(", ").toLowerCase())}.</span></div>`:"";
  openSheet(`${esc(r.n)}<small>${slotLabel(k,m)}</small>`,linkBox+recipeHtml(r,peopleOf(k,m))+`<div class="row"><button class="btn" data-a="change">Cambia ricetta</button><button class="btn ghost" data-a="out">Fuori casa</button><button class="btn ghost" data-a="remove">Togli</button><button class="btn ghost" data-a="edit">Modifica ricetta</button></div>`);
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-ranges]")){openRanges(()=>openDetail(k,m));return}
    if(e.target.closest("[data-wphoto]")){openPhotoSearch(r.id,()=>openDetail(k,m));return}
    const ps=e.target.closest("[data-pp]");if(ps){const st=$("#sheetBody").scrollTop;setPeople(k,m,pplStep(peopleOf(k,m),ps));renderAll();openDetail(k,m);$("#sheetBody").scrollTop=st;return}
    const b=e.target.closest("[data-a]");if(!b)return;
    if(b.dataset.a==="change")openPicker(k,m);else if(b.dataset.a==="out")openOut(k,m);else if(b.dataset.a==="edit")openEditor(r.id,()=>openDetail(k,m));
    else{setSlot(k,m,null);closeSheet();renderAll();toast("Pasto tolto")}};
  bindPhoto(()=>openDetail(k,m));
}
// cosa manca a una ricetta in costruzione per poterla salvare come ricetta vera
function draftMissing(r){const m=[];
  if(!r.i.length)m.push("ingredienti");else{if(r.i.some(x=>!(x[1]>0)))m.push("quantità");if(r.i.some(x=>!ING[x[0]]))m.push("valori di "+r.i.filter(x=>!ING[x[0]]).map(x=>x[0].toLowerCase()).slice(0,3).join(", "))}
  if(TYP.length&&!r.ty.length)m.push("tipo");
  return m.length?"manca: "+m.join(", "):"pronta da completare"}
function openRecipe(id){const r=byId[id];
  openSheet(esc(r.n),(r.archived?`<p class="hint">Ricetta eliminata: resta solo nei pasti già pianificati. Salvandola dall'editor torna tra le ricette.</p>`:"")+
    (r.dr&&!r.archived?`<p class="hint">In costruzione · ${esc(draftMissing(r))}. Completala per usarla nella settimana.</p>`:"")+recipeHtml(r)+
    `<div class="row"><button class="btn" data-edit>${r.dr?"Completa":"Modifica"}</button>${r.archived?"":`<button class="btn ghost" data-delete>Elimina</button>`}</div><div id="delBox"></div>`);
  bindPhoto(()=>openRecipe(id));
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-ranges]")){openRanges(()=>openRecipe(id));return}
    if(e.target.closest("[data-wphoto]")){openPhotoSearch(id,()=>openRecipe(id));return}
    if(e.target.closest("[data-edit]")){openEditor(id,()=>openRecipe(id));return}
    if(e.target.closest("[data-delete]")){$("#delBox").innerHTML=`<div class="confirm"><p>Eliminare <b>${esc(r.n)}</b>? Non comparirà più tra le ricette né nel riempimento automatico; i pasti già pianificati la mostrano ancora.</p>
      <div class="row"><button class="btn danger" data-confirm>Elimina</button><button class="btn ghost" data-nodel>Annulla</button></div></div>`;$("#delBox").scrollIntoView({block:"nearest",behavior:"smooth"});return}
    if(e.target.closest("[data-nodel]")){$("#delBox").innerHTML="";return}
    if(e.target.closest("[data-confirm]")){S.recipes[id].archived=true;queue("recipes",id,{archived:true});rebuildRecipes();save();closeSheet();renderAll();toast("Ricetta eliminata")}}}

/* ---------- Open Food Facts: valori per 100 g dal nome o dal codice a barre ----------
   Database libero (licenza ODbL), tramite il nostro server. I valori sono quelli delle etichette UE:
   i carboidrati non comprendono le fibre, come nel nostro catalogo. Serve la rete; si possono sempre scrivere a mano. */
const OFF_F="code,product_name,product_name_it,brands,nutriments";
const n100=(n,k)=>{const x=n[k+"_100g"];return x==null||x===""||isNaN(+x)?null:Math.round(+x*10)/10};
function offItem(p){const n=(p&&p.nutriments)||{},c=n100(n,"carbohydrates"),pr=n100(n,"proteins"),f=n100(n,"fat");
  if(c==null||pr==null||f==null||c+pr+f===0)return null; // senza valori o tutti a zero: dato incompleto
  return{grp:p.grp||0,name:String(p.name||p.product_name_it||p.product_name_es||p.product_name||"").trim()||"Senza nome",brand:String((Array.isArray(p.brands)?p.brands[0]:String(p.brands||"").split(",")[0])||"").trim(),c,p:pr,f,fib:n100(n,"fiber")}}
// le chiamate passano dal nostro server (pb_hooks/off.pb.js): il motore di ricerca di OFF non accetta chiamate dal browser.
// Col paese impostato il server dà prima i prodotti della categoria venduti lì (grp 0), poi quelli venduti lì che hanno
// quelle parole (1), poi gli altri (2). Dentro ogni gruppo: nome uguale alla ricerca, che inizia così, che la contiene,
// gli altri; a parità i nomi più brevi (più vicini al prodotto semplice) e poi l'ordine di Open Food Facts.
async function offSearch(q){const d=await pb.send("/api/cucinario/off/search",{query:{q,country:S.country||""}});
  const k=fold(q),rank=x=>{const n=fold(x.name);return n===k?0:n.startsWith(k)?1:n.includes(k)?2:3};
  const res=(d.products||[]).map(offItem).filter(Boolean).map((x,i)=>({x,i,r:rank(x),w:x.name.split(/\s+/).length})).sort((a,b)=>a.x.grp-b.x.grp||a.r-b.r||a.w-b.w||a.i-b.i).slice(0,8).map(o=>o.x);
  res.category=d.category;return res}
/* Tabella CIQUAL (Anses, Licence Ouverte): circa 300 alimenti generici crudi e cotti, con i nomi in italiano
   (ciqual.json, letto al primo uso e poi in cache: funziona anche senza rete). Per verdura, carne e pesce freschi
   Open Food Facts ha poco: lì ci sono soprattutto prodotti confezionati. */
const fold=s=>String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]+/g," ").trim().replace(/\s+/g," ");
const stem=w=>w.length>3?w.replace(/[aeio]$/,""):w; // zucchina, zucchine → zucchin
let CIQ=null;
async function ciqSearch(q){
  if(!CIQ){const d=await (await fetch("ciqual.json")).json();CIQ=d.alimenti.map(([n,c,p,f,fib,unit_g])=>({name:n,c,p,f,fib,unit_g,ciq:true,w:fold(n).split(" ").map(stem)}))}
  const qw=fold(q).split(" ").filter(Boolean).map(stem);if(!qw.length)return[];
  // tutte le parole cercate devono essere all'inizio di una parola del nome; prima chi comincia con la prima parola
  return CIQ.filter(x=>qw.every(w=>x.w.some(y=>y.startsWith(w)))).map(x=>({x,r:x.w[0].startsWith(qw[0])?0:1}))
    .sort((a,b)=>a.r-b.r||a.x.name.length-b.x.name.length).slice(0,6).map(o=>o.x)}
async function offBarcode(code){try{return offItem((await pb.send("/api/cucinario/off/product/"+encodeURIComponent(code),{})).product)}catch(err){if(err.status===404||err.status===400)return null;throw err}}
// codice a barre da una foto: BarcodeDetector dove c'è (Chrome su Android), altrimenti ZXing (vendor/zxing.min.js, caricato al primo uso)
async function readBarcode(file){
  const img=await new Promise((ok,ko)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);ok(im)};im.onerror=ko;im.src=u});
  const sc=Math.min(1,1600/Math.max(img.width,img.height)),cv=document.createElement("canvas");
  cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
  if("BarcodeDetector" in window){try{const r=await new BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e"]}).detect(cv);if(r[0])return r[0].rawValue}catch(e){}}
  if(!window.ZXing)await new Promise((ok,ko)=>{const sc=document.createElement("script");sc.src="vendor/zxing.min.js";sc.onload=ok;sc.onerror=ko;document.head.appendChild(sc)});
  const Z=window.ZXing,hints=new Map();hints.set(Z.DecodeHintType.TRY_HARDER,true);
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS,[Z.BarcodeFormat.EAN_13,Z.BarcodeFormat.EAN_8,Z.BarcodeFormat.UPC_A,Z.BarcodeFormat.UPC_E]);
  try{return(await new Z.BrowserMultiFormatReader(hints).decodeFromImageUrl(cv.toDataURL("image/jpeg",.9))).getText()}catch(e){return null}}
// box = riquadro dei risultati dentro i campi dell'ingrediente; t = {v: valori da riempire, after: da chiamare dopo}
async function offFind(box,t,mode,arg){
  arg=String(arg||"").trim();
  if(!arg){box.innerHTML=`<p class="offmsg">Scrivi prima il nome dell'ingrediente.</p>`;return}
  const row=(x,i)=>`<button type="button" data-offpick="${i}"><b>${esc(x.name)}</b>${x.brand&&x.brand!==x.name?` <small>${esc(x.brand)}</small>`:""}<span>carb ${num(x.c)} · prot ${num(x.p)} · grassi ${num(x.f)} · fibre ${x.fib==null?"—":num(x.fib)}</span></button>`;
  if(mode==="code"){box.innerHTML=`<p class="offmsg">Cerco il codice ${esc(arg)}…</p>`;let x;
    try{x=await offBarcode(arg)}catch(err){if(box.isConnected)box.innerHTML=`<p class="offmsg warn">${navigator.onLine&&err.status?"Open Food Facts non risponde: riprova tra poco.":"Serve la connessione a internet."}</p>`;return}
    if(!box.isConnected)return;
    if(x){box._res=[x];return offApply(box,t,x)} // il codice a barre è già il prodotto giusto
    box.innerHTML=`<p class="offmsg warn">Il codice ${esc(arg)} non è in Open Food Facts (o non ha i valori): scrivili a mano.</p>`;return}
  // prima gli alimenti generici della tabella (subito, anche offline), poi i prodotti di Open Food Facts
  let gen=[];try{gen=await ciqSearch(arg)}catch(err){}
  const where=S.country?COUNTRIES.find(c=>c[0]===S.country):null;
  const draw=(off,msg)=>{if(!box.isConnected)return;box._res=[...gen,...(off||[])];
    box.innerHTML=(gen.length||(off&&off.length)?`<p class="offmsg">Tocca l'alimento più simile per usare i suoi valori (per 100 g):</p>`:"")+
      (gen.length?`<h4 class="offh">Alimenti generici <small>tabella CIQUAL</small></h4><div class="offlist">${gen.map(row).join("")}</div>`:"")+
      (off&&off.length?`<h4 class="offh">Prodotti <small>Open Food Facts${where?` · ${esc(where[1].toLowerCase())}`:""}${off.category?` · ${esc(off.category.toLowerCase())}`:""}</small></h4><div class="offlist">${off.map((x,i)=>row(x,gen.length+i)).join("")}</div>`:"")+
      (msg?`<p class="offmsg${off===null?"":" warn"}">${msg}</p>`:"")};
  draw(null,`Cerco «${esc(arg)}» su Open Food Facts…`);
  let off;try{off=await offSearch(arg)}
  catch(err){return draw([],navigator.onLine&&err.status?"Open Food Facts non risponde: riprova tra poco.":"Per i prodotti di Open Food Facts serve la connessione.")}
  draw(off,gen.length||off.length?"":`Nessun alimento con i valori per «${esc(arg)}». Prova un nome più semplice o il codice a barre, oppure scrivili a mano.`)}
function offApply(box,t,x){Object.assign(t.v,{c:x.c,p:x.p,f:x.f,fib:x.fib??(+t.v.fib||0)});
  if(x.unit_g&&!(+t.v.unit_g))t.v.unit_g=x.unit_g; // peso tipico di un pezzo (uovo, spicchio…), solo se non c'è già
  box.closest(".evals").querySelectorAll("input[data-v]").forEach(inp=>{if(["c","p","f","fib","unit_g"].includes(inp.dataset.v))inp.value=t.v[inp.dataset.v]||""});
  box.innerHTML=`<p class="offmsg ok">✓ Valori ${x.ciq?"dalla tabella CIQUAL":"da Open Food Facts"}: ${esc(x.name)}${x.brand&&x.brand!==x.name?` (${esc(x.brand)})`:""}${x.fib==null?" · fibre non indicate, controllale":""}</p>`;
  if(t.after)t.after()}
// gestori comuni a catalogo ed editor; tgt(box) → {v, q: nome da cercare, after}
function offClick(e,tgt){const b=e.target.closest("[data-off],[data-offpick]");if(!b)return false;
  const box=b.closest(".evals").querySelector("[data-offres]"),t=tgt(box);
  if(b.dataset.offpick!=null){const x=(box._res||[])[+b.dataset.offpick];if(x)offApply(box,t,x)}
  else if(b.dataset.off==="search")offFind(box,t,"search",t.q);
  else if(b.dataset.off==="code")offFind(box,t,"code",((box.querySelector("[data-offcode]")||{}).value||"").replace(/\D/g,""));
  return true}
function offFile(e,tgt){const inp=e.target;if(!inp.matches||!inp.matches("[data-offscan]")||!inp.files[0])return false;
  const box=inp.closest(".evals").querySelector("[data-offres]"),t=tgt(box),file=inp.files[0];inp.value="";
  box.innerHTML=`<p class="offmsg">Leggo il codice a barre…</p>`;
  readBarcode(file).catch(()=>null).then(code=>{if(!box.isConnected)return;if(code)return offFind(box,t,"code",code);
    box.innerHTML=`<p class="offmsg warn">Non riesco a leggere il codice a barre: rifai la foto più vicina e dritta, oppure scrivi le cifre.</p>
      <div class="offcode"><input class="txt" data-offcode inputmode="numeric" placeholder="Es. 8001234567890" aria-label="Cifre del codice a barre"><button type="button" class="btn ghost" data-off="code">Cerca</button></div>`});
  return true}
// valori non ancora scelti né scritti (uno 0 scritto a mano conta: il sale non ha macronutrienti)
const offEmpty=v=>!v||["c","p","f"].every(k=>v[k]==null||v[k]==="");

/* ---------- Editor delle ricette ---------- */
const UNITS=["g","ml","pz","spicchio","mazzo","rametto","costa","cucchiaio","cucchiai","fette","busta"];
const NUTF=[["c","Carboidrati"],["p","Proteine"],["f","Grassi"],["fib","Fibre"]];
const num=x=>String(+x||0).replace(".",",");
const randId=()=>{const a="abcdefghijklmnopqrstuvwxyz0123456789";return Array.from(crypto.getRandomValues(new Uint8Array(15)),x=>a[x%36]).join("")};
// nome come sta nel catalogo (ignoro maiuscole e spazi doppi), così "cipolla" usa "Cipolla"
const canon=n=>{n=String(n).trim().replace(/\s+/g," ");const k=n.toLowerCase();return Object.keys(ING).find(x=>x.toLowerCase()===k)||n};
const INGF=["c","p","f","fib","unit_g"];
// categorie, valori per 100 g e peso di un'unità; a = attributi in più (es. la riga dell'editor)
function ingFieldsHtml(v,a){a=a||"";const has=new Set(v.cats||[]);
  const num=(k,l,ph,cls)=>`<label${cls?` class="${cls}"`:""}><span>${l}</span><input class="txt" type="number" inputmode="decimal" min="0" step="any" ${a} data-v="${k}" value="${v[k]||""}" placeholder="${ph||0}"></label>`;
  return `<div class="wide ichips"><span>Categorie</span><div>${CAT.length?CAT.map(c=>`<button type="button" class="chip k${(c.color||0)%NCOL}" ${a} data-icat="${c.id}" aria-pressed="${has.has(c.id)}">${esc(c.name)}</button>`).join("")
    :`<small>Nessuna categoria: si creano da Impostazioni → Obiettivi settimanali.</small>`}</div></div>
    <div class="wide offbar"><button type="button" class="btn ghost" ${a} data-off="search">🔍 Cerca i valori</button><label class="btn ghost filebtn">▦ Codice a barre<input type="file" accept="image/*" capture="environment" ${a} data-offscan></label></div>
    <div class="wide offres" ${a} data-offres></div>
    ${NUTF.map(([k,l])=>num(k,l+" (g)")).join("")}${num("unit_g","Peso di 1 unità in grammi (pz, mazzo, spicchio…)","—","wide")}`}
const ingData=(name,v)=>({name,cats:CAT.filter(c=>(v.cats||[]).includes(c.id)).map(c=>c.id),c:+v.c||0,p:+v.p||0,f:+v.f||0,fib:+v.fib||0,unit_g:+v.unit_g||0});
const sameIng=(a,b)=>a&&b&&a.name===b.name&&JSON.stringify(ingCats(a))===JSON.stringify(b.cats)&&INGF.every(k=>(a[k]||0)===(b[k]||0));
const toggleCat=(v,id)=>{const s=new Set(v.cats||[]);s.has(id)?s.delete(id):s.add(id);v.cats=[...s]};
// id deterministico dal nome; se è già preso (ingrediente rinominato) ne uso uno casuale
const newIngId=n=>{const id=ID.ingredients(n);return S.ingr[id]?randId():id};
// tutte le ricette che usano l'ingrediente, anche quelle eliminate; activeUses solo quelle attive (catalogo, eliminazione)
const activeUses=n=>usesOf(n).filter(r=>!r.archived);
const usesOf=n=>Object.keys(S.recipes).filter(id=>(S.recipes[id].ingredients||[]).some(x=>x[0]===n)).map(id=>byId[id]);
function openEditor(id,back){
  const r=id?byId[id]:null;
  const d={n:r?r.n:"",s:r?r.s.join("\n"):"",l:r?r.l.map(x=>x.title?`${x.title} ${x.url}`:x.url).join("\n"):"",open:-1,meals:r?[...r.meals]:[...MEALS],ty:r?[...r.ty]:[],
    rows:r&&r.i.length?r.i.map(([n,q,u])=>({n,q:q>0?String(q):"",u})):[{n:"",q:"",u:"g"}],
    ing:{}}; // valori degli ingredienti nuovi o modificati qui, per nome; finiscono nel catalogo al salvataggio
  const vals=n=>d.ing[n]||ING[n]||null;
  const valid=()=>d.rows.filter(x=>x.n.trim()&&+x.q>0);
  const info=x=>{const n=canon(x.n);if(!n)return["",""];const v=vals(n);
    if(!v)return["warn","Nuovo ingrediente: tocca qui per i valori (si cercano da soli)"];
    if(!ING[n]&&offEmpty(v))return["warn","Nuovo ingrediente: scegli o scrivi i valori qui sotto"];
    if(!(x.u==="g"||x.u==="ml")&&!v.unit_g)return["warn",`Quanto pesa 1 ${x.u}? Tocca qui`];
    const cs=ingCats(v).map(cname).join(", ");
    return["",`${cs?cs+" · ":""}per 100 g: carb ${num(v.c)} · prot ${num(v.p)} · grassi ${num(v.f)} · fibre ${num(v.fib)}`]};
  const valsHtml=i=>{const n=canon(d.rows[i].n),v=d.ing[n];
    return `<div class="evals"><p>${ING[n]?`Valori di <b>${esc(n)}</b> nel catalogo: cambiano per tutte le ricette che lo usano.`:`<b>${esc(n)}</b> non è ancora nel catalogo. Valori per 100 g, come sull'etichetta.`}</p>
      ${ingFieldsHtml(v,`data-i="${i}"`)}</div>`};
  const rowHtml=(x,i)=>{const [cls,txt]=info(x);return `<div class="erow">
     <input class="txt" list="ingList" data-i="${i}" data-f="n" value="${esc(x.n)}" placeholder="Ingrediente" aria-label="Ingrediente" autocomplete="off">
     <input class="txt" type="number" inputmode="decimal" min="0" step="any" data-i="${i}" data-f="q" value="${esc(x.q)}" placeholder="Q.tà" aria-label="Quantità">
     <select class="txt" data-i="${i}" data-f="u" aria-label="Unità">${[...new Set([...UNITS,x.u])].map(u=>`<option${u===x.u?" selected":""}>${u}</option>`).join("")}</select>
     <button class="iconbtn" data-del="${i}" aria-label="Togli ingrediente">✕</button>
     <button class="einfo ${cls}" data-open="${i}" ${txt?"":"hidden"}>${esc(txt)}</button>
     ${d.open===i&&canon(x.n)?valsHtml(i):""}</div>`};
  const refresh=()=>{
    const rows=valid();
    const cats=recipeCats(rows.map(x=>[canon(x.n)]),vals);
    $("#edCat").innerHTML=cats.length?`<span class="row">${tagsHtml(cats)}</span>`
      :`<p class="catwarn">Nessun ingrediente ha una categoria: la ricetta non conterà per gli obiettivi. Per assegnarle, tocca la riga sotto un ingrediente.</p>`;
    $("#edNut").innerHTML=rows.length?nutHtml(nutrition({i:rows.map(x=>[canon(x.n),+x.q,x.u])},vals),true)
      :`<p class="shopnote">Aggiungi gli ingredienti con le quantità: qui vedrai se il pasto è bilanciato.</p>`;
    document.querySelectorAll("#sheetBody .einfo").forEach((b,i)=>{const [cls,txt]=info(d.rows[i]);b.className="einfo "+cls;b.textContent=txt;b.hidden=!txt})};
  const draw=()=>{
    $("#sheetBody").innerHTML=`<div class="editor">
      <label class="ef"><span>Nome</span><input class="txt" id="edName" value="${esc(d.n)}" placeholder="Es. Pasta e ceci" autocomplete="off"></label>
      <div class="ef"><span>Pasto <small>almeno uno</small></span><div class="ichips">${MEALS.map(m=>`<button type="button" class="chip k9" data-meal="${m}" aria-pressed="${d.meals.includes(m)}">${m==="pranzo"?"Pranzo":"Cena"}</button>`).join("")}</div></div>
      <div class="ef"><span>Tipo <small>almeno uno</small></span><div class="ichips">${TYP.map(t=>`<button type="button" class="chip k9" data-typ="${t.id}" aria-pressed="${d.ty.includes(t.id)}">${esc(t.name)}</button>`).join("")||`<small>Nessun tipo: si creano da Impostazioni → Pasti e tipi.</small>`}</div></div>
      <div class="ef"><span>Categorie <small>dagli ingredienti</small></span><div id="edCat"></div></div>
      <div class="ef"><span>Ingredienti <small>quantità per una persona adulta</small></span><div class="erows">${d.rows.map(rowHtml).join("")}</div>
        <button class="btn ghost" data-add>＋ Ingrediente</button></div>
      <div id="edNut"></div>
      <label class="ef"><span>Procedimento <small>un passaggio per riga</small></span><textarea class="txt" id="edSteps" rows="5">${esc(d.s)}</textarea></label>
      <label class="ef"><span>Link <small>uno per riga, es. il post di Instagram; il testo prima del link è il titolo</small></span><textarea class="txt" id="edLinks" rows="2" placeholder="Pasta e ceci di nonna https://www.instagram.com/p/…" autocomplete="off" autocapitalize="off">${esc(d.l)}</textarea></label>
      <p class="hint" id="edErr" hidden></p>
      <div class="row"><button class="btn" data-save>${r&&r.dr?"Salva ricetta":"Salva"}</button>${!r||r.dr?`<button class="btn ghost" data-draft>Salva come bozza</button>`:""}<button class="btn ghost" data-cancel>Annulla</button></div>
      <datalist id="ingList">${Object.keys(ING).sort((a,b)=>a.localeCompare(b,"it")).map(n=>`<option value="${esc(n)}">`).join("")}</datalist></div>`;
    refresh()};
  const fail=msg=>{const el=$("#edErr");el.textContent=msg;el.hidden=false;el.scrollIntoView({block:"center",behavior:"smooth"})};
  // draft = ricetta in costruzione: basta il nome; gli ingredienti senza valori restano solo nella ricetta (non nel catalogo)
  const doSave=draft=>{
    const name=d.n.trim(),rows=d.rows.filter(x=>draft?x.n.trim():x.n.trim()||x.q);
    if(!name)return fail(draft?"Dai almeno un nome alla ricetta.":"Manca il nome della ricetta.");
    if(!draft){
    if(!d.meals.length)return fail("Scegli se è da pranzo, da cena o entrambi.");
    if(TYP.length&&!d.ty.length)return fail("Scegli almeno un tipo.");
    if(!rows.length)return fail("Aggiungi almeno un ingrediente.");
    if(rows.some(x=>!x.n.trim()||!(+x.q>0)))return fail("Ogni ingrediente ha bisogno di nome e quantità.");
    const fresh=[...new Set(rows.map(x=>canon(x.n)))].filter(n=>!vals(n)||(!ING[n]&&offEmpty(vals(n))));
    if(fresh.length)return fail(`Inserisci i valori di: ${fresh.join(", ")} (tocca la riga arancione sotto l'ingrediente).`);}
    // catalogo: ingredienti nuovi o con valori cambiati
    for(const n of new Set(rows.map(x=>canon(x.n)))){const v=d.ing[n];if(!v||(!ING[n]&&offEmpty(v)))continue;const old=ING[n],data=ingData(n,v);
      if(sameIng(old,data))continue;
      const iid=old?old.id:newIngId(n);S.ingr[iid]=data;queue("ingredients",iid,data)}
    const nid=r?r.id:randId(),ingr=rows.map(x=>[canon(x.n),+x.q||0,x.u]);
    const data={name,meals:MEALS.filter(m=>d.meals.includes(m)),types:TYP.filter(t=>d.ty.includes(t.id)).map(t=>t.id),ingredients:ingr,steps:d.s.split("\n").map(x=>x.trim()).filter(Boolean),links:parseLinks(d.l),draft:!!draft,archived:false};
    S.recipes[nid]=Object.assign(S.recipes[nid]||{vis:null},data);queue("recipes",nid,data);
    rebuildRecipes();save();renderAll();toast(draft?"Salvata tra le ricette in costruzione":r&&r.dr?"Ricetta completata: ora si può usare nella settimana":r?"Ricetta salvata":"Ricetta aggiunta");openRecipe(nid)};
  openSheet(r?`Modifica ricetta<small>${esc(r.n)}</small>`:"Nuova ricetta","");draw();
  const body=$("#sheetBody");
  body.oninput=e=>{const t=e.target,i=+t.dataset.i;
    if(t.id==="edName")d.n=t.value;else if(t.id==="edSteps")d.s=t.value;else if(t.id==="edLinks")d.l=t.value;
    else if(t.dataset.f)d.rows[i][t.dataset.f]=t.value;
    else if(t.dataset.v){const n=canon(d.rows[i].n);d.ing[n][t.dataset.v]=t.value}
    refresh()};
  // valori da Open Food Facts per la riga aperta; per un ingrediente nuovo e ancora vuoto la ricerca parte da sola
  const tgt=box=>{const n=canon(d.rows[+box.dataset.i].n);return{v:d.ing[n],q:n,after:refresh}};
  const autoOff=i=>{const n=canon(d.rows[i].n),v=d.ing[n],box=body.querySelector(".evals [data-offres]");if(n&&!ING[n]&&v&&offEmpty(v)&&box)offFind(box,tgt(box),"search",n)};
  // finito di scrivere il nome: lo allineo al catalogo; se è un ingrediente nuovo apro subito i suoi valori
  body.onchange=e=>{if(offFile(e,tgt))return;const t=e.target;if(t.dataset.f!=="n")return;const i=+t.dataset.i;d.rows[i].n=canon(t.value);t.value=d.rows[i].n;
    const n=d.rows[i].n;if(n&&!ING[n]&&!d.ing[n])d.open=i;
    if(d.open===i){if(n&&!d.ing[n])d.ing[n]={...(ING[n]||{cats:[]})};draw();autoOff(i)}else refresh()};
  body.onclick=e=>{if(offClick(e,tgt))return;const b=e.target.closest("button");if(!b)return;
    if(b.dataset.meal||b.dataset.typ){const arr=b.dataset.meal?d.meals:d.ty,v=b.dataset.meal||b.dataset.typ,i=arr.indexOf(v);if(i<0)arr.push(v);else arr.splice(i,1);b.setAttribute("aria-pressed",i<0)}
    else if(b.dataset.icat){const n=canon(d.rows[+b.dataset.i].n);toggleCat(d.ing[n],b.dataset.icat);b.setAttribute("aria-pressed",d.ing[n].cats.includes(b.dataset.icat));refresh()}
    else if("add" in b.dataset){d.rows.push({n:"",q:"",u:"g"});draw();body.querySelector(`[data-i="${d.rows.length-1}"][data-f="n"]`).focus()}
    else if(b.dataset.del){const i=+b.dataset.del;d.rows.splice(i,1);if(!d.rows.length)d.rows.push({n:"",q:"",u:"g"});d.open=d.open===i?-1:d.open>i?d.open-1:d.open;draw()}
    else if(b.dataset.open){const i=+b.dataset.open,n=canon(d.rows[i].n);d.open=d.open===i?-1:i;if(d.open===i&&!d.ing[n])d.ing[n]={...(ING[n]||{cats:[]})};draw();if(d.open===i)autoOff(i)}
    else if("save" in b.dataset)doSave(false);
    else if("draft" in b.dataset)doSave(true);
    else if("cancel" in b.dataset){if(back)back();else closeSheet()}};
}

/* ---------- Catalogo degli ingredienti ---------- */
let ingQuery="",ingFilter=null;
function renderIng(){
  $("#ingFilters").innerHTML=filtersHtml(ingFilter,"Tutti");
  const q=ingQuery.trim().toLowerCase(),all=Object.keys(S.ingr).map(id=>({id,...S.ingr[id]}));
  const list=all.filter(x=>(!q||x.name.toLowerCase().includes(q))&&(!ingFilter||(x.cats||[]).includes(ingFilter))).sort((a,b)=>a.name.localeCompare(b.name,"it"));
  $("#ingCat").innerHTML=!all.length?`<p class="empty-note">Nessun ingrediente.<br>Aggiungilo con «Nuovo».</p>`:!list.length?`<p class="empty-note">Nessun ingrediente${q?` con «${esc(ingQuery.trim())}»`:""}${ingFilter?` nella categoria ${esc(cname(ingFilter).toLowerCase())}`:""}.</p>`:
    `<div class="items">${list.map(x=>{const n=activeUses(x.name).length;return `<button class="item" data-ing="${x.id}"><span class="iname"><b>${esc(x.name)}</b>
      <small>${n?`in ${n} ${n===1?"ricetta":"ricette"}`:"non usato"} · ${Math.round((x.c||0)*4+(x.p||0)*4+(x.f||0)*9)} kcal per 100 g</small></span><span class="itags">${tagsHtml(ingCats(x))}</span></button>`}).join("")}</div>`;
}
function openIngredient(id){
  const old=id?S.ingr[id]:null,v=old?{...old,cats:ingCats(old)}:{name:ingQuery.trim(),cats:ingFilter?[ingFilter]:[]};
  const all=old?usesOf(old.name):[],uses=all.filter(r=>!r.archived);
  openSheet(old?`Ingrediente<small>${esc(old.name)}</small>`:"Nuovo ingrediente",`<div class="editor">
    <label class="ef"><span>Nome</span><input class="txt" id="igName" value="${esc(v.name)}" placeholder="Es. Ceci cotti" autocomplete="off"></label>
    <div class="evals iform"><p>Le ricette che lo usano prendono le sue categorie. Valori per 100 g, come sull'etichetta: cercali per nome o col codice a barre.</p>${ingFieldsHtml(v)}</div>
    ${uses.length?`<div class="ef"><span>Usato in ${uses.length} ${uses.length===1?"ricetta":"ricette"} <small>i cambiamenti valgono per tutte</small></span>
      <ul class="uses">${uses.map(r=>`<li>${esc(r.n)}</li>`).join("")}</ul></div>`:""}
    <p class="hint" id="igErr" hidden></p>
    <div class="row"><button class="btn" data-save>Salva</button><button class="btn ghost" data-cancel>Annulla</button>${old&&!uses.length?`<button class="btn ghost" data-delete>Elimina</button>`:""}</div>
    ${old&&uses.length?`<p class="shopnote" style="margin:0">Non si può eliminare finché è usato in una ricetta: prima toglilo da ${uses.length===1?"quella ricetta":"quelle ricette"}.</p>`:""}
    <div id="delBox"></div></div>`);
  if(!old)setTimeout(()=>($("#igName")||{focus(){}}).focus(),260);
  const fail=msg=>{const el=$("#igErr");el.textContent=msg;el.hidden=false;el.scrollIntoView({block:"center",behavior:"smooth"})};
  const body=$("#sheetBody");
  body.oninput=e=>{const t=e.target;if(t.id==="igName")v.name=t.value;else if(t.dataset.v)v[t.dataset.v]=t.value};
  // valori da Open Food Facts: per un ingrediente nuovo la ricerca parte appena c'è il nome
  const tgt=()=>({v,q:v.name}),autoOff=()=>{const box=body.querySelector("[data-offres]");if(!old&&v.name.trim()&&offEmpty(v)&&box)offFind(box,tgt(),"search",v.name)};
  body.onchange=e=>{if(offFile(e,tgt))return;if(e.target.id==="igName")autoOff()};
  autoOff();
  body.onclick=e=>{if(offClick(e,tgt))return;const b=e.target.closest("button");if(!b)return;
    if(b.dataset.icat){toggleCat(v,b.dataset.icat);b.setAttribute("aria-pressed",v.cats.includes(b.dataset.icat))}
    else if("cancel" in b.dataset)closeSheet();
    else if("delete" in b.dataset){$("#delBox").innerHTML=`<div class="confirm"><p>Eliminare <b>${esc(old.name)}</b> dal catalogo?</p>
      <div class="row"><button class="btn danger" data-confirm>Elimina</button><button class="btn ghost" data-nodel>Annulla</button></div></div>`;$("#delBox").scrollIntoView({block:"nearest",behavior:"smooth"})}
    else if("nodel" in b.dataset)$("#delBox").innerHTML="";
    else if("confirm" in b.dataset){if(activeUses(old.name).length)return fail("Nel frattempo è stato usato in una ricetta: non si può eliminare.");
      delete S.ingr[id];queue("ingredients",id,null,true);rebuildRecipes();save();closeSheet();renderAll();toast("Ingrediente eliminato")}
    else if("save" in b.dataset){
      const name=v.name.trim().replace(/\s+/g," ");if(!name)return fail("Manca il nome dell'ingrediente.");
      const dup=Object.keys(S.ingr).find(x=>x!==id&&S.ingr[x].name.toLowerCase()===name.toLowerCase());
      if(dup)return fail(`C'è già «${S.ingr[dup].name}» nel catalogo.`);
      if(!old&&offEmpty(v))return fail("Mancano i valori: cercali per nome o col codice a barre, oppure scrivili (0 se non ne ha).");
      const data=ingData(name,v);
      if(sameIng(old,data)){closeSheet();return}
      const iid=old?id:newIngId(name);S.ingr[iid]=data;queue("ingredients",iid,data);
      // nome cambiato: lo cambio anche nelle ricette che lo usano (anche eliminate, così restano giuste nei pasti passati)
      if(old&&old.name!==name)for(const r of all){const ingredients=S.recipes[r.id].ingredients.map(x=>x[0]===old.name?[name,...x.slice(1)]:x);
        S.recipes[r.id].ingredients=ingredients;queue("recipes",r.id,{ingredients})}
      rebuildRecipes();save();closeSheet();renderAll();
      toast(old?(uses.length?`Ingrediente salvato, ${uses.length} ${uses.length===1?"ricetta aggiornata":"ricette aggiornate"}`:"Ingrediente salvato"):"Ingrediente aggiunto")}};
}
$("#ingCat").addEventListener("click",e=>{const b=e.target.closest("[data-ing]");if(b)openIngredient(b.dataset.ing)});
$("#newIng").addEventListener("click",()=>openIngredient(null));
$("#ingSearch").addEventListener("input",e=>{ingQuery=e.target.value;renderIng()});
$("#ingFilters").addEventListener("click",e=>{const b=e.target.closest("[data-f]");if(!b)return;ingFilter=b.dataset.f||null;renderIng()});

/* ---------- Spesa ---------- */
// pasti ancora da fare (da adesso in poi) con una ricetta, esclusi quelli già comprati con "Spesa fatta"
const doneKey=(k,m)=>k+"|"+m;
function shopMeals(){const tk=key(new Date());
  return Object.keys(S.plan).filter(k=>k>=tk).sort().flatMap(k=>["pranzo","cena"].map(m=>({k,m,id:rid(slot(k,m))})))
    .filter(x=>x.id&&!isPast(x.k,x.m)&&S.shop.done[doneKey(x.k,x.m)]!==x.id)}
function shoppingList(meals){
  const map=new Map();
  meals.forEach(({k,m,id})=>{const r=byId[id],x=pplFactor(peopleOf(k,m));
    r.i.forEach(([n,q,u])=>{const kk=n+"|"+u;const e=map.get(kk)||{n,u,q:0,from:new Set()};e.q+=q*x;e.from.add(r.n);map.set(kk,e)})});
  // grammi interi; pezzi, mazzi, cucchiai… arrotondati per eccesso
  return[...map.values()].map(e=>({...e,q:(e.u==="g"||e.u==="ml")?Math.round(e.q):Math.ceil(e.q-1e-6)}));
}
const stepOf=(u,q)=>(u==="g"||u==="ml")?(q>=1000?100:50):1;
const r1=x=>Math.round(x*10)/10;
const dayShort=k=>{const d=new Date(k+"T12:00");return `${DAYS[(d.getDay()+6)%7].slice(0,3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`};
let shopItems={},shopNow=[];
function renderShop(){
  const meals=shopMeals(),items=shoppingList(meals).sort((a,b)=>a.n.localeCompare(b.n,"it")),{checks,have,extra}=S.shop,casa=S.shopMode==="casa";
  shopNow=meals;
  items.forEach(i=>{i.id=i.n+"|"+i.u;i.have=Math.min(have[i.id]||0,i.q);i.buy=r1(i.q-i.have)});
  shopItems=Object.fromEntries(items.map(i=>[i.id,i]));
  const toBuy=items.filter(i=>i.buy>0),atHome=items.filter(i=>i.buy<=0);
  const done=toBuy.filter(i=>checks[i.id]).length+extra.filter(x=>checks[x.id]).length,all=toBuy.length+extra.length;
  document.querySelectorAll("#shopMode button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.mode===S.shopMode));
  $("#shopSummary").textContent=!all&&!atHome.length?"":casa?`${toBuy.length} da comprare · ${atHome.length} già in casa${extra.length?` · ${extra.length} in Altro`:""}`:`${all} da comprare · ${done} presi`;
  $("#resetChecks").hidden=casa||!done;
  $("#prog").parentNode.hidden=casa;
  $("#prog").style.width=all?(done/all*100)+"%":"0";
  const tk=key(new Date()),bought=Object.keys(S.shop.done).filter(x=>x.split("|")[0]>=tk&&!isPast(...x.split("|"))).length;
  const span=meals.length?`<p class="shopnote">Per ${meals.length===1?"1 pasto":`${meals.length} pasti`} da fare, ${meals[0].k===meals[meals.length-1].k?dayShort(meals[0].k):`da ${dayShort(meals[0].k)} a ${dayShort(meals[meals.length-1].k)}`}${bought?` · ${bought} già comprati`:""}.</p>`:"";
  // in fondo le cose che non vengono dalle ricette: si aggiungono e si tolgono a mano
  const addHtml=`<form class="xadd" id="xadd"><input class="txt" id="xNew" maxlength="60" placeholder="Es. detersivo, pane, caffè" aria-label="Aggiungi alla spesa" autocomplete="off"><button class="btn">Aggiungi</button></form>`;
  const check=(id,name,sub,qty)=>{const ok=!!checks[id];return `<div class="item${ok?" done":""}"><button class="rowtap" data-check="${esc(id)}"><span class="box">${ok?"✓":""}</span><span class="iname"><b>${esc(name)}</b>${sub?`<small>${esc(sub)}</small>`:""}</span>${qty?`<span class="qty">${qty}</span>`:""}</button></div>`};
  const noMeals=`<p class="empty-note">${bought?"Hai già comprato tutto per i pasti in programma.":"Nessun pasto da fare in programma."}<br>Quando aggiungi delle ricette alla settimana, la lista si compone da sola.</p>`;
  if(casa){
    // controllo dispensa: − e + regolano direttamente quanto comprare
    $("#shop").innerHTML=(items.length?span+`<p class="shopnote">Con − togli quello che hai già. Tocca il nome se ce l'hai tutto.</p><div class="items">`+
      items.map(i=>{const home=i.buy<=0;return `<div class="item${home?" home":""}">
       <button class="rowtap" data-home="${esc(i.id)}"><span class="iname"><b>${esc(i.n)}</b><small>${i.have>0?`serve ${fmtQty(i.q,i.u)} · a casa ${fmtQty(i.have,i.u)}`:`serve ${fmtQty(i.q,i.u)}`}</small></span></button>
       <div class="qstep"><button data-dec="${esc(i.id)}" aria-label="Compra meno ${esc(i.n)}" ${home?"disabled":""}>−</button><span class="qv">${home?"a casa":fmtQty(i.buy,i.u)}</span><button data-inc="${esc(i.id)}" aria-label="Compra più ${esc(i.n)}" ${i.have<=0?"disabled":""}>+</button></div></div>`}).join("")+`</div>`:noMeals)+
     `<h3 class="shh">Altro</h3><p class="shopnote">Cose che non vengono dalle ricette.</p>`+
     (extra.length?`<div class="items">${extra.map(x=>`<div class="item"><span class="iname"><b>${esc(x.n)}</b></span><button class="iconbtn xdel" data-xdel="${esc(x.id)}" aria-label="Togli ${esc(x.n)}">✕</button></div>`).join("")}</div>`:"")+addHtml;
  }else{
    const byDone=(a,b)=>(!!checks[a.id])-(!!checks[b.id]);
    $("#shop").innerHTML=(toBuy.length?span+`<div class="items">${toBuy.sort(byDone).map(i=>check(i.id,i.n,[...i.from].join(", "),fmtQty(i.buy,i.u))).join("")}</div>`:items.length?"":noMeals)+
     `<h3 class="shh">Altro</h3>`+(extra.length?`<div class="items">${[...extra].sort(byDone).map(x=>check(x.id,x.n)).join("")}</div>`:"")+addHtml+
     (atHome.length?`<p class="shopnote" style="margin-top:14px">Già in casa: ${esc(atHome.map(i=>i.n).join(", "))}</p>`:"")+
     (all?`<div class="shopdone"><button class="btn" data-shopdone>Spesa fatta</button><p class="shopnote">I pasti di questa lista escono dalla spesa; quello che non hai preso resta in Altro.</p></div>`:"");
  }
}
function setHave(id,v){const it=shopItems[id];if(!it)return;const x=Math.max(0,Math.min(it.q,r1(v)));const H=S.shop.have;if(x)H[id]=x;else delete H[id];save();queueShop("have");renderShop()}
// spesa fatta: i pasti in lista sono comprati; gli ingredienti non presi passano in Altro con la quantità
function shopDone(){const {checks,extra}=S.shop,tk=key(new Date());
  const left=Object.values(shopItems).filter(i=>i.buy>0&&!checks[i.id]).map(i=>({id:"x"+randId(),n:`${i.n} · ${fmtQty(i.buy,i.u)}`}));
  const done=Object.fromEntries(Object.entries(S.shop.done).filter(([x])=>x.split("|")[0]>=tk)); // i giorni passati non servono più
  for(const x of shopNow)done[doneKey(x.k,x.m)]=x.id;
  S.shop={checks:{},have:{},extra:[...extra.filter(x=>!checks[x.id]),...left],done};
  save();for(const f of ["checks","have","extra","done"])queueShop(f);renderShop();window.scrollTo(0,0);
  toast(left.length?`Spesa fatta · ${left.length} ${left.length===1?"cosa rimasta":"cose rimaste"} in Altro`:"Spesa fatta")}
$("#shop").addEventListener("click",e=>{
  const dec=e.target.closest("[data-dec]");if(dec){const it=shopItems[dec.dataset.dec];setHave(it.id,it.have+stepOf(it.u,it.q));return}
  const inc=e.target.closest("[data-inc]");if(inc){const it=shopItems[inc.dataset.inc];setHave(it.id,it.have-stepOf(it.u,it.q));return}
  const h=e.target.closest("[data-home]");if(h){const it=shopItems[h.dataset.home];setHave(it.id,it.buy>0?it.q:0);return}
  const x=e.target.closest("[data-xdel]");if(x){S.shop.extra=S.shop.extra.filter(i=>i.id!==x.dataset.xdel);delete S.shop.checks[x.dataset.xdel];save();queueShop("extra");queueShop("checks");renderShop();return}
  if(e.target.closest("[data-shopdone]")){shopDone();return}
  const b=e.target.closest("[data-check]");if(!b)return;const id=b.dataset.check;S.shop.checks[id]=!S.shop.checks[id];save();queueShop("checks");renderShop()});
$("#shop").addEventListener("submit",e=>{e.preventDefault();const inp=$("#xNew"),n=inp.value.trim().replace(/\s+/g," ");if(!n)return;
  S.shop.extra=[...S.shop.extra,{id:"x"+randId(),n}];save();queueShop("extra");renderShop();$("#xNew").focus()});
$("#resetChecks").onclick=()=>{S.shop.checks={};save();queueShop("checks");renderShop();toast("Spunte azzerate")};
$("#shopMode").addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(!b)return;S.shopMode=b.dataset.mode;save();renderShop();window.scrollTo(0,0)});

/* ---------- Ricette ---------- */
let recMode="rec"; // ricette o catalogo degli ingredienti
function renderRec(){
  document.querySelectorAll("#recMode button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.mode===recMode));
  $("#recPane").hidden=recMode!=="rec";$("#ingPane").hidden=recMode!=="ing";renderIng();
  $("#recFilters").innerHTML=filtersHtml(recFilter);
  if(recFilter&&!catById[recFilter])recFilter=null;
  const list=R.filter(r=>!recFilter||r.k.includes(recFilter)),drafts=recFilter?[]:DRAFTS;
  // in cima le ricette in costruzione (non hanno ancora tutto: niente filtri per categoria)
  $("#recList").innerHTML=(drafts.length?`<h3 class="shh">In costruzione</h3>${drafts.map(r=>cardHtml(r,false,false,`<span class="dmiss">${esc(draftMissing(r))}</span>`)).join("")}<h3 class="shh">Ricette</h3>`:"")+
    (list.length?list.map(r=>cardHtml(r,false,true)).join(""):`<p class="empty-note">Nessuna ricetta${recFilter?` nella categoria ${esc(cname(recFilter).toLowerCase())}`:""}.<br>Aggiungila con «Nuova ricetta».</p>`);
}
$("#newRec").addEventListener("click",()=>openEditor(null));
$("#recMode").addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(!b)return;recMode=b.dataset.mode;renderRec();renderHeader();window.scrollTo(0,0)});
$("#recFilters").addEventListener("click",e=>{const b=e.target.closest("[data-f]");if(!b)return;recFilter=b.dataset.f||null;renderRec()});
$("#recList").addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(b)openRecipe(b.dataset.id)});

/* ---------- Navigazione ---------- */
function renderAll(){renderHeader();renderWeek();renderShop();renderRec();renderSettings()}
function go(d){offset+=d;renderAll();offset===0?scrollToToday():window.scrollTo(0,0)}
$("#prev").onclick=()=>go(-1);$("#next").onclick=()=>go(1);
$("#weeklbl").onclick=()=>{if(offset!==0)go(-offset);else scrollToToday(true)};
document.querySelectorAll("nav.tabs button").forEach(b=>b.onclick=()=>{
  tab=b.dataset.tab;document.querySelectorAll("nav.tabs button").forEach(x=>x.setAttribute("aria-selected",x===b));
  $("#v-week").hidden=tab!=="week";$("#v-shop").hidden=tab!=="shop";$("#v-rec").hidden=tab!=="rec";$("#v-set").hidden=tab!=="set";renderHeader();
  tab==="week"&&offset===0?scrollToToday():window.scrollTo(0,0)});
let sx=null,sy=null;
$("main").addEventListener("touchstart",e=>{if($("#sheet").classList.contains("open")||tab==="rec"||tab==="set")return;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
$("main").addEventListener("touchend",e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1)});

/* ---------- Account e avvio ---------- */
function openAccount(){
  const n=outbox.length;
  openSheet("Account",`<p style="margin:0 0 12px">Accesso come <b>${esc(pb.authStore.record?.email||"")}</b>.</p>
    ${n?`<p class="hint">Ci sono ${n} modifiche non ancora inviate al server: uscendo andrebbero perse.</p>`:""}
    <button class="btn ghost" data-logout>Esci</button>`);
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-logout]"))logout()};
}
function logout(){pb.realtime.unsubscribe().catch(()=>{});pb.authStore.clear();try{localStorage.removeItem(CACHE);localStorage.removeItem(OUTBOX)}catch(e){}location.reload()}
function showLogin(){$("#login").hidden=false;$("#app").hidden=true;setTimeout(()=>$("#lEmail").focus(),50)}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const err=$("#lErr"),btn=e.target.querySelector("button");err.hidden=true;btn.disabled=true;
  try{await pb.collection("users").authWithPassword($("#lEmail").value.trim(),$("#lPass").value);$("#lPass").value="";start()}
  catch(x){err.textContent=x.status?"Email o password non corretti.":"Server non raggiungibile.";err.hidden=false}
  finally{btn.disabled=false}});
let started=false;
function start(){
  $("#login").hidden=true;$("#app").hidden=false;
  renderAll();requestAnimationFrame(()=>scrollToToday());
  document.fonts&&document.fonts.ready.then(()=>{if(window.scrollY<5)scrollToToday()});
  if(started){pb.realtime.unsubscribe().catch(()=>{}).finally(()=>connect().catch(()=>{}));sync();return}started=true;
  // rinnovo il token (dura 180 giorni) e mi collego al tempo reale; offline uso la copia locale
  pb.collection("users").authRefresh().catch(e=>{if(e.status===401||e.status===403)showLogin()});
  connect().catch(()=>{netOk=false;renderSync()});sync();
  window.addEventListener("online",sync);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){checkDay();sync()}});
  setInterval(()=>{if(outbox.length)flush()},30000);
}
renderSync();
if(pb.authStore.token)start();else showLogin();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
