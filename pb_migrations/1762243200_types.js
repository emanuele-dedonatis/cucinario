/// <reference path="../pb_data/types.d.ts" />

// Pasto e tipo delle ricette, e settimana tipo.
// - recipes.meals: ["pranzo", "cena"] (fisso, almeno uno); recipes.types: id dei tipi (almeno uno)
// - types: tipi personalizzabili (all'inizio Feriale e Festivo)
// - settings.schedule: settimana tipo, {pranzo: [7 id], cena: [7 id]} da lunedì a domenica; null = qualsiasi tipo
// - plan.kinds: tipo di un pasto diverso dalla settimana tipo, {pranzo: id|null, cena: id|null} (solo se cambiato)
// Le ricette esistenti diventano adatte a pranzo e cena e a tutti i tipi.
migrate((app) => {
  const auth = "@request.auth.id != ''"
  app.save(new Collection({
    type: "base",
    name: "types",
    listRule: auth, viewRule: auth, createRule: auth, updateRule: auth, deleteRule: auth,
    fields: [
      { type: "text", name: "name", required: true },
      { type: "number", name: "order" },
    ],
  }))
  const col = app.findCollectionByNameOrId("types")
  const T = [["tferiale0000000", "Feriale"], ["tfestivo0000000", "Festivo"]]
  T.forEach(([id, name], i) => {
    const r = new Record(col)
    r.set("id", id); r.set("name", name); r.set("order", i)
    app.save(r)
  })
  const [FE, FS] = T.map((t) => t[0])

  const rec = app.findCollectionByNameOrId("recipes")
  rec.fields.add(new JSONField({ name: "meals" }))
  rec.fields.add(new JSONField({ name: "types" }))
  app.save(rec)
  for (const r of app.findAllRecords("recipes")) {
    r.set("meals", ["pranzo", "cena"])
    r.set("types", [FE, FS])
    app.save(r)
  }

  const plan = app.findCollectionByNameOrId("plan")
  plan.fields.add(new JSONField({ name: "kinds" }))
  app.save(plan)

  const set = app.findCollectionByNameOrId("settings")
  set.fields.add(new JSONField({ name: "schedule" }))
  app.save(set)
  // pranzi lun–ven e cene lun–gio feriali; venerdì sera e fine settimana festivi
  const schedule = { pranzo: [FE, FE, FE, FE, FE, FS, FS], cena: [FE, FE, FE, FE, FS, FS, FS] }
  for (const s of app.findAllRecords("settings")) { s.set("schedule", schedule); app.save(s) }
})
