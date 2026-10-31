/// <reference path="../pb_data/types.d.ts" />

// settings.country: paese dove si fa la spesa (tag di Open Food Facts, es. "en:spain"); la ricerca dei valori
// mostra prima i prodotti venduti lì. Vuoto = tutti i paesi. La famiglia vive in Spagna.
migrate((app) => {
  const set = app.findCollectionByNameOrId("settings")
  set.fields.add(new TextField({ name: "country" }))
  app.save(set)
  for (const s of app.findAllRecords("settings")) { s.set("country", "en:spain"); app.save(s) }
})
