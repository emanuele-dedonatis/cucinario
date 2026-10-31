/// <reference path="../pb_data/types.d.ts" />

// Le ricette passano dal codice al database, con un catalogo di ingredienti (reparto e valori nutrizionali).
// Qui ci sono le 17 ricette di esempio e i valori che prima stavano in app.js; i riferimenti nei pasti e nelle
// foto passano dai vecchi id ("ceci") ai nuovi id di record ("rceci0000000000").
migrate((app) => {
  const auth = "@request.auth.id != ''"
  const base = (name, fields, indexes) => app.save(new Collection({
    type: "base",
    name: name,
    listRule: auth, viewRule: auth, createRule: auth, updateRule: auth, deleteRule: auth,
    fields: fields,
    indexes: indexes || [],
  }))

  // valori per 100 g; unit_g = grammi di un'unità (pz, mazzo, spicchio…), 0 se si usa solo g/ml
  base("ingredients", [
    { type: "text", name: "name", required: true },
    { type: "text", name: "dept", required: true },
    { type: "number", name: "c", min: 0 },
    { type: "number", name: "p", min: 0 },
    { type: "number", name: "f", min: 0 },
    { type: "number", name: "fib", min: 0 },
    { type: "number", name: "unit_g", min: 0 },
  ], ["CREATE UNIQUE INDEX idx_ingredients_name ON ingredients (name)"])

  // ingredients = [[nome, quantità, unità]] per 2 adulti + 1 bambina; steps = [testo]; oil = g di olio per tutta
  // la ricetta; vis = illustrazione (vedi dishSvg in app.js); archived = eliminata, ma ancora visibile nei pasti passati
  base("recipes", [
    { type: "text", name: "name", required: true },
    { type: "text", name: "cat", required: true },
    { type: "json", name: "ingredients" },
    { type: "json", name: "steps" },
    { type: "number", name: "oil", min: 0 },
    { type: "json", name: "vis" },
    { type: "bool", name: "archived" },
  ])

  // stessi id deterministici del client (pad15, hash36 in app.js)
  const pad15 = (s) => (s.replace(/[^a-z0-9]/g, "") + "000000000000000").slice(0, 15)
  const hash36 = (s) => {
    let a = 0xdeadbeef, b = 0x41c6ce57
    for (let i = 0; i < s.length; i++) { const x = s.charCodeAt(i); a = Math.imul(a ^ x, 2654435761); b = Math.imul(b ^ x, 1597334677) }
    a = Math.imul(a ^ a >>> 16, 2246822507) ^ Math.imul(b ^ b >>> 13, 3266489909)
    b = Math.imul(b ^ b >>> 16, 2246822507) ^ Math.imul(a ^ a >>> 13, 3266489909)
    return (b >>> 0).toString(36) + (a >>> 0).toString(36)
  }

  // ---- dati che prima stavano in app.js ----
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
  const NUT={"Spaghetti":[71,13,1.5,3],"Ditalini":[71,13,1.5,3],"Pasta mista":[71,13,1.5,3],"Passata di pomodoro":[4.5,1.3,.2,1.2],"Ricotta":[3.5,9,10,0],
   "Basilico":[2,3,.6,1.6],"Aglio":[33,6,.5,2],"Ceci cotti":[17,7,2.5,6],"Rosmarino":[20,3,6,14],"Filetti di salmone":[0,20,13,0],"Patate":[17,2,.1,2.2],
   "Limone":[9,1.1,.3,2.8],"Orata":[0,20,4,0],"Pomodorini":[3.9,.9,.2,1.2],"Olive taggiasche":[1,1,15,3],"Prezzemolo":[6,3,.8,3.3],"Filetti di merluzzo":[0,18,.7,0],
   "Capperi":[5,2,.9,3],"Tonno sott'olio":[0,25,8,0],"Fagiolini":[7,1.8,.1,2.7],"Lenticchie secche":[50,24,1,14],"Riso basmati":[78,7,.6,1],"Carota":[10,.9,.2,2.8],
   "Sedano":[3,.7,.2,1.6],"Cipolla":[9,1.1,.1,1.7],"Fagioli borlotti cotti":[14,7,.5,6],"Farro":[67,15,2.5,7],"Feta":[1.5,14,21,0],"Cetriolo":[3.6,.7,.1,.5],
   "Petto di pollo":[0,23,1.5,0],"Zucchine":[3,1.2,.3,1],"Farina":[76,10,1,2.7],"Macinato di manzo":[0,20,15,0],"Uova":[.7,13,10,0],"Pane grattugiato":[72,13,5,4],
   "Parmigiano":[0,33,28,0],"Pane casereccio":[50,8.5,1.5,3],"Taleggio":[0,19,26,0],"Riso Carnaroli":[79,7,.6,1],"Funghi champignon":[3.3,3,.3,1],"Burro":[0,1,83,0],
   "Piadine":[50,8,12,2.5],"Mozzarella":[1,18,20,0],"Pomodori":[3.9,.9,.2,1.2],"Fesa di vitello a fette":[0,21,2,0],"Vino bianco":[0,0,0,0],"Insalata mista":[3,1.5,.2,1.5],
   "Olio extravergine":[0,0,100,0]};
  const WT={"Basilico":20,"Aglio":4,"Rosmarino":2,"Filetti di salmone":150,"Limone":40,"Orata":200,"Prezzemolo":20,"Filetti di merluzzo":150,"Capperi":10,"Carota":80,
   "Sedano":40,"Cipolla":100,"Cetriolo":200,"Zucchine":200,"Farina":10,"Uova":60,"Pane casereccio":40,"Piadine":100,"Pomodori":150,"Insalata mista":125};
  const OIL={caprese:12,risotto:12,frittata:20};

  const ingCol = app.findCollectionByNameOrId("ingredients")
  const seen = {}
  for (const r of R) for (const [n, , , dept] of r.i) {
    if (seen[n] || !NUT[n]) continue
    seen[n] = true
    const rec = new Record(ingCol)
    rec.set("id", pad15("i" + hash36(n)))
    rec.set("name", n)
    rec.set("dept", dept)
    rec.set("c", NUT[n][0]); rec.set("p", NUT[n][1]); rec.set("f", NUT[n][2]); rec.set("fib", NUT[n][3])
    rec.set("unit_g", WT[n] || 0)
    app.save(rec)
  }

  // le ricette erano scritte per 2: le porto a 2 adulti + 1 bambina (2,5 porzioni), come faceva app.js all'avvio
  const scale = (q, u) => (u === "g" || u === "ml")
    ? (q * 1.25 >= 100 ? Math.round(q * 1.25 / 10) * 10 : Math.round(q * 1.25 / 5) * 5)
    : (q <= 1 ? q : Math.ceil(q * 1.25))
  const recCol = app.findCollectionByNameOrId("recipes")
  const newId = {}
  for (const r of R) {
    const rec = new Record(recCol)
    newId[r.id] = pad15("r" + r.id)
    rec.set("id", newId[r.id])
    rec.set("name", r.n)
    rec.set("cat", r.t)
    rec.set("ingredients", r.i.map(([n, q, u]) => [n, scale(q, u), u]))
    rec.set("steps", r.s)
    rec.set("oil", OIL[r.id] === undefined ? 25 : OIL[r.id])
    rec.set("vis", r.v)
    rec.set("archived", false)
    app.save(rec)
  }

  // pasti e foto: vecchio id della ricetta -> id del record
  for (const rec of app.findAllRecords("plan")) {
    let changed = false
    for (const m of ["pranzo", "cena"]) {
      const v = JSON.parse(rec.getString(m) || "null")
      if (typeof v === "string" && newId[v]) { rec.set(m, newId[v]); changed = true }
    }
    if (changed) app.save(rec)
  }
  for (const rec of app.findAllRecords("photos")) {
    const v = rec.getString("recipe")
    if (newId[v]) { rec.set("recipe", newId[v]); app.save(rec) }
  }
}, (app) => {
  for (const name of ["recipes", "ingredients"]) {
    app.delete(app.findCollectionByNameOrId(name))
  }
})
