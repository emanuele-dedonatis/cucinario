(function(){
/* ---------- Categorie proteiche ---------- */
// i legumi sono divisi in tre: nelle tessere in alto stanno sulla prima riga
const PROT = ["lenticchie","fagioli","ceci","pesce","carne","uova","latticini"];
const PNAME = {lenticchie:"Lenticchie",fagioli:"Fagioli",ceci:"Ceci",pesce:"Pesce",carne:"Carne",uova:"Uova",latticini:"Latticini"};
const PSING = {lenticchie:"lenticchie",fagioli:"fagioli",ceci:"ceci",pesce:"pesce",carne:"carne",uova:"uova",latticini:"latticini"};
const CATS = ["Frutta e verdura","Pesce","Carne","Latticini e uova","Pane e pasta","Dispensa"];

/* ---------- Ricette e ingredienti (collezioni recipes e ingredients sul server) ----------
   Dentro l'app una ricetta è {id, n:nome, t:categoria, i:[[ingrediente, quantità, unità, reparto]], s:[passi], oil, v, archived},
   con le quantità già per 2 adulti + 1 bambina (2,5 porzioni). v = illustrazione: b = base del piatto, c = colore base,
   x = elementi [forma, colore, quantità, grandezza]; senza v si usa quella della categoria (DEFV).
   La categoria non si sceglie: è la fonte proteica (prot) dell'ingrediente che porta più proteine (vedi recipeCat). */
const SERV=2.5,SERV_LBL="per 2 adulti e 1 bambina";
let R=[],byId={},ING={}; // R = ricette attive (elenco, selettore, riempimento); byId comprende anche quelle eliminate; ING = catalogo per nome
const grams=(q,u,x)=>(u==="g"||u==="ml")?q:q*((x&&x.unit_g)||100);
// rows = [[nome, quantità, unità]]; look(nome) → valori dell'ingrediente. null se nessun ingrediente è una fonte proteica
function recipeCat(rows,look){look=look||(n=>ING[n]);const sc={};
  for(const [n,q,u] of rows){const x=look(n);if(x&&PROT.includes(x.prot))sc[x.prot]=(sc[x.prot]||0)+grams(+q||0,u,x)*((x.p||0)+.01)/100}
  let best=null;for(const p in sc)if(best===null||sc[p]>sc[best])best=p;return best}
function rebuildRecipes(){
  ING={};for(const id in S.ingr)ING[S.ingr[id].name]={...S.ingr[id],id};
  byId={};
  for(const id in S.recipes){const x=S.recipes[id],rows=x.ingredients||[];
    byId[id]={id,n:x.name||"",t:recipeCat(rows),v:x.vis||null,s:x.steps||[],oil:x.oil??25,archived:!!x.archived,
      i:rows.map(([n,q,u])=>[n,q,u,(ING[n]||{}).dept||"Dispensa"])}}
  // pasti salvati quando le ricette stavano nel codice: "ceci" ora è il record "rceci0000000000"
  for(const id in S.recipes){const old=/^r([a-z]+)0*$/.exec(id);if(old&&!byId[old[1]])byId[old[1]]=byId[id]}
  R=Object.keys(S.recipes).map(id=>byId[id]).filter(r=>!r.archived).sort((a,b)=>a.n.localeCompare(b.n,"it"));
  for(const k in nutCache)delete nutCache[k];for(const k in svgCache)delete svgCache[k];
}
// ingredienti in comune tra due ricette (escludo erbe e piccole cose che non cambiano il lavoro in cucina)
const MINOR=new Set(["Aglio","Basilico","Rosmarino","Prezzemolo","Limone","Farina","Capperi","Parmigiano","Burro","Vino bianco"]);
function shared(a,b){if(!a||!b||a.id===b.id)return[];const bn=new Set(b.i.map(x=>x[0]));return a.i.map(x=>x[0]).filter(n=>!MINOR.has(n)&&bn.has(n))}
const LINK_ICO=`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`;
const prevDinner=k=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),-1))]||{}).cena;return typeof v==="string"?byId[v]:null};

/* ---------- Valori nutrizionali (dal catalogo ingredienti, per 100 g) ---------- */
const OLIO={c:0,p:0,f:100,fib:0}; // olio extravergine: oil = grammi per tutta la ricetta, conteggiati nei valori
const nutCache={};
// look(nome) → {c,p,f,fib,unit_g}: l'editor passa anche gli ingredienti non ancora salvati
function nutrition(r,look){
  if(!look&&nutCache[r.id])return nutCache[r.id];
  let C=0,P=0,F=0,Fi=0;
  const add=(x,g)=>{C+=(x.c||0)*g/100;P+=(x.p||0)*g/100;F+=(x.f||0)*g/100;Fi+=(x.fib||0)*g/100};
  for(const [n,q,u] of r.i){const x=(look||(n=>ING[n]))(n);if(x)add(x,grams(q,u,x))}
  add(OLIO,r.oil??25);
  C/=SERV;P/=SERV;F/=SERV;Fi/=SERV; // per porzione
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
   <h4>Per porzione <span>circa ${n.kcal} kcal</span></h4>
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
const TABLE = {pesce:["#c8dae6","#b5cad9"],lenticchie:["#ead8bd","#dcc5a3"],fagioli:["#efd3e2","#e3bfd2"],ceci:["#cfe8e2","#b9dcd3"],carne:["#ecd0cc","#dfbcb6"],uova:["#ddd3ec","#cbbfe0"],latticini:["#ece5bd","#ddd4a3"]};
function rng(seed){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
// illustrazione per le ricette nuove, finché non hanno una foto
const DEFV={lenticchie:{b:"half",c:"#7a5233",x:[["dot","#5c3c24",16,4],["dot","#e8873a",4,4]]},fagioli:{b:"soup",c:"#a4573b",x:[["bean","#c98a7a",9,7],["leaf","#4f7d3a",2,5]]},
  ceci:{b:"soup",c:"#d8b36a",x:[["dot","#e9cf8f",14,5],["leaf","#4f7d3a",2,5]]},pesce:{b:"none",x:[["fillet","#f4efe6",1,28],["dot","#e8463a",5,5],["leaf","#4f9a3a",3,5]]},
  carne:{b:"none",x:[["fillet","#c99a6a",2,18],["leaf","#4f9a3a",4,5]]},uova:{b:"disc",c:"#f0c548",x:[["dot","#e7b13a",6,4],["leaf","#6fa04a",3,5]]},
  latticini:{b:"none",x:[["cube","#f8f6ef",6,9],["round","#e0443a",3,8],["leaf","#3f8f3a",3,5]]}};
const svgCache={};
function dishSvg(r){
  if(svgCache[r.id])return svgCache[r.id];
  const rnd=rng(r.id),v=r.v||DEFV[r.t]||DEFV.ceci,[t1,t2]=TABLE[r.t]||TABLE.ceci;
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
   Collezioni sul server: plan (un record per giorno), shopping (uno per settimana: spunte e "a casa"),
   settings (unico record: obiettivi, intervalli, orari), photos (una foto per ricetta), recipes, ingredients.
   Le modifiche vanno in una coda locale (outbox) e partono appena c'è rete; vince l'ultima scrittura per campo. */
const CACHE="cucinario-stato-v1",OUTBOX="cucinario-outbox-v1",COLS=["plan","shopping","settings","photos","recipes","ingredients"];
const JSONF=new Set(["pranzo","cena","checks","have","goals","ranges","times","ingredients","steps","vis"]);
const pb=new PocketBase(location.origin);pb.autoCancellation(false);
// id dei record deterministici (15 caratteri a-z0-9), così ogni dispositivo sa quale record aggiornare
const pad15=s=>(s.replace(/[^a-z0-9]/g,"")+"0".repeat(15)).slice(0,15);
function hash36(s){let a=0xdeadbeef,b=0x41c6ce57;for(const c of s){const x=c.charCodeAt(0);a=Math.imul(a^x,2654435761);b=Math.imul(b^x,1597334677)}
  a=Math.imul(a^a>>>16,2246822507)^Math.imul(b^b>>>13,3266489909);b=Math.imul(b^b>>>16,2246822507)^Math.imul(a^a>>>13,3266489909);
  return((b>>>0).toString(36)+(a>>>0).toString(36))}
const ID={plan:k=>pad15("p"+k),shopping:w=>pad15("w"+w),settings:()=>"settings0000000",photos:r=>pad15("ph"+hash36(r)),ingredients:n=>pad15("i"+hash36(n))};
const defaults=()=>({plan:{},checks:{},have:{},photos:{},recipes:{},ingr:{},shopMode:"casa",
  goals:{lenticchie:{min:1,max:null},fagioli:{min:1,max:null},ceci:{min:1,max:null},pesce:{min:2,max:null},carne:{min:0,max:2},uova:{min:0,max:2},latticini:{min:0,max:3}},
  ranges:{c:[45,60],p:[15,25],f:[20,35],fib:8},times:{pranzo:"18:00",cena:"23:00"}});
let S=defaults(),outbox=[],netOk=true;
try{S=Object.assign(defaults(),JSON.parse(localStorage.getItem(CACHE))||{})}catch(e){}
try{outbox=JSON.parse(localStorage.getItem(OUTBOX))||[]}catch(e){}
// obiettivi salvati prima che i legumi fossero divisi in tre: tengo solo le categorie attuali, il resto dai default
const normGoals=g=>{const d=defaults().goals;return Object.fromEntries(PROT.map(p=>[p,(g&&g[p])||d[p]]))};
S.goals=normGoals(S.goals);
rebuildRecipes();
function save(){try{localStorage.setItem(CACHE,JSON.stringify(S))}catch(e){}}
function queue(col,id,data,del){data=JSON.parse(JSON.stringify(data||{}));const e=outbox.find(x=>x.col===col&&x.id===id);
  if(del){if(e)outbox.splice(outbox.indexOf(e),1);outbox.push({col,id,data:{},del:true})}  // eliminazione: scarto le modifiche in coda
  else if(e){if(e.del){e.del=false;e.data={}}Object.assign(e.data,data)}else outbox.push({col,id,data});
  try{localStorage.setItem(OUTBOX,JSON.stringify(outbox))}catch(e){}
  renderSync();clearTimeout(queue._t);queue._t=setTimeout(flush,300)}
const queueSettings=f=>queue("settings",ID.settings(),{[f]:S[f]});
const queueShop=(w,f)=>queue("shopping",ID.shopping(w),{week:w,[f]:S[f][w]||{}});
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
  if(col==="plan"){if(del)delete S.plan[r.date];else S.plan[r.date]={pranzo:r.pranzo??null,cena:r.cena??null}}
  else if(col==="shopping"){if(del){delete S.checks[r.week];delete S.have[r.week]}else{S.checks[r.week]=r.checks||{};S.have[r.week]=r.have||{}}}
  else if(col==="settings"){if(!del)for(const f of ["goals","ranges","times"])if(r[f])S[f]=f==="goals"?normGoals(r[f]):r[f]}
  else if(col==="photos"){if(del||!r.image)delete S.photos[r.recipe];else S.photos[r.recipe]=pb.files.getURL(r,r.image)}
  else if(col==="recipes"){if(del)delete S.recipes[r.id];else S.recipes[r.id]={name:r.name,cat:r.cat,ingredients:r.ingredients||[],steps:r.steps||[],oil:r.oil,vis:r.vis,archived:r.archived}}
  else if(col==="ingredients"){if(del)delete S.ingr[r.id];else S.ingr[r.id]={name:r.name,dept:r.dept,prot:r.prot||"",c:r.c,p:r.p,f:r.f,fib:r.fib,unit_g:r.unit_g}}
}
// le modifiche locali non ancora inviate hanno la precedenza su quello che arriva dal server
function applyPending(){for(const {col,id,data,del} of outbox){
  if(del){if(col==="ingredients")delete S.ingr[id];else if(col==="recipes")delete S.recipes[id]}
  else if(col==="plan"){const p=S.plan[data.date]=S.plan[data.date]||{pranzo:null,cena:null};for(const m of ["pranzo","cena"])if(m in data)p[m]=data[m]}
  else if(col==="shopping"){for(const f of ["checks","have"])if(f in data)S[f][data.week]=data[f]}
  else if(col==="settings"){Object.assign(S,data);S.goals=normGoals(S.goals)}
  else if(col==="recipes")S.recipes[id]=Object.assign(S.recipes[id]||{},data);
  else if(col==="ingredients")S.ingr[id]=Object.assign(S.ingr[id]||{},data)}
  rebuildRecipes()}
async function pull(){
  const lists=await Promise.all(COLS.map(c=>pb.collection(c).getFullList({batch:1000})));
  S.plan={};S.checks={};S.have={};S.photos={};S.recipes={};S.ingr={};
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
function setSlot(k,m,id){S.plan[k]=S.plan[k]||{pranzo:null,cena:null};S.plan[k][m]=id;save();queue("plan",ID.plan(k),{date:k,[m]:id})}
const tagHtml=t=>t?`<span class="tag t-${t}">${PNAME[t]}</span>`:"";
const catTag=t=>tagHtml(t)||`<span class="tag t-none">Nessuna fonte proteica</span>`;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1900)}

/* ---------- Obiettivi ---------- */
function counts(){const c=Object.fromEntries(PROT.map(p=>[p,0]));weekKeys().forEach(k=>["pranzo","cena"].forEach(m=>{const id=rid(slot(k,m));if(id&&byId[id].t)c[byId[id].t]++}));return c}
function status(p,c){const g=S.goals[p],n=c[p];
  if(g.min&&n<g.min)return{cls:"warn",txt:`manca ${g.min-n}`,need:g.min-n};
  if(g.max!=null&&n>g.max)return{cls:"warn",txt:`+${n-g.max} di troppo`,over:n-g.max};
  if(g.min||g.max!=null)return{cls:"ok",txt:"✓"};
  return{cls:"",txt:"libero"}}
const goalLbl=g=>g.min&&g.max!=null?`${g.min}–${g.max}`:g.min?`≥${g.min}`:g.max!=null?`≤${g.max}`:"";
// bilanciamento della settimana: un'icona accanto alla data; il resoconto per fonte proteica si apre toccandola
const BAL_ICO={ok:`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12.5 4 4 8-9"/></svg>`,
  warn:`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M12 5v9"/><circle cx="12" cy="19" r=".6" fill="currentColor"/></svg>`,
  none:`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v8M5.5 3v5a2.5 2.5 0 0 0 5 0V3M8 11v10M17 3c-2 0-3 3-3 7h3v11"/></svg>`};
function weekBal(){const c=counts(),issues=PROT.map(p=>({p,...status(p,c)})).filter(s=>s.cls==="warn");
  const any=weekKeys().some(k=>["pranzo","cena"].some(m=>rid(slot(k,m))));
  return{c,issues,st:!any?"none":issues.length?"warn":"ok"}}
const issueTxt=s=>`${PNAME[s.p]}: ${s.need?`manca${s.need>1?"no":""} ${s.need}`:`+${s.over} di troppo`}`;
function renderGoals(){const {issues,st}=weekBal(),b=$("#wbal");
  b.className="wbal "+st;b.innerHTML=BAL_ICO[st];
  b.setAttribute("aria-label",st==="ok"?"Settimana bilanciata":st==="warn"?`Settimana da sistemare: ${issues.map(issueTxt).join(", ")}`:"Settimana vuota");
  b.title=b.getAttribute("aria-label");
}
const goalsHtml=c=>`<div class="goals">${PROT.map(p=>{const g=S.goals[p],st=status(p,c);
  return `<span class="goal ${st.cls}"><span class="gname">${PNAME[p]}</span><span class="gnum">${c[p]}${goalLbl(g)?`<span> / ${goalLbl(g)}</span>`:""}</span><span class="gstate">${st.txt}</span></span>`}).join("")}</div>`;
function openWeekBal(){const {c,issues,st}=weekBal(),a=weekStart(),b=addDays(a,6);
  openSheet(`Fonti proteiche<small>${weekName(offset)} · ${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}</small>`,
    `<div class="verdict ${st==="ok"?"ok":"warn"}"><b>${st==="ok"?"Settimana bilanciata":st==="warn"?"Da sistemare":"Settimana vuota"}</b><span>${st==="ok"?"Tutti gli obiettivi sono rispettati.":st==="warn"?issues.map(issueTxt).join(" · "):"Nessun pasto ancora: prova «✦ Riempi»."}</span></div>
     <p style="margin:12px 0 8px;color:var(--muted);font-size:13.5px">Quante volte in settimana, tra pranzi e cene, rispetto all'obiettivo.</p>${goalsHtml(c)}
     <div class="row" style="margin-top:14px"><button class="btn ghost" data-goals>Modifica obiettivi</button></div>`);
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-goals]"))openGoals(openWeekBal)};
}
$("#wbal").addEventListener("click",openWeekBal);
function openGoals(back){
  if(typeof back!=="function")back=null;
  const draw=()=>{$("#sheetBody").innerHTML=`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Quante volte a settimana, tra pranzi e cene. L'icona accanto alla data diventa arancione quando un obiettivo non è rispettato.</p><div class="grows">${PROT.map(p=>{const g=S.goals[p];
    return `<div class="grow"><div class="gtop">${tagHtml(p)}<span style="color:var(--muted);font-size:13px">${goalLbl(g)?goalLbl(g)+" a settimana":"nessun vincolo"}</span></div>
    <div class="gctl"><div class="stepper"><label>Almeno</label><div><button data-p="${p}" data-f="min" data-d="-1" aria-label="Meno">−</button><output>${g.min||"—"}</output><button data-p="${p}" data-f="min" data-d="1" aria-label="Più">+</button></div></div>
    <div class="stepper"><label>Al massimo</label><div><button data-p="${p}" data-f="max" data-d="-1" aria-label="Meno">−</button><output>${g.max==null?"—":g.max}</output><button data-p="${p}" data-f="max" data-d="1" aria-label="Più">+</button></div></div></div></div>`}).join("")}</div>
    ${back?`<div style="margin-top:12px"><button class="btn" data-back>Torna al resoconto</button></div>`:""}`};
  openSheet("Obiettivi settimanali","");draw();
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-back]")){back();return}
    const b=e.target.closest("[data-p]");if(!b)return;const g=S.goals[b.dataset.p],d=+b.dataset.d;
    if(b.dataset.f==="min"){g.min=Math.max(0,Math.min(14,(g.min||0)+d));if(g.max!=null&&g.max<g.min)g.max=g.min}
    else{ if(g.max==null){if(d<0)g.max=7}else{g.max+=d;if(g.max>7)g.max=null;else if(g.max<0)g.max=0} if(g.max!=null&&g.min>g.max)g.min=g.max}
    save();queueSettings("goals");draw();renderGoals()};
}

/* ---------- Header ---------- */
function renderHeader(){
  const a=weekStart(),b=addDays(a,6);
  const range=a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`:`${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
  const name=offset===0?"Questa settimana":offset===1?"Prossima settimana":offset===-1?"Settimana scorsa":(offset>0?`Tra ${offset} settimane`:`${-offset} settimane fa`);
  $("#weeklbl").innerHTML=`<small>${name}</small>${range}`;
  $("#title").textContent={week:"Settimana",shop:"Lista della spesa",rec:recMode==="ing"?"Ingredienti":"Ricette",set:"Impostazioni"}[tab];
  $("#weeknav").hidden=tab==="rec"||tab==="set";
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
/* ---------- Impostazioni ---------- */
function renderSettings(){
  const g=S.goals,r=S.ranges;
  const gs=PROT.map(p=>{const l=goalLbl(g[p]);return l?`${PNAME[p]} ${l}`:null}).filter(Boolean).join(" · ")||"Nessun vincolo";
  $("#setList").innerHTML=`
   <button class="setitem" data-s="goals"><span><b>Obiettivi settimanali</b><small>${gs}</small></span></button>
   <button class="setitem" data-s="ranges"><span><b>Pasto bilanciato</b><small>Carboidrati ${r.c[0]}–${r.c[1]}% · Proteine ${r.p[0]}–${r.p[1]}% · Grassi ${r.f[0]}–${r.f[1]}% · Fibre ≥${r.fib} g</small></span></button>
   <button class="setitem" data-s="times"><span><b>Orari dei pasti</b><small>Il pranzo passa alle ${S.times.pranzo}, la cena alle ${S.times.cena}</small></span></button>
   <button class="setitem" data-s="account"><span><b>Account</b><small>${esc(pb.authStore.record?.email||"")}</small></span></button>`;
}
$("#setList").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;({goals:openGoals,ranges:()=>openRanges(),times:openTimes,account:openAccount})[b.dataset.s]()});
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
function renderWeek(){
  renderGoals();
  const tk=key(new Date());
  $("#days").innerHTML=weekKeys().map((k,i)=>{const d=addDays(weekStart(),i),isT=k===tk;
    return `<div class="day${isT?" is-today":""}${dayPast(k)?" past":""}">
      <div class="dayhead"><span class="dname">${DAYS[i]}</span><span class="ddate">${d.getDate()} ${MONTHS[d.getMonth()]}</span>${isT?'<span class="badge">Oggi</span>':""}</div>
      <div class="slots">${["pranzo","cena"].map(m=>{const v=slot(k,m),o=outNote(v),r=rid(v)&&byId[rid(v)],past=isT&&isPast(k,m)?" past":"";
        if(o!==null)return `<button class="slot${past}" data-k="${k}" data-m="${m}"><span class="meal">${m}</span>${outPh()}<span class="rname">${esc(o||"Pasto fuori casa")}</span></button>`;
        return r?`<button class="slot${past}" data-k="${k}" data-m="${m}"><span class="meal">${m}</span><div class="ph">${S.photos[r.id]?`<img src="${S.photos[r.id]}" alt="">`:dishSvg(r)}${tagHtml(r.t)}</div><span class="rname">${esc(r.n)}</span>${m==="pranzo"&&shared(r,prevDinner(k)).length?`<span class="link">${LINK_ICO}con la cena di ieri</span>`:""}</button>`
                :`<button class="slot empty${past}" data-k="${k}" data-m="${m}"><span class="meal">${m}</span><div class="ph">+ Scegli</div></button>`}).join("")}</div></div>`}).join("");
}
// l'app installata può restare aperta per giorni: se è cambiato il giorno torno alla settimana di oggi
function checkDay(){const t=new Date();if(key(t)===key(today))return false;today=t;thisMonday=mondayOf(t);offset=0;renderAll();scrollToToday();return true}
setInterval(()=>{if(!checkDay()&&!$("#sheet").classList.contains("open"))renderWeek()},60000);
$("#days").addEventListener("click",e=>{const b=e.target.closest(".slot");if(!b)return;const{k,m}=b.dataset;const v=slot(k,m);
  if(outNote(v)!==null)openOut(k,m);else if(rid(v))openDetail(k,m);else openPicker(k,m)});

/* ---------- Riempimento automatico che rispetta gli obiettivi ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function autofill(all){
  const keys=weekKeys();
  // "rifai tutto" tiene i pasti fuori casa
  if(all)keys.forEach(k=>["pranzo","cena"].forEach(m=>{if(outNote(slot(k,m))===null&&slot(k,m))setSlot(k,m,null)}));
  const empty=[];keys.forEach(k=>["pranzo","cena"].forEach(m=>{if(!slot(k,m))empty.push([k,m])}));
  if(!empty.length){toast("La settimana è già piena");return}
  const has=PROT.filter(p=>R.some(r=>r.t===p));
  if(!has.length){toast("Nessuna ricetta da usare");return}
  const c=counts(),cats=[];
  for(const p of shuffle([...has])){const need=Math.max(0,(S.goals[p].min||0)-c[p]);for(let i=0;i<need&&cats.length<empty.length;i++){cats.push(p);c[p]++}}
  while(cats.length<empty.length){
    const ok=has.filter(p=>S.goals[p].max==null||c[p]<S.goals[p].max);
    let from=ok.length?ok:has;
    const under7=from.filter(p=>c[p]<7);if(under7.length)from=under7; // più di 7 costringerebbe a ripetere nello stesso giorno
    // scelta pesata: le categorie già usate poco hanno più probabilità, per una settimana varia
    const wts=from.map(p=>1/(1+c[p])),tot=wts.reduce((a,b)=>a+b,0);let x=Math.random()*tot,p=from[from.length-1];
    for(let j=0;j<from.length;j++){x-=wts[j];if(x<=0){p=from[j];break}}
    cats.push(p);c[p]++;
  }
  // distribuisco le categorie evitando la stessa proteina a pranzo e a cena dello stesso giorno
  const fixedCat=(k,m)=>{const id=rid(slot(k,m));return id?byId[id].t:null};
  const conflicts=arr=>{let n=0;const day={};empty.forEach(([k,m],i)=>{(day[k]=day[k]||{})[m]=arr[i]});
    for(const k in day){const p=day[k].pranzo??fixedCat(k,"pranzo"),c2=day[k].cena??fixedCat(k,"cena");if(p&&c2&&p===c2)n++}return n};
  let best=shuffle([...cats]),bestN=conflicts(best);
  for(let t=0;t<300&&bestN>0;t++){const a=shuffle([...cats]),n=conflicts(a);if(n<bestN){best=a;bestN=n}}
  cats.splice(0,cats.length,...best);
  const used=new Set();keys.forEach(k=>["pranzo","cena"].forEach(m=>{const id=rid(slot(k,m));if(id)used.add(id)}));
  // in ordine cronologico: il pranzo cerca ingredienti in comune con la cena della sera prima (e viceversa)
  const order=empty.map((s,i)=>({k:s[0],m:s[1],cat:cats[i]})).sort((a,b)=>a.k===b.k?(a.m==="pranzo"?-1:1):a.k<b.k?-1:1);
  for(const s of order){
    let cand=R.filter(r=>r.t===s.cat&&!used.has(r.id));if(!cand.length)cand=R.filter(r=>r.t===s.cat);
    const partner=s.m==="pranzo"?rid(slot(key(addDays(new Date(s.k+"T12:00"),-1)),"cena")):rid(slot(key(addDays(new Date(s.k+"T12:00"),1)),"pranzo"));
    let pick;
    if(partner){const sc=cand.map(r=>shared(r,byId[partner]).length),mx=Math.max(...sc);
      const top=cand.filter((r,i)=>sc[i]===mx);pick=top[Math.floor(Math.random()*top.length)]}
    else pick=cand[Math.floor(Math.random()*cand.length)];
    used.add(pick.id);setSlot(s.k,s.m,pick.id);
  }
  save();renderAll();toast(`Aggiunti ${empty.length} pasti`);
}
function weekName(o){return o===0?"Questa settimana":o===1?"Prossima settimana":o===-1?"Settimana scorsa":(o>0?`Tra ${o} settimane`:`${-o} settimane fa`)}
function cloneWeek(fromOff){
  const src=addDays(thisMonday,fromOff*7);let n=0;
  weekKeys().forEach((k,i)=>{const sk=key(addDays(src,i));["pranzo","cena"].forEach(m=>{
    if(outNote(slot(k,m))!==null)return; // i pasti fuori casa di questa settimana restano
    const id=rid((S.plan[sk]||{})[m]);if((slot(k,m)||null)!==(id||null))setSlot(k,m,id||null);if(id)n++})});
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
    <h3 class="shh">Altro</h3><div class="choice"><button data-a="clear"><b>Svuota la settimana</b><span>Toglie tutti i pasti, anche quelli fuori casa.</span></button></div>`);
  $("#sheetBody").onclick=e=>{const cl=e.target.closest("[data-clone]");if(cl){closeSheet();cloneWeek(+cl.dataset.clone);return}
    const b=e.target.closest("[data-a]");if(!b)return;closeSheet();
    if(b.dataset.a==="clear"){weekKeys().forEach(k=>["pranzo","cena"].forEach(m=>{if(slot(k,m))setSlot(k,m,null)}));renderAll();toast("Settimana svuotata")}
    else autofill(b.dataset.a==="all")};
});

/* ---------- Foglio in basso ---------- */
function openSheet(title,html){$("#sheetTitle").innerHTML=title;$("#sheetBody").innerHTML=html;$("#sheetBody").onclick=null;$("#sheetBody").onchange=null;$("#sheetBody").oninput=null;$("#sheet").classList.add("open");$("#scrim").classList.add("open");$("#sheetBody").scrollTop=0}
function closeSheet(){$("#sheet").classList.remove("open");$("#scrim").classList.remove("open")}
$("#scrim").onclick=closeSheet;$("#closeSheet").onclick=closeSheet;
const slotLabel=(k,m)=>{const d=new Date(k+"T12:00");return `${DAYS[(d.getDay()+6)%7]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${m}`};
function filtersHtml(active){return [null,...PROT].map(t=>`<button data-f="${t||""}" aria-pressed="${(t||null)===active}">${t?PNAME[t]:"Tutte"}</button>`).join("")}
function cardHtml(r,cur,showBal,extra){const ok=!checkBalance(nutrition(r)).length;return `<button class="rcard${cur?" current":""}" data-id="${r.id}">${photoHtml(r)}<span class="rinfo"><span class="rname">${esc(r.n)}</span><span class="row" style="gap:6px">${catTag(r.t)}</span>${extra||""}</span>${showBal&&!ok?`<span class="warnico" title="Da rivedere" aria-label="Da rivedere"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20z" fill="currentColor"/><path d="M12 9v5" stroke="var(--surface)" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.4" fill="var(--surface)"/></svg></span>`:""}</button>`}

function openPicker(k,m,f){
  const cur=rid(slot(k,m)),c=counts();
  if(cur&&byId[cur].t)c[byId[cur].t]--; // il pasto che sto sostituendo non conta
  const miss=PROT.filter(p=>S.goals[p].min&&c[p]<S.goals[p].min);
  // ricette che condividono ingredienti con la cena di ieri (per il pranzo) o col pranzo di domani (per la cena)
  const nextLunch=()=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),1))]||{}).pranzo;return typeof v==="string"?byId[v]:null};
  const partner=m==="pranzo"?prevDinner(k):nextLunch(),pl=m==="pranzo"?"la cena di ieri":"il pranzo di domani";
  const sh=Object.fromEntries(R.map(r=>[r.id,shared(r,partner)]));
  const list=R.filter(r=>!f||r.t===f).sort((a,b)=>(miss.includes(b.t))-(miss.includes(a.t))||sh[b.id].length-sh[a.id].length);
  openSheet(`Scegli la ricetta<small>${slotLabel(k,m)}</small>`,
    `<button class="rcard outcard" data-out>${outPh()}<span class="rinfo"><span class="rname">Pasto fuori casa</span><span class="meta">Ristorante, da amici, salto il pasto… non conta per obiettivi e spesa</span></span></button>`+
    (miss.length&&!f?`<div class="hint">Questa settimana manca ancora: ${miss.map(p=>`${PSING[p]} (${S.goals[p].min-c[p]})`).join(", ")}</div>`:"")+
    `<div class="filters">${filtersHtml(f||null)}</div><div class="pick">${list.map(r=>cardHtml(r,r.id===cur,false,sh[r.id].length?`<span class="link">${LINK_ICO}${esc(sh[r.id].slice(0,3).join(", ").toLowerCase())} come ${pl}</span>`:"")).join("")}</div>`);
  $("#sheetBody").onclick=e=>{
    if(e.target.closest("[data-out]")){openOut(k,m);return}
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
function recipeHtml(r){return photoHtml(r,"hero")+`<div class="row" style="justify-content:space-between;margin-bottom:4px"><span class="row">${catTag(r.t)}<span style="color:var(--muted);font-size:13px">${SERV_LBL}</span></span>
  <label class="btn ghost filebtn" style="padding:6px 12px;font-size:13px">${S.photos[r.id]?"Cambia foto":"Aggiungi foto"}<input type="file" accept="image/*" data-photo="${r.id}"></label></div>
  ${nutHtml(nutrition(r))}
  <ul class="ing">${r.i.map(x=>`<li><span>${esc(x[0])}</span><span>${fmtQty(x[1],x[2])}</span></li>`).join("")}</ul>
  <ol class="steps">${r.s.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`}
function bindPhoto(after){$("#sheetBody").onchange=e=>{const inp=e.target.closest("[data-photo]");if(!inp||!inp.files[0])return;
  const id=inp.dataset.photo,fr=new FileReader();
  fr.onload=()=>{const img=new Image();img.onload=()=>{const W=960,H=600,cv=document.createElement("canvas");cv.width=W;cv.height=H;const sc=Math.max(W/img.width,H/img.height);
    cv.getContext("2d").drawImage(img,(W-img.width*sc)/2,(H-img.height*sc)/2,img.width*sc,img.height*sc);
    toast("Carico la foto…");
    cv.toBlob(async b=>{try{const rec=await uploadPhoto(id,b);S.photos[id]=pb.files.getURL(rec,rec.image);save();renderAll();after();toast("Foto salvata")}
      catch(err){toast(err.status?"Foto non salvata":"Serve la connessione per caricare la foto")}},"image/jpeg",0.8)};img.src=fr.result};
  fr.readAsDataURL(inp.files[0])}}
async function uploadPhoto(recipe,blob){const fd=new FormData();fd.append("recipe",recipe);fd.append("image",blob,recipe+".jpg");
  // le foto caricate prima che le ricette fossero nel database hanno un id diverso da ID.photos: cerco per ricetta
  let cur=null;try{cur=await pb.collection("photos").getFirstListItem(pb.filter("recipe={:r}",{r:recipe}))}catch(err){if(err.status!==404)throw err}
  if(cur)return await pb.collection("photos").update(cur.id,fd);
  fd.append("id",ID.photos(recipe));return await pb.collection("photos").create(fd)}
function openDetail(k,m){
  const r=byId[rid(slot(k,m))];
  const nl=(()=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),1))]||{}).pranzo;return typeof v==="string"?byId[v]:null})();
  const p=m==="pranzo"?prevDinner(k):nl,sh=shared(r,p);
  const linkBox=sh.length?`<div class="linkbox">${LINK_ICO}<span>Si prepara insieme ${m==="pranzo"?"alla cena di ieri":"al pranzo di domani"}, <b>${esc(p.n)}</b>: in comune ${esc(sh.join(", ").toLowerCase())}.</span></div>`:"";
  openSheet(`${esc(r.n)}<small>${slotLabel(k,m)}</small>`,linkBox+recipeHtml(r)+`<div class="row"><button class="btn" data-a="change">Cambia ricetta</button><button class="btn ghost" data-a="out">Fuori casa</button><button class="btn ghost" data-a="remove">Togli</button><button class="btn ghost" data-a="edit">Modifica ricetta</button></div>`);
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-ranges]")){openRanges(()=>openDetail(k,m));return}
    const b=e.target.closest("[data-a]");if(!b)return;
    if(b.dataset.a==="change")openPicker(k,m);else if(b.dataset.a==="out")openOut(k,m);else if(b.dataset.a==="edit")openEditor(r.id,()=>openDetail(k,m));
    else{setSlot(k,m,null);closeSheet();renderAll();toast("Pasto tolto")}};
  bindPhoto(()=>openDetail(k,m));
}
function openRecipe(id){const r=byId[id];
  openSheet(esc(r.n),(r.archived?`<p class="hint">Ricetta eliminata: resta solo nei pasti già pianificati. Salvandola dall'editor torna tra le ricette.</p>`:"")+recipeHtml(r)+
    `<div class="row"><button class="btn" data-edit>Modifica</button>${r.archived?"":`<button class="btn ghost" data-delete>Elimina</button>`}</div><div id="delBox"></div>`);
  bindPhoto(()=>openRecipe(id));
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-ranges]")){openRanges(()=>openRecipe(id));return}
    if(e.target.closest("[data-edit]")){openEditor(id,()=>openRecipe(id));return}
    if(e.target.closest("[data-delete]")){$("#delBox").innerHTML=`<div class="confirm"><p>Eliminare <b>${esc(r.n)}</b>? Non comparirà più tra le ricette né nel riempimento automatico; i pasti già pianificati la mostrano ancora.</p>
      <div class="row"><button class="btn danger" data-confirm>Elimina</button><button class="btn ghost" data-nodel>Annulla</button></div></div>`;$("#delBox").scrollIntoView({block:"nearest",behavior:"smooth"});return}
    if(e.target.closest("[data-nodel]")){$("#delBox").innerHTML="";return}
    if(e.target.closest("[data-confirm]")){S.recipes[id].archived=true;queue("recipes",id,{archived:true});rebuildRecipes();save();closeSheet();renderAll();toast("Ricetta eliminata")}}}

/* ---------- Editor delle ricette ---------- */
const UNITS=["g","ml","pz","spicchio","mazzo","rametto","costa","cucchiaio","cucchiai","fette","busta"];
const NUTF=[["c","Carboidrati"],["p","Proteine"],["f","Grassi"],["fib","Fibre"]];
const num=x=>String(+x||0).replace(".",",");
const randId=()=>{const a="abcdefghijklmnopqrstuvwxyz0123456789";return Array.from(crypto.getRandomValues(new Uint8Array(15)),x=>a[x%36]).join("")};
// nome come sta nel catalogo (ignoro maiuscole e spazi doppi), così "cipolla" usa "Cipolla"
const canon=n=>{n=String(n).trim().replace(/\s+/g," ");const k=n.toLowerCase();return Object.keys(ING).find(x=>x.toLowerCase()===k)||n};
const INGF=["dept","prot","c","p","f","fib","unit_g"];
// reparto, fonte proteica, valori per 100 g e peso di un'unità; a = attributi in più sugli input (es. la riga dell'editor)
function ingFieldsHtml(v,a){a=a||"";
  const num=(k,l,ph,cls)=>`<label${cls?` class="${cls}"`:""}><span>${l}</span><input class="txt" type="number" inputmode="decimal" min="0" step="any" ${a} data-v="${k}" value="${v[k]||""}" placeholder="${ph||0}"></label>`;
  return `<label><span>Reparto</span><select class="txt" ${a} data-v="dept">${CATS.map(c=>`<option${c===v.dept?" selected":""}>${c}</option>`).join("")}</select></label>
    <label><span>Fonte proteica</span><select class="txt" ${a} data-v="prot"><option value="">Nessuna</option>${PROT.map(p=>`<option value="${p}"${p===v.prot?" selected":""}>${PNAME[p]}</option>`).join("")}</select></label>
    ${NUTF.map(([k,l])=>num(k,l+" (g)")).join("")}${num("unit_g","Peso di 1 unità in grammi (pz, mazzo, spicchio…)","—","wide")}`}
const ingData=(name,v)=>({name,dept:v.dept||"Dispensa",prot:PROT.includes(v.prot)?v.prot:"",c:+v.c||0,p:+v.p||0,f:+v.f||0,fib:+v.fib||0,unit_g:+v.unit_g||0});
const sameIng=(a,b)=>a&&b&&a.name===b.name&&INGF.every(k=>(a[k]||0)===(b[k]||0));
// id deterministico dal nome; se è già preso (ingrediente rinominato) ne uso uno casuale
const newIngId=n=>{const id=ID.ingredients(n);return S.ingr[id]?randId():id};
const usesOf=n=>Object.keys(S.recipes).filter(id=>(S.recipes[id].ingredients||[]).some(x=>x[0]===n)).map(id=>byId[id]);
// dopo un cambio al catalogo: le ricette che usano quegli ingredienti tengono aggiornata la copia della categoria sul server
function syncCats(names){for(const n of names)for(const r of usesOf(n)){const cat=r.t||"";
  if((S.recipes[r.id].cat||"")!==cat){S.recipes[r.id].cat=cat;queue("recipes",r.id,{cat})}}}
function openEditor(id,back){
  const r=id?byId[id]:null;
  const d={n:r?r.n:"",oil:r?r.oil:25,s:r?r.s.join("\n"):"",open:-1,
    rows:r?r.i.map(([n,q,u])=>({n,q:String(q),u})):[{n:"",q:"",u:"g"}],
    ing:{}}; // valori degli ingredienti nuovi o modificati qui, per nome; finiscono nel catalogo al salvataggio
  const vals=n=>d.ing[n]||ING[n]||null;
  const valid=()=>d.rows.filter(x=>x.n.trim()&&+x.q>0);
  const info=x=>{const n=canon(x.n);if(!n)return["",""];const v=vals(n);
    if(!v)return["warn","Nuovo ingrediente: tocca qui per reparto e valori"];
    if(!(x.u==="g"||x.u==="ml")&&!v.unit_g)return["warn",`Quanto pesa 1 ${x.u}? Tocca qui`];
    return["",`${v.dept}${v.prot?" · fonte proteica: "+PSING[v.prot]:""} · per 100 g: carb ${num(v.c)} · prot ${num(v.p)} · grassi ${num(v.f)} · fibre ${num(v.fib)}`]};
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
    const cat=recipeCat(rows.map(x=>[canon(x.n),+x.q,x.u]),vals),from=[...new Set(rows.map(x=>canon(x.n)).filter(n=>(vals(n)||{}).prot===cat))];
    $("#edCat").innerHTML=cat?`<span class="row">${tagHtml(cat)}<small class="muted">da ${esc(from.join(", ").toLowerCase())}</small></span>`
      :`<p class="catwarn">Nessun ingrediente è una fonte proteica: la ricetta non conterà per gli obiettivi e il riempimento automatico non la userà. Per indicarla, tocca la riga sotto l'ingrediente principale.</p>`;
    $("#edNut").innerHTML=rows.length?nutHtml(nutrition({oil:+d.oil||0,i:rows.map(x=>[canon(x.n),+x.q,x.u])},vals),true)
      :`<p class="shopnote">Aggiungi gli ingredienti con le quantità: qui vedrai se il pasto è bilanciato.</p>`;
    document.querySelectorAll("#sheetBody .einfo").forEach((b,i)=>{const [cls,txt]=info(d.rows[i]);b.className="einfo "+cls;b.textContent=txt;b.hidden=!txt})};
  const draw=()=>{
    $("#sheetBody").innerHTML=`<div class="editor">
      <label class="ef"><span>Nome</span><input class="txt" id="edName" value="${esc(d.n)}" placeholder="Es. Pasta e ceci" autocomplete="off"></label>
      <div class="ef"><span>Fonte proteica <small>dagli ingredienti</small></span><div id="edCat"></div></div>
      <div class="ef"><span>Ingredienti <small>${SERV_LBL}</small></span><div class="erows">${d.rows.map(rowHtml).join("")}</div>
        <button class="btn ghost" data-add>＋ Ingrediente</button></div>
      <label class="ef"><span>Olio per tutta la ricetta, in grammi <small>circa 10 g a testa</small></span><input class="txt" id="edOil" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.oil)}"></label>
      <div id="edNut"></div>
      <label class="ef"><span>Procedimento <small>un passaggio per riga</small></span><textarea class="txt" id="edSteps" rows="5">${esc(d.s)}</textarea></label>
      <p class="hint" id="edErr" hidden></p>
      <div class="row"><button class="btn" data-save>Salva</button><button class="btn ghost" data-cancel>Annulla</button></div>
      <datalist id="ingList">${Object.keys(ING).sort((a,b)=>a.localeCompare(b,"it")).map(n=>`<option value="${esc(n)}">`).join("")}</datalist></div>`;
    refresh()};
  const fail=msg=>{const el=$("#edErr");el.textContent=msg;el.hidden=false;el.scrollIntoView({block:"center",behavior:"smooth"})};
  const doSave=()=>{
    const name=d.n.trim(),rows=d.rows.filter(x=>x.n.trim()||x.q);
    if(!name)return fail("Manca il nome della ricetta.");
    if(!rows.length)return fail("Aggiungi almeno un ingrediente.");
    if(rows.some(x=>!x.n.trim()||!(+x.q>0)))return fail("Ogni ingrediente ha bisogno di nome e quantità.");
    const fresh=[...new Set(rows.map(x=>canon(x.n)))].filter(n=>!vals(n));
    if(fresh.length)return fail(`Inserisci reparto e valori di: ${fresh.join(", ")} (tocca la riga arancione sotto l'ingrediente).`);
    // catalogo: ingredienti nuovi o con valori cambiati
    const touched=[];
    for(const n of new Set(rows.map(x=>canon(x.n)))){const v=d.ing[n];if(!v)continue;const old=ING[n],data=ingData(n,v);
      if(sameIng(old,data))continue;
      const iid=old?old.id:newIngId(n);S.ingr[iid]=data;queue("ingredients",iid,data);touched.push(n)}
    const nid=r?r.id:randId(),ingr=rows.map(x=>[canon(x.n),+x.q,x.u]);
    const data={name,cat:recipeCat(ingr,vals)||"",ingredients:ingr,steps:d.s.split("\n").map(x=>x.trim()).filter(Boolean),oil:+d.oil||0,archived:false};
    S.recipes[nid]=Object.assign(S.recipes[nid]||{vis:null},data);queue("recipes",nid,data);
    rebuildRecipes();syncCats(touched);save();renderAll();toast(r?"Ricetta salvata":"Ricetta aggiunta");openRecipe(nid)};
  openSheet(r?`Modifica ricetta<small>${esc(r.n)}</small>`:"Nuova ricetta","");draw();
  const body=$("#sheetBody");
  body.oninput=e=>{const t=e.target,i=+t.dataset.i;
    if(t.id==="edName")d.n=t.value;else if(t.id==="edOil")d.oil=t.value;else if(t.id==="edSteps")d.s=t.value;
    else if(t.dataset.f)d.rows[i][t.dataset.f]=t.value;
    else if(t.dataset.v){const n=canon(d.rows[i].n);d.ing[n][t.dataset.v]=t.value}
    refresh()};
  // finito di scrivere il nome: lo allineo al catalogo e, se i valori sono aperti, li ridisegno per il nuovo nome
  body.onchange=e=>{const t=e.target;if(t.dataset.f!=="n")return;const i=+t.dataset.i;d.rows[i].n=canon(t.value);t.value=d.rows[i].n;
    if(d.open===i){const n=d.rows[i].n;if(n&&!d.ing[n])d.ing[n]={...(ING[n]||{dept:"Dispensa"})};draw()}else refresh()};
  body.onclick=e=>{const b=e.target.closest("button");if(!b)return;
    if("add" in b.dataset){d.rows.push({n:"",q:"",u:"g"});draw();body.querySelector(`[data-i="${d.rows.length-1}"][data-f="n"]`).focus()}
    else if(b.dataset.del){const i=+b.dataset.del;d.rows.splice(i,1);if(!d.rows.length)d.rows.push({n:"",q:"",u:"g"});d.open=d.open===i?-1:d.open>i?d.open-1:d.open;draw()}
    else if(b.dataset.open){const i=+b.dataset.open,n=canon(d.rows[i].n);d.open=d.open===i?-1:i;if(d.open===i&&!d.ing[n])d.ing[n]={...(ING[n]||{dept:"Dispensa"})};draw()}
    else if("save" in b.dataset)doSave();
    else if("cancel" in b.dataset){if(back)back();else closeSheet()}};
}

/* ---------- Catalogo degli ingredienti ---------- */
let ingQuery="";
function renderIng(){
  const q=ingQuery.trim().toLowerCase(),all=Object.keys(S.ingr).map(id=>({id,...S.ingr[id]}));
  const list=all.filter(x=>!q||x.name.toLowerCase().includes(q));
  const nUses=Object.fromEntries(all.map(x=>[x.name,usesOf(x.name).length]));
  $("#ingCat").innerHTML=!all.length?`<p class="empty-note">Nessun ingrediente.<br>Aggiungilo con «Nuovo».</p>`:!list.length?`<p class="empty-note">Nessun ingrediente con «${esc(ingQuery.trim())}».</p>`:
    CATS.map(c=>{const its=list.filter(x=>(x.dept||"Dispensa")===c).sort((a,b)=>a.name.localeCompare(b.name,"it"));if(!its.length)return"";
      return `<div class="cat"><h3>${c}</h3><div class="items">${its.map(x=>`<button class="item" data-ing="${x.id}"><span class="iname"><b>${esc(x.name)}</b>
        <small>${nUses[x.name]?`in ${nUses[x.name]} ${nUses[x.name]===1?"ricetta":"ricette"}`:"non usato"} · ${Math.round((x.c||0)*4+(x.p||0)*4+(x.f||0)*9)} kcal per 100 g</small></span>${tagHtml(x.prot)}</button>`).join("")}</div></div>`}).join("");
}
function openIngredient(id){
  const old=id?S.ingr[id]:null,v=old?{...old}:{name:ingQuery.trim(),dept:"Dispensa",prot:""};
  const uses=old?usesOf(old.name):[];
  openSheet(old?`Ingrediente<small>${esc(old.name)}</small>`:"Nuovo ingrediente",`<div class="editor">
    <label class="ef"><span>Nome</span><input class="txt" id="igName" value="${esc(v.name)}" placeholder="Es. Ceci cotti" autocomplete="off"></label>
    <div class="evals iform"><p>Valori per 100 g, come sull'etichetta. Se è una fonte proteica, le ricette che lo usano prendono la sua categoria.</p>${ingFieldsHtml(v)}</div>
    ${uses.length?`<div class="ef"><span>Usato in ${uses.length} ${uses.length===1?"ricetta":"ricette"} <small>i cambiamenti valgono per tutte</small></span>
      <ul class="uses">${uses.map(r=>`<li>${esc(r.n)}${r.archived?" <small>(eliminata)</small>":""}</li>`).join("")}</ul></div>`:""}
    <p class="hint" id="igErr" hidden></p>
    <div class="row"><button class="btn" data-save>Salva</button><button class="btn ghost" data-cancel>Annulla</button>${old&&!uses.length?`<button class="btn ghost" data-delete>Elimina</button>`:""}</div>
    ${old&&uses.length?`<p class="shopnote" style="margin:0">Non si può eliminare finché è usato in una ricetta: prima toglilo da ${uses.length===1?"quella ricetta":"quelle ricette"}.</p>`:""}
    <div id="delBox"></div></div>`);
  if(!old)setTimeout(()=>$("#igName").focus(),260);
  const fail=msg=>{const el=$("#igErr");el.textContent=msg;el.hidden=false;el.scrollIntoView({block:"center",behavior:"smooth"})};
  const body=$("#sheetBody");
  body.oninput=e=>{const t=e.target;if(t.id==="igName")v.name=t.value;else if(t.dataset.v)v[t.dataset.v]=t.value};
  body.onclick=e=>{const b=e.target.closest("button");if(!b)return;
    if("cancel" in b.dataset)closeSheet();
    else if("delete" in b.dataset){$("#delBox").innerHTML=`<div class="confirm"><p>Eliminare <b>${esc(old.name)}</b> dal catalogo?</p>
      <div class="row"><button class="btn danger" data-confirm>Elimina</button><button class="btn ghost" data-nodel>Annulla</button></div></div>`;$("#delBox").scrollIntoView({block:"nearest",behavior:"smooth"})}
    else if("nodel" in b.dataset)$("#delBox").innerHTML="";
    else if("confirm" in b.dataset){if(usesOf(old.name).length)return fail("Nel frattempo è stato usato in una ricetta: non si può eliminare.");
      delete S.ingr[id];queue("ingredients",id,null,true);rebuildRecipes();save();closeSheet();renderAll();toast("Ingrediente eliminato")}
    else if("save" in b.dataset){
      const name=v.name.trim().replace(/\s+/g," ");if(!name)return fail("Manca il nome dell'ingrediente.");
      const dup=Object.keys(S.ingr).find(x=>x!==id&&S.ingr[x].name.toLowerCase()===name.toLowerCase());
      if(dup)return fail(`C'è già «${S.ingr[dup].name}» nel catalogo.`);
      const data=ingData(name,v);
      if(sameIng(old,data)){closeSheet();return}
      const iid=old?id:newIngId(name);S.ingr[iid]=data;queue("ingredients",iid,data);
      // nome cambiato: lo cambio anche nelle ricette che lo usano
      if(old&&old.name!==name)for(const r of uses){const ingredients=S.recipes[r.id].ingredients.map(x=>x[0]===old.name?[name,...x.slice(1)]:x);
        S.recipes[r.id].ingredients=ingredients;queue("recipes",r.id,{ingredients})}
      rebuildRecipes();syncCats([name]);save();closeSheet();renderAll();
      toast(old?(uses.length?`Ingrediente salvato, ${uses.length} ${uses.length===1?"ricetta aggiornata":"ricette aggiornate"}`:"Ingrediente salvato"):"Ingrediente aggiunto")}};
}
$("#ingCat").addEventListener("click",e=>{const b=e.target.closest("[data-ing]");if(b)openIngredient(b.dataset.ing)});
$("#newIng").addEventListener("click",()=>openIngredient(null));
$("#ingSearch").addEventListener("input",e=>{ingQuery=e.target.value;renderIng()});

/* ---------- Spesa ---------- */
function shoppingList(){
  const map=new Map();
  weekKeys().forEach(k=>["pranzo","cena"].forEach(m=>{const id=rid(slot(k,m));if(!id)return;const r=byId[id];
    r.i.forEach(([n,q,u,c])=>{const kk=n+"|"+u;const e=map.get(kk)||{n,u,c,q:0,from:new Set()};e.q+=q;e.from.add(r.n);map.set(kk,e)})}));
  return[...map.values()];
}
const wk=()=>key(weekStart());
// quanto ho già a casa, per settimana
const haveOf=()=>(S.have[wk()]=S.have[wk()]||{});
const stepOf=(u,q)=>(u==="g"||u==="ml")?(q>=1000?100:50):1;
const r1=x=>Math.round(x*10)/10;
let shopItems={};
function renderShop(){
  const items=shoppingList(),checks=S.checks[wk()]||{},have=S.have[wk()]||{},casa=S.shopMode==="casa";
  items.forEach(i=>{i.id=i.n+"|"+i.u;i.have=Math.min(have[i.id]||0,i.q);i.buy=r1(i.q-i.have)});
  shopItems=Object.fromEntries(items.map(i=>[i.id,i]));
  const toBuy=items.filter(i=>i.buy>0),atHome=items.filter(i=>i.buy<=0);
  const done=toBuy.filter(i=>checks[i.id]).length;
  document.querySelectorAll("#shopMode button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.mode===S.shopMode));
  $("#shopSummary").textContent=!items.length?"":casa?`${toBuy.length} da comprare · ${atHome.length} già in casa`:`${toBuy.length} da comprare · ${done} presi`;
  $("#resetChecks").hidden=casa||!done;
  $("#prog").parentNode.hidden=casa;
  $("#prog").style.width=toBuy.length?(done/toBuy.length*100)+"%":"0";
  if(!items.length){$("#shop").innerHTML=`<p class="empty-note">Nessun pasto in questa settimana.<br>Aggiungi qualche ricetta e la lista si compone da sola.</p>`;return}
  const byCat=(list,fn)=>CATS.map(c=>{const its=list.filter(i=>i.c===c).sort((a,b)=>a.n.localeCompare(b.n,"it"));if(!its.length)return"";
    return `<div class="cat"><h3>${c}</h3><div class="items">${fn(its)}</div></div>`}).join("");
  if(casa){
    // controllo dispensa: − e + regolano direttamente quanto comprare
    $("#shop").innerHTML=`<p class="shopnote">Con − togli quello che hai già. Tocca il nome se ce l'hai tutto.</p>`+
     byCat(items,its=>its.map(i=>{const home=i.buy<=0;return `<div class="item${home?" home":""}">
       <button class="rowtap" data-home="${esc(i.id)}"><span class="iname"><b>${esc(i.n)}</b><small>${i.have>0?`serve ${fmtQty(i.q,i.u)} · a casa ${fmtQty(i.have,i.u)}`:`serve ${fmtQty(i.q,i.u)}`}</small></span></button>
       <div class="qstep"><button data-dec="${esc(i.id)}" aria-label="Compra meno ${esc(i.n)}" ${home?"disabled":""}>−</button><span class="qv">${home?"a casa":fmtQty(i.buy,i.u)}</span><button data-inc="${esc(i.id)}" aria-label="Compra più ${esc(i.n)}" ${i.have<=0?"disabled":""}>+</button></div></div>`}).join(""));
  }else{
    $("#shop").innerHTML=byCat(toBuy,its=>{its.sort((a,b)=>(!!checks[a.id])-(!!checks[b.id]));return its.map(i=>{const ok=!!checks[i.id];
       return `<div class="item${ok?" done":""}"><button class="rowtap" data-check="${esc(i.id)}"><span class="box">${ok?"✓":""}</span><span class="iname"><b>${esc(i.n)}</b><small>${esc([...i.from].join(", "))}</small></span><span class="qty">${fmtQty(i.buy,i.u)}</span></button></div>`}).join("")})+
     (atHome.length?`<p class="shopnote">Già in casa: ${esc(atHome.map(i=>i.n).sort((a,b)=>a.localeCompare(b,"it")).join(", "))}</p>`:"");
  }
}
function setHave(id,v){const it=shopItems[id];if(!it)return;const x=Math.max(0,Math.min(it.q,r1(v)));const H=haveOf();if(x)H[id]=x;else delete H[id];save();queueShop(wk(),"have");renderShop()}
$("#shop").addEventListener("click",e=>{
  const dec=e.target.closest("[data-dec]");if(dec){const it=shopItems[dec.dataset.dec];setHave(it.id,it.have+stepOf(it.u,it.q));return}
  const inc=e.target.closest("[data-inc]");if(inc){const it=shopItems[inc.dataset.inc];setHave(it.id,it.have-stepOf(it.u,it.q));return}
  const h=e.target.closest("[data-home]");if(h){const it=shopItems[h.dataset.home];setHave(it.id,it.buy>0?it.q:0);return}
  const b=e.target.closest("[data-check]");if(!b)return;const w=wk();S.checks[w]=S.checks[w]||{};const id=b.dataset.check;S.checks[w][id]=!S.checks[w][id];save();queueShop(w,"checks");renderShop()});
$("#resetChecks").onclick=()=>{S.checks[wk()]={};save();queueShop(wk(),"checks");renderShop();toast("Spunte azzerate")};
$("#shopMode").addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(!b)return;S.shopMode=b.dataset.mode;save();renderShop();window.scrollTo(0,0)});

/* ---------- Ricette ---------- */
let recMode="rec"; // ricette o catalogo degli ingredienti
function renderRec(){
  document.querySelectorAll("#recMode button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.mode===recMode));
  $("#recPane").hidden=recMode!=="rec";$("#ingPane").hidden=recMode!=="ing";renderIng();
  $("#recFilters").innerHTML=filtersHtml(recFilter);
  const list=R.filter(r=>!recFilter||r.t===recFilter);
  $("#recList").innerHTML=list.length?list.map(r=>cardHtml(r,false,true)).join(""):`<p class="empty-note">Nessuna ricetta${recFilter?` di ${PSING[recFilter]}`:""}.<br>Aggiungila con «Nuova ricetta».</p>`;
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
