/// <reference path="../pb_data/types.d.ts" />

// recipes.draft: ricetta in costruzione (salvata anche senza ingredienti, quantità o valori; non si usa nella settimana).
migrate((app) => {
  const col = app.findCollectionByNameOrId("recipes")
  col.fields.add(new BoolField({ name: "draft" }))
  app.save(col)
})
