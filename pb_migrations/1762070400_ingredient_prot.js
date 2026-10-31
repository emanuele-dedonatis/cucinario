/// <reference path="../pb_data/types.d.ts" />

// La fonte proteica passa dagli ingredienti: ogni ingrediente può essere una fonte proteica (prot) e la ricetta
// prende quella che porta più proteine (calcolata in app.js). recipes.cat resta come copia, e può essere vuota
// per una ricetta senza fonte proteica.
const PROT = {
  "Lenticchie secche": "lenticchie",
  "Fagioli borlotti cotti": "fagioli",
  "Ceci cotti": "ceci",
  "Filetti di salmone": "pesce", "Orata": "pesce", "Filetti di merluzzo": "pesce", "Tonno sott'olio": "pesce",
  "Petto di pollo": "carne", "Macinato di manzo": "carne", "Fesa di vitello a fette": "carne",
  "Uova": "uova",
  "Ricotta": "latticini", "Feta": "latticini", "Parmigiano": "latticini", "Taleggio": "latticini", "Mozzarella": "latticini",
}

migrate((app) => {
  const ing = app.findCollectionByNameOrId("ingredients")
  ing.fields.add(new TextField({ name: "prot" }))
  app.save(ing)

  const rec = app.findCollectionByNameOrId("recipes")
  rec.fields.getByName("cat").required = false
  app.save(rec)

  for (const r of app.findAllRecords("ingredients")) {
    const p = PROT[r.getString("name")]
    if (p) { r.set("prot", p); app.save(r) }
  }
}, (app) => {
  const ing = app.findCollectionByNameOrId("ingredients")
  ing.fields.removeByName("prot")
  app.save(ing)

  const rec = app.findCollectionByNameOrId("recipes")
  rec.fields.getByName("cat").required = true
  app.save(rec)
})
