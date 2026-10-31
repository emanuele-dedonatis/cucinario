/// <reference path="../pb_data/types.d.ts" />

// ingredients.verified: valori controllati a mano sull'etichetta di quello che si compra (spunta "Verificato").
migrate((app) => {
  const col = app.findCollectionByNameOrId("ingredients")
  col.fields.add(new BoolField({ name: "verified" }))
  app.save(col)
})
