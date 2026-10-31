/// <reference path="../pb_data/types.d.ts" />

// Si riparte da zero con le ricette: via tutte le ricette, gli ingredienti e le foto (app.delete cancella anche i file).
// Nei giorni pianificati tolgo i pasti che erano ricette; i pasti fuori casa ({o: nota}) e i tipi cambiati restano.
// Spunte e "già a casa" della spesa si riferivano a quegli ingredienti: le azzero.
// Categorie, tipi, obiettivi e impostazioni restano. Non si torna indietro: prima del deploy si fa un backup di pb_data.
migrate((app) => {
  for (const name of ["photos", "recipes", "ingredients"]) {
    for (const r of app.findAllRecords(name)) app.delete(r)
  }
  for (const r of app.findAllRecords("plan")) {
    let changed = false
    for (const m of ["pranzo", "cena"]) {
      const v = JSON.parse(r.getString(m) || "null")
      if (typeof v === "string") { r.set(m, null); changed = true }
    }
    if (changed) app.save(r)
  }
  for (const r of app.findAllRecords("shopping")) {
    r.set("checks", {})
    r.set("have", {})
    app.save(r)
  }
})
