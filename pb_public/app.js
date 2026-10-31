(function(){
/* ---------- Categorie proteiche ---------- */
// i legumi sono divisi in tre: nelle tessere in alto stanno sulla prima riga
const PROT = ["lenticchie","fagioli","ceci","pesce","carne","uova","latticini"];
const PNAME = {lenticchie:"Lenticchie",fagioli:"Fagioli",ceci:"Ceci",pesce:"Pesce",carne:"Carne",uova:"Uova",latticini:"Latticini"};
const PSING = {lenticchie:"lenticchie",fagioli:"fagioli",ceci:"ceci",pesce:"pesce",carne:"carne",uova:"uova",latticini:"latticini"};
const CATS = ["Frutta e verdura","Pesce","Carne","Latticini e uova","Pane e pasta","Dispensa"];

/* ---------- Ricette di esempio (porzioni per 2) ----------
   v = illustrazione: b = base del piatto, c = colore base, x = elementi [forma, colore, quantità, grandezza] */
const R = [
 {id:"ricotta",n:"Pasta pomodoro e ricotta",t:"latticini",v:{b:"spaghetti",c:"#e8a33a",x:[["dot","#fbf7ee",5,9],["leaf","#3f8f3a",4,6]]},i:[["Spaghetti",160,"g","Pane e pasta"],["Passata di pomodoro",400,"g","Dispensa"],["Ricotta",150,"g","Latticini e uova"],["Basilico",1,"mazzo","Frutta e verdura"],["Aglio",1,"spicchio","Frutta e verdura"]],s:["Soffriggi l'aglio nell'olio.","Aggiungi la passata e cuoci 15 minuti.","Scola la pasta, condisci e aggiungi la ricotta a cucchiaiate."]},
 {id:"ceci",n:"Pasta e ceci",t:"ceci",v:{b:"soup",c:"#d8b36a",x:[["dot","#e9cf8f",14,5],["short","#f1d58c",8,6],["leaf","#4f7d3a",2,5]]},i:[["Ceci cotti",400,"g","Dispensa"],["Ditalini",140,"g","Pane e pasta"],["Rosmarino",1,"rametto","Frutta e verdura"],["Aglio",1,"spicchio","Frutta e verdura"],["Passata di pomodoro",100,"g","Dispensa"]],s:["Insaporisci aglio e rosmarino nell'olio.","Aggiungi ceci, passata e acqua; frulla metà dei ceci.","Cuoci la pasta direttamente nel brodo."]},
 {id:"salmone",n:"Salmone al forno con patate",t:"pesce",v:{b:"none",x:[["fillet","#f2875a",1,30],["wedge","#e9c26a",6,9],["leaf","#4f7d3a",3,5],["dot","#f4e36b",1,8]]},i:[["Filetti di salmone",2,"pz","Pesce"],["Patate",400,"g","Frutta e verdura"],["Limone",1,"pz","Frutta e verdura"],["Rosmarino",1,"rametto","Frutta e verdura"]],s:["Taglia le patate a spicchi e inforna 20 minuti a 200°.","Aggiungi il salmone con limone e rosmarino.","Cuoci altri 12–15 minuti."]},
 {id:"orata",n:"Orata al cartoccio",t:"pesce",v:{b:"none",x:[["fish","#b9c3c9",1,34],["dot","#e0443a",6,6],["dot","#3b3a2f",5,4],["leaf","#4f9a3a",4,5]]},i:[["Orata",2,"pz","Pesce"],["Pomodorini",200,"g","Frutta e verdura"],["Olive taggiasche",40,"g","Dispensa"],["Prezzemolo",1,"mazzo","Frutta e verdura"],["Limone",1,"pz","Frutta e verdura"]],s:["Metti l'orata su carta forno con pomodorini e olive.","Chiudi il cartoccio e cuoci 25 minuti a 190°."]},
 {id:"merluzzo",n:"Merluzzo con pomodorini e olive",t:"pesce",v:{b:"sauce",c:"#d9573f",x:[["fillet","#f4efe6",1,28],["dot","#e8463a",7,6],["dot","#2f2e25",6,4]]},i:[["Filetti di merluzzo",2,"pz","Pesce"],["Pomodorini",250,"g","Frutta e verdura"],["Olive taggiasche",40,"g","Dispensa"],["Capperi",1,"cucchiaio","Dispensa"]],s:["Appassisci i pomodorini in padella.","Aggiungi olive, capperi e il merluzzo.","Cuoci coperto 8–10 minuti."]},
 {id:"tonno",n:"Insalata di tonno e fagiolini",t:"pesce",v:{b:"none",x:[["stick","#5c9a3e",10,12],["dot","#c98b6b",8,6],["wedge","#efd9a0",4,8],["dot","#e8463a",4,5]]},i:[["Tonno sott'olio",160,"g","Dispensa"],["Fagiolini",300,"g","Frutta e verdura"],["Patate",250,"g","Frutta e verdura"],["Pomodorini",150,"g","Frutta e verdura"]],s:["Lessa fagiolini e patate.","Lascia intiepidire e unisci tonno e pomodorini.","Condisci con olio, sale e limone."]},
 {id:"lenticchie",n:"Lenticchie in umido con riso",t:"lenticchie",v:{b:"half",c:"#7a5233",x:[["dot","#5c3c24",16,4],["dot","#e8873a",4,4]]},i:[["Lenticchie secche",200,"g","Dispensa"],["Riso basmati",140,"g","Pane e pasta"],["Carota",1,"pz","Frutta e verdura"],["Sedano",1,"costa","Frutta e verdura"],["Cipolla",1,"pz","Frutta e verdura"],["Passata di pomodoro",100,"g","Dispensa"]],s:["Prepara un soffritto di carota, sedano e cipolla.","Aggiungi lenticchie, passata e acqua; cuoci 35 minuti.","Servi con il riso."]},
 {id:"fagioli",n:"Pasta e fagioli",t:"fagioli",v:{b:"soup",c:"#a4573b",x:[["bean","#c98a7a",9,7],["short","#e9c77a",6,6],["dot","#e8873a",3,4]]},i:[["Fagioli borlotti cotti",400,"g","Dispensa"],["Pasta mista",140,"g","Pane e pasta"],["Carota",1,"pz","Frutta e verdura"],["Sedano",1,"costa","Frutta e verdura"],["Cipolla",1,"pz","Frutta e verdura"]],s:["Soffriggi le verdure tritate.","Aggiungi i fagioli e copri d'acqua; cuoci 20 minuti.","Cuoci la pasta nel brodo."]},
 {id:"farro",n:"Insalata di farro, ceci e feta",t:"ceci",v:{b:"grain",c:"#b8925a",x:[["dot","#e3c27f",8,6],["cube","#f8f6ef",6,7],["dot","#e8463a",5,5],["dot","#8fbf6a",5,5]]},i:[["Farro",160,"g","Pane e pasta"],["Ceci cotti",240,"g","Dispensa"],["Feta",100,"g","Latticini e uova"],["Cetriolo",1,"pz","Frutta e verdura"],["Pomodorini",150,"g","Frutta e verdura"]],s:["Cuoci il farro e lascialo raffreddare.","Unisci ceci, verdure a cubetti e feta."]},
 {id:"pollo",n:"Pollo al limone con zucchine",t:"carne",v:{b:"none",x:[["fillet","#e2b47a",2,20],["round","#7dae55",8,7],["dot","#f4e36b",2,6]]},i:[["Petto di pollo",400,"g","Carne"],["Limone",1,"pz","Frutta e verdura"],["Zucchine",2,"pz","Frutta e verdura"],["Farina",2,"cucchiai","Dispensa"]],s:["Infarina il pollo a fettine e rosolalo.","Sfuma con il succo di limone.","Servi con zucchine saltate."]},
 {id:"polpette",n:"Polpette al sugo",t:"carne",v:{b:"sauce",c:"#c8402e",x:[["ball","#7a4a32",6,11],["leaf","#3f8f3a",3,5]]},i:[["Macinato di manzo",300,"g","Carne"],["Uova",1,"pz","Latticini e uova"],["Pane grattugiato",40,"g","Pane e pasta"],["Parmigiano",30,"g","Latticini e uova"],["Passata di pomodoro",400,"g","Dispensa"]],s:["Impasta carne, uovo, pane e parmigiano.","Forma le polpette e cuocile nel sugo 25 minuti."]},
 {id:"frittata",n:"Frittata di zucchine",t:"uova",v:{b:"disc",c:"#f0c548",x:[["round","#6fa04a",9,7],["dot","#e7b13a",6,4]]},i:[["Uova",4,"pz","Latticini e uova"],["Zucchine",2,"pz","Frutta e verdura"],["Parmigiano",30,"g","Latticini e uova"],["Cipolla",1,"pz","Frutta e verdura"]],s:["Rosola zucchine e cipolla.","Versa le uova sbattute col parmigiano.","Cuoci coperto e gira a metà cottura."]},
 {id:"purgatorio",n:"Uova in purgatorio",t:"uova",v:{b:"sauce",c:"#c8402e",x:[["egg","#ffffff",2,16],["leaf","#3f8f3a",4,5]]},i:[["Uova",4,"pz","Latticini e uova"],["Passata di pomodoro",400,"g","Dispensa"],["Pane casereccio",4,"fette","Pane e pasta"],["Basilico",1,"mazzo","Frutta e verdura"]],s:["Cuoci la passata 10 minuti in padella.","Rompi le uova nel sugo e copri.","Cuoci 6–8 minuti e servi col pane."]},
 {id:"risotto",n:"Risotto funghi e taleggio",t:"latticini",v:{b:"grain",c:"#e9dcb8",x:[["mush","#a0805e",6,10],["leaf","#4f7d3a",3,4]]},i:[["Riso Carnaroli",160,"g","Pane e pasta"],["Funghi champignon",250,"g","Frutta e verdura"],["Taleggio",80,"g","Latticini e uova"],["Cipolla",1,"pz","Frutta e verdura"],["Burro",20,"g","Latticini e uova"]],s:["Tosta il riso con la cipolla.","Aggiungi i funghi e porta a cottura col brodo.","Manteca con taleggio e burro."]},
 {id:"minestrone",n:"Minestrone con borlotti",t:"fagioli",v:{b:"soup",c:"#c9883e",x:[["cube","#e8873a",6,6],["cube","#7dae55",6,6],["bean","#b77a6a",5,6],["cube","#efd9a0",4,6]]},i:[["Patate",200,"g","Frutta e verdura"],["Carota",2,"pz","Frutta e verdura"],["Zucchine",1,"pz","Frutta e verdura"],["Sedano",1,"costa","Frutta e verdura"],["Fagioli borlotti cotti",200,"g","Dispensa"]],s:["Taglia tutte le verdure a cubetti.","Cuoci in acqua salata per 40 minuti.","Servi con un filo d'olio."]},
 {id:"caprese",n:"Piadina con caprese",t:"latticini",v:{b:"wrap",c:"#efd6a0",x:[["round","#ffffff",3,12],["round","#e0443a",3,11],["leaf","#3f8f3a",3,6]]},i:[["Piadine",2,"pz","Pane e pasta"],["Mozzarella",250,"g","Latticini e uova"],["Pomodori",2,"pz","Frutta e verdura"],["Basilico",1,"mazzo","Frutta e verdura"]],s:["Scalda le piadine in padella.","Farcisci con mozzarella, pomodoro e basilico."]},
 {id:"scaloppine",n:"Scaloppine al vino bianco",t:"carne",v:{b:"none",x:[["fillet","#c99a6a",3,17],["dot","#f1e2b8",8,4],["leaf","#4f9a3a",4,5]]},i:[["Fesa di vitello a fette",350,"g","Carne"],["Vino bianco",100,"ml","Dispensa"],["Farina",2,"cucchiai","Dispensa"],["Insalata mista",1,"busta","Frutta e verdura"]],s:["Infarina le fettine e rosolale nel burro.","Sfuma con il vino e fai restringere.","Servi con l'insalata."]}
];
/* Le ricette sopra sono scritte per 2: le porto a 2 adulti + 1 bambina (2,5 porzioni) */
const SERV=2.5,SERV_LBL="per 2 adulti e 1 bambina";
R.forEach(r=>{r.i=r.i.map(([n,q,u,c])=>{let x;
  if(u==="g"||u==="ml")x=q*1.25>=100?Math.round(q*1.25/10)*10:Math.round(q*1.25/5)*5;
  else x=q<=1?q:Math.ceil(q*1.25);
  return [n,x,u,c]})});
const byId = Object.fromEntries(R.map(r=>[r.id,r]));
// ingredienti in comune tra due ricette (escludo erbe e piccole cose che non cambiano il lavoro in cucina)
const MINOR=new Set(["Aglio","Basilico","Rosmarino","Prezzemolo","Limone","Farina","Capperi","Parmigiano","Burro","Vino bianco"]);
function shared(a,b){if(!a||!b||a.id===b.id)return[];const bn=new Set(b.i.map(x=>x[0]));return a.i.map(x=>x[0]).filter(n=>!MINOR.has(n)&&bn.has(n))}
const LINK_ICO=`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>`;
const prevDinner=k=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),-1))]||{}).cena;return typeof v==="string"?byId[v]:null};

/* ---------- Valori nutrizionali indicativi per 100 g: [carboidrati, proteine, grassi, fibre] ---------- */
const NUT={"Spaghetti":[71,13,1.5,3],"Ditalini":[71,13,1.5,3],"Pasta mista":[71,13,1.5,3],"Passata di pomodoro":[4.5,1.3,.2,1.2],"Ricotta":[3.5,9,10,0],
 "Basilico":[2,3,.6,1.6],"Aglio":[33,6,.5,2],"Ceci cotti":[17,7,2.5,6],"Rosmarino":[20,3,6,14],"Filetti di salmone":[0,20,13,0],"Patate":[17,2,.1,2.2],
 "Limone":[9,1.1,.3,2.8],"Orata":[0,20,4,0],"Pomodorini":[3.9,.9,.2,1.2],"Olive taggiasche":[1,1,15,3],"Prezzemolo":[6,3,.8,3.3],"Filetti di merluzzo":[0,18,.7,0],
 "Capperi":[5,2,.9,3],"Tonno sott'olio":[0,25,8,0],"Fagiolini":[7,1.8,.1,2.7],"Lenticchie secche":[50,24,1,14],"Riso basmati":[78,7,.6,1],"Carota":[10,.9,.2,2.8],
 "Sedano":[3,.7,.2,1.6],"Cipolla":[9,1.1,.1,1.7],"Fagioli borlotti cotti":[14,7,.5,6],"Farro":[67,15,2.5,7],"Feta":[1.5,14,21,0],"Cetriolo":[3.6,.7,.1,.5],
 "Petto di pollo":[0,23,1.5,0],"Zucchine":[3,1.2,.3,1],"Farina":[76,10,1,2.7],"Macinato di manzo":[0,20,15,0],"Uova":[.7,13,10,0],"Pane grattugiato":[72,13,5,4],
 "Parmigiano":[0,33,28,0],"Pane casereccio":[50,8.5,1.5,3],"Taleggio":[0,19,26,0],"Riso Carnaroli":[79,7,.6,1],"Funghi champignon":[3.3,3,.3,1],"Burro":[0,1,83,0],
 "Piadine":[50,8,12,2.5],"Mozzarella":[1,18,20,0],"Pomodori":[3.9,.9,.2,1.2],"Fesa di vitello a fette":[0,21,2,0],"Vino bianco":[0,0,0,0],"Insalata mista":[3,1.5,.2,1.5],
 "Olio extravergine":[0,0,100,0]};
// peso in grammi di un'unità (pz, mazzo, spicchio…)
const WT={"Basilico":20,"Aglio":4,"Rosmarino":2,"Filetti di salmone":150,"Limone":40,"Orata":200,"Prezzemolo":20,"Filetti di merluzzo":150,"Capperi":10,"Carota":80,
 "Sedano":40,"Cipolla":100,"Cetriolo":200,"Zucchine":200,"Farina":10,"Uova":60,"Pane casereccio":40,"Piadine":100,"Pomodori":150,"Insalata mista":125};
// olio usato in cottura/condimento (g per tutta la ricetta), conteggiato nei valori
const OIL={caprese:12,risotto:12,frittata:20};
const nutCache={};
function nutrition(r){
  if(nutCache[r.id])return nutCache[r.id];
  let C=0,P=0,F=0,Fi=0;
  const items=[...r.i,["Olio extravergine",OIL[r.id]??25,"g"]];
  for(const [n,q,u] of items){const v=NUT[n];if(!v)continue;const g=(u==="g"||u==="ml")?q:q*(WT[n]||100);
    C+=v[0]*g/100;P+=v[1]*g/100;F+=v[2]*g/100;Fi+=v[3]*g/100}
  C/=SERV;P/=SERV;F/=SERV;Fi/=SERV; // per porzione
  const kc=C*4,kp=P*4,kf=F*9,tot=kc+kp+kf||1;
  const pc=Math.round(kc/tot*100),pp=Math.round(kp/tot*100);
  return nutCache[r.id]={kcal:Math.round(tot),c:pc,p:pp,f:100-pc-pp,fib:Math.round(Fi),gC:Math.round(C),gP:Math.round(P),gF:Math.round(F)};
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
function nutHtml(n){const g=S.ranges,bad=checkBalance(n);
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
   <div class="row" style="justify-content:space-between"><small>Percentuali sulle calorie. Valori stimati, compreso circa un cucchiaio d'olio a testa.</small><button class="btn ghost" data-ranges style="padding:6px 12px;font-size:13px">Intervalli</button></div></div>`}
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
const svgCache={};
function dishSvg(r){
  if(svgCache[r.id])return svgCache[r.id];
  const rnd=rng(r.id),v=r.v,[t1,t2]=TABLE[r.t];
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
   settings (unico record: obiettivi, intervalli, orari), photos (una foto per ricetta).
   Le modifiche vanno in una coda locale (outbox) e partono appena c'è rete; vince l'ultima scrittura per campo. */
const CACHE="cucinario-stato-v1",OUTBOX="cucinario-outbox-v1",COLS=["plan","shopping","settings","photos"];
const JSONF=new Set(["pranzo","cena","checks","have","goals","ranges","times"]);
const pb=new PocketBase(location.origin);pb.autoCancellation(false);
// id dei record deterministici (15 caratteri a-z0-9), così ogni dispositivo sa quale record aggiornare
const pad15=s=>(s.replace(/[^a-z0-9]/g,"")+"0".repeat(15)).slice(0,15);
function hash36(s){let a=0xdeadbeef,b=0x41c6ce57;for(const c of s){const x=c.charCodeAt(0);a=Math.imul(a^x,2654435761);b=Math.imul(b^x,1597334677)}
  a=Math.imul(a^a>>>16,2246822507)^Math.imul(b^b>>>13,3266489909);b=Math.imul(b^b>>>16,2246822507)^Math.imul(a^a>>>13,3266489909);
  return((b>>>0).toString(36)+(a>>>0).toString(36))}
const ID={plan:k=>pad15("p"+k),shopping:w=>pad15("w"+w),settings:()=>"settings0000000",photos:r=>pad15("ph"+hash36(r))};
const defaults=()=>({plan:{},checks:{},have:{},photos:{},shopMode:"casa",
  goals:{lenticchie:{min:1,max:null},fagioli:{min:1,max:null},ceci:{min:1,max:null},pesce:{min:2,max:null},carne:{min:0,max:2},uova:{min:0,max:2},latticini:{min:0,max:3}},
  ranges:{c:[45,60],p:[15,25],f:[20,35],fib:8},times:{pranzo:"18:00",cena:"23:00"}});
let S=defaults(),outbox=[],netOk=true;
try{S=Object.assign(defaults(),JSON.parse(localStorage.getItem(CACHE))||{})}catch(e){}
try{outbox=JSON.parse(localStorage.getItem(OUTBOX))||[]}catch(e){}
// obiettivi salvati prima che i legumi fossero divisi in tre: tengo solo le categorie attuali, il resto dai default
const normGoals=g=>{const d=defaults().goals;return Object.fromEntries(PROT.map(p=>[p,(g&&g[p])||d[p]]))};
S.goals=normGoals(S.goals);
function save(){try{localStorage.setItem(CACHE,JSON.stringify(S))}catch(e){}}
function queue(col,id,data){data=JSON.parse(JSON.stringify(data));const e=outbox.find(x=>x.col===col&&x.id===id);
  if(e)Object.assign(e.data,data);else outbox.push({col,id,data});
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
    try{await upsert(e);netOk=true}
    catch(err){
      if(!err.status){netOk=false;break}                     // niente rete: riprovo più tardi
      if(err.status===401||err.status===403){showLogin();break}
      console.warn("Modifica scartata dal server",e,err)}     // dato non valido: non blocco la coda
    if(JSON.stringify(e.data)===snap)outbox.shift();          // se è cambiato mentre lo inviavo, lo rimando
    try{localStorage.setItem(OUTBOX,JSON.stringify(outbox))}catch(e){}}}
  finally{flushing=false;renderSync()}
}
// record del server → stato locale
function applyRec(col,r,del){
  if(col==="plan"){if(del)delete S.plan[r.date];else S.plan[r.date]={pranzo:r.pranzo??null,cena:r.cena??null}}
  else if(col==="shopping"){if(del){delete S.checks[r.week];delete S.have[r.week]}else{S.checks[r.week]=r.checks||{};S.have[r.week]=r.have||{}}}
  else if(col==="settings"){if(!del)for(const f of ["goals","ranges","times"])if(r[f])S[f]=f==="goals"?normGoals(r[f]):r[f]}
  else if(col==="photos"){if(del||!r.image)delete S.photos[r.recipe];else S.photos[r.recipe]=pb.files.getURL(r,r.image)}
}
// le modifiche locali non ancora inviate hanno la precedenza su quello che arriva dal server
function applyPending(){for(const {col,data} of outbox){
  if(col==="plan"){const p=S.plan[data.date]=S.plan[data.date]||{pranzo:null,cena:null};for(const m of ["pranzo","cena"])if(m in data)p[m]=data[m]}
  else if(col==="shopping"){for(const f of ["checks","have"])if(f in data)S[f][data.week]=data[f]}
  else if(col==="settings"){Object.assign(S,data);S.goals=normGoals(S.goals)}}}
async function pull(){
  const [plan,shop,set,ph]=await Promise.all(COLS.map(c=>pb.collection(c).getFullList({batch:1000})));
  S.plan={};S.checks={};S.have={};S.photos={};
  plan.forEach(r=>applyRec("plan",r));shop.forEach(r=>applyRec("shopping",r));set.forEach(r=>applyRec("settings",r));ph.forEach(r=>applyRec("photos",r));
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
const rid=v=>typeof v==="string"?v:null;
const outNote=v=>v&&typeof v==="object"?(v.o||""):null;
function setSlot(k,m,id){S.plan[k]=S.plan[k]||{pranzo:null,cena:null};S.plan[k][m]=id;save();queue("plan",ID.plan(k),{date:k,[m]:id})}
const tagHtml=t=>`<span class="tag t-${t}">${PNAME[t]}</span>`;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1900)}

/* ---------- Obiettivi ---------- */
function counts(){const c=Object.fromEntries(PROT.map(p=>[p,0]));weekKeys().forEach(k=>["pranzo","cena"].forEach(m=>{const id=rid(slot(k,m));if(id)c[byId[id].t]++}));return c}
function status(p,c){const g=S.goals[p],n=c[p];
  if(g.min&&n<g.min)return{cls:"warn",txt:`manca ${g.min-n}`,need:g.min-n};
  if(g.max!=null&&n>g.max)return{cls:"warn",txt:`+${n-g.max} di troppo`,over:n-g.max};
  if(g.min||g.max!=null)return{cls:"ok",txt:"✓"};
  return{cls:"",txt:"libero"}}
const goalLbl=g=>g.min&&g.max!=null?`${g.min}–${g.max}`:g.min?`≥${g.min}`:g.max!=null?`≤${g.max}`:"";
function renderGoals(){
  const c=counts();
  $("#goals").innerHTML=PROT.map(p=>{const g=S.goals[p],st=status(p,c);
    return `<span class="goal ${st.cls}"><span class="gname">${PNAME[p]}</span><span class="gnum">${c[p]}${goalLbl(g)?`<span> / ${goalLbl(g)}</span>`:""}</span><span class="gstate">${st.txt}</span></span>`}).join("");
}
$("#goals").addEventListener("click",openGoals);
function openGoals(){
  const draw=()=>{$("#sheetBody").innerHTML=`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">Quante volte a settimana, tra pranzi e cene. Le tessere in alto diventano arancioni quando un obiettivo non è rispettato.</p><div class="grows">${PROT.map(p=>{const g=S.goals[p];
    return `<div class="grow"><div class="gtop">${tagHtml(p)}<span style="color:var(--muted);font-size:13px">${goalLbl(g)?goalLbl(g)+" a settimana":"nessun vincolo"}</span></div>
    <div class="gctl"><div class="stepper"><label>Almeno</label><div><button data-p="${p}" data-f="min" data-d="-1" aria-label="Meno">−</button><output>${g.min||"—"}</output><button data-p="${p}" data-f="min" data-d="1" aria-label="Più">+</button></div></div>
    <div class="stepper"><label>Al massimo</label><div><button data-p="${p}" data-f="max" data-d="-1" aria-label="Meno">−</button><output>${g.max==null?"—":g.max}</output><button data-p="${p}" data-f="max" data-d="1" aria-label="Più">+</button></div></div></div></div>`}).join("")}</div>`};
  openSheet("Obiettivi settimanali","");draw();
  $("#sheetBody").onclick=e=>{const b=e.target.closest("[data-p]");if(!b)return;const g=S.goals[b.dataset.p],d=+b.dataset.d;
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
  $("#title").textContent={week:"Settimana",shop:"Lista della spesa",rec:"Ricette",set:"Impostazioni"}[tab];
  $("#weeknav").hidden=tab==="rec"||tab==="set";
  $("#topRow").hidden=tab==="week";
  $("#autoBtn").hidden=tab!=="week";
  $("#goals").hidden=tab!=="week";
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
  if(outNote(v)!==null)openOut(k,m);else if(v)openDetail(k,m);else openPicker(k,m)});

/* ---------- Riempimento automatico che rispetta gli obiettivi ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function autofill(all){
  const keys=weekKeys();
  // "rifai tutto" tiene i pasti fuori casa
  if(all)keys.forEach(k=>["pranzo","cena"].forEach(m=>{if(outNote(slot(k,m))===null&&slot(k,m))setSlot(k,m,null)}));
  const empty=[];keys.forEach(k=>["pranzo","cena"].forEach(m=>{if(!slot(k,m))empty.push([k,m])}));
  if(!empty.length){toast("La settimana è già piena");return}
  const c=counts(),cats=[];
  for(const p of shuffle([...PROT])){const need=Math.max(0,(S.goals[p].min||0)-c[p]);for(let i=0;i<need&&cats.length<empty.length;i++){cats.push(p);c[p]++}}
  while(cats.length<empty.length){
    const ok=PROT.filter(p=>S.goals[p].max==null||c[p]<S.goals[p].max);
    let from=ok.length?ok:PROT;
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
function cardHtml(r,cur,showBal,extra){const ok=!checkBalance(nutrition(r)).length;return `<button class="rcard${cur?" current":""}" data-id="${r.id}">${photoHtml(r)}<span class="rinfo"><span class="rname">${esc(r.n)}</span><span class="row" style="gap:6px">${tagHtml(r.t)}</span>${extra||""}</span>${showBal&&!ok?`<span class="warnico" title="Da rivedere" aria-label="Da rivedere"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20z" fill="currentColor"/><path d="M12 9v5" stroke="var(--surface)" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.4" fill="var(--surface)"/></svg></span>`:""}</button>`}

function openPicker(k,m,f){
  const cur=rid(slot(k,m)),c=counts();
  if(cur)c[byId[cur].t]--; // il pasto che sto sostituendo non conta
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
function recipeHtml(r){return photoHtml(r,"hero")+`<div class="row" style="justify-content:space-between;margin-bottom:4px"><span class="row">${tagHtml(r.t)}<span style="color:var(--muted);font-size:13px">${SERV_LBL}</span></span>
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
async function uploadPhoto(recipe,blob){const id=ID.photos(recipe),fd=new FormData();fd.append("recipe",recipe);fd.append("image",blob,recipe+".jpg");
  try{return await pb.collection("photos").update(id,fd)}catch(err){if(err.status!==404)throw err}
  fd.append("id",id);return await pb.collection("photos").create(fd)}
function openDetail(k,m){
  const r=byId[rid(slot(k,m))];
  const nl=(()=>{const v=(S.plan[key(addDays(new Date(k+"T12:00"),1))]||{}).pranzo;return typeof v==="string"?byId[v]:null})();
  const p=m==="pranzo"?prevDinner(k):nl,sh=shared(r,p);
  const linkBox=sh.length?`<div class="linkbox">${LINK_ICO}<span>Si prepara insieme ${m==="pranzo"?"alla cena di ieri":"al pranzo di domani"}, <b>${esc(p.n)}</b>: in comune ${esc(sh.join(", ").toLowerCase())}.</span></div>`:"";
  openSheet(`${esc(r.n)}<small>${slotLabel(k,m)}</small>`,linkBox+recipeHtml(r)+`<div class="row"><button class="btn" data-a="change">Cambia ricetta</button><button class="btn ghost" data-a="out">Fuori casa</button><button class="btn ghost" data-a="remove">Togli</button></div>`);
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-ranges]")){openRanges(()=>openDetail(k,m));return}
    const b=e.target.closest("[data-a]");if(!b)return;
    if(b.dataset.a==="change")openPicker(k,m);else if(b.dataset.a==="out")openOut(k,m);else{setSlot(k,m,null);closeSheet();renderAll();toast("Pasto tolto")}};
  bindPhoto(()=>openDetail(k,m));
}
function openRecipe(id){const r=byId[id];openSheet(esc(r.n),recipeHtml(r));bindPhoto(()=>openRecipe(id));
  $("#sheetBody").onclick=e=>{if(e.target.closest("[data-ranges]"))openRanges(()=>openRecipe(id))}}

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
function renderRec(){
  $("#recFilters").innerHTML=filtersHtml(recFilter);
  $("#recList").innerHTML=R.filter(r=>!recFilter||r.t===recFilter).map(r=>cardHtml(r,false,true)).join("");
}
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
