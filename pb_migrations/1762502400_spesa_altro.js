/// <reference path="../pb_data/types.d.ts" />

// Spesa: cose da comprare che non vengono dalle ricette (detersivo, pane…), per settimana.
// shopping.extra = [{id, n: nome}]; le spunte stanno in checks con lo stesso id.
migrate((app) => {
  const col = app.findCollectionByNameOrId("shopping")
  col.fields.add(new JSONField({ name: "extra" }))
  app.save(col)
})
