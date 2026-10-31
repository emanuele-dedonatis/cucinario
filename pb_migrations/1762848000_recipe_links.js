/// <reference path="../pb_data/types.d.ts" />

// recipes.links: link alla ricetta originale (Instagram, siti…), [{url, title}]; title vuoto = si mostra il sito.
migrate((app) => {
  const col = app.findCollectionByNameOrId("recipes")
  col.fields.add(new JSONField({ name: "links" }))
  app.save(col)
})
