/// <reference path="../pb_data/types.d.ts" />

// Quantità per persona e persone per pasto.
// - recipes.ingredients: le quantità erano per 2 adulti + 1 bambina (2,5 porzioni), ora sono per una persona adulta
// - plan.people: persone di un pasto, {pranzo: [adulti, bambini], cena: [adulti, bambini]}
// - settings.people: {a: adulti, b: bambini, kid: quanto mangia un bambino in % di un adulto}; a e b sono il valore
//   proposto per i pasti nuovi
migrate((app) => {
  for (const r of app.findAllRecords("recipes")) {
    const rows = JSON.parse(r.getString("ingredients") || "[]") || []
    r.set("ingredients", rows.map(([n, q, u]) => [n, Math.round((q / 2.5) * 10) / 10, u]))
    app.save(r)
  }

  const plan = app.findCollectionByNameOrId("plan")
  plan.fields.add(new JSONField({ name: "people" }))
  app.save(plan)

  const set = app.findCollectionByNameOrId("settings")
  set.fields.add(new JSONField({ name: "people" }))
  app.save(set)
  for (const s of app.findAllRecords("settings")) { s.set("people", { a: 2, b: 1, kid: 60 }); app.save(s) }
})
