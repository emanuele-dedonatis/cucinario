/// <reference path="../pb_data/types.d.ts" />

// Foto prese dalla rete (Openverse): photos.credit = autore · licenza · fonte, mostrato sotto la foto.
// Vuoto per le foto caricate dal telefono.
migrate((app) => {
  const col = app.findCollectionByNameOrId("photos")
  col.fields.add(new TextField({ name: "credit" }))
  app.save(col)
})
