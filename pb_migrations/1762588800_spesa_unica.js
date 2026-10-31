/// <reference path="../pb_data/types.d.ts" />

// Spesa non più per settimana: un'unica lista con i pasti ancora da fare.
// Record unico week = "lista" (id wlista000000000) con checks, have, extra e
// done = {"data|pasto": id ricetta}: pasti già comprati con "Spesa fatta", che escono dalla lista.
// Le cose aggiunte a mano nelle settimane (extra non spuntati) passano nella lista unica.
migrate((app) => {
  const col = app.findCollectionByNameOrId("shopping")
  col.fields.getByName("week").pattern = "^(\\d{4}-\\d{2}-\\d{2}|lista)$"
  col.fields.add(new JSONField({ name: "done" }))
  app.save(col)

  const extra = []
  for (const r of app.findAllRecords("shopping")) {
    const checks = JSON.parse(r.getString("checks") || "null") || {}
    for (const x of JSON.parse(r.getString("extra") || "null") || []) if (!checks[x.id]) extra.push(x)
  }
  const rec = new Record(col)
  rec.set("id", "wlista000000000")
  rec.set("week", "lista")
  rec.set("checks", {})
  rec.set("have", {})
  rec.set("extra", extra)
  rec.set("done", {})
  app.save(rec)
})
