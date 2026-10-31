/// <reference path="../pb_data/types.d.ts" />

// Schema iniziale di Cucinario. PocketBase applica le migrazioni all'avvio, una volta sola.
migrate((app) => {
  // solo utenti autenticati (noi due) leggono e scrivono
  const auth = "@request.auth.id != ''"
  const base = (name, fields, indexes) => app.save(new Collection(Object.assign({
    type: "base",
    name: name,
    listRule: auth, viewRule: auth, createRule: auth, updateRule: auth, deleteRule: auth,
    fields: fields,
    indexes: indexes || [],
  })))

  // un record per giorno; pranzo/cena = id ricetta (stringa), {o:"nota"} se fuori casa, oppure null
  base("plan", [
    { type: "text", name: "date", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    { type: "json", name: "pranzo" },
    { type: "json", name: "cena" },
  ], ["CREATE UNIQUE INDEX idx_plan_date ON plan (date)"])

  // un record per settimana (week = data del lunedì): spunte "al mercato" e quantità "già a casa"
  base("shopping", [
    { type: "text", name: "week", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    { type: "json", name: "checks" },
    { type: "json", name: "have" },
  ], ["CREATE UNIQUE INDEX idx_shopping_week ON shopping (week)"])

  // record unico (id settings0000000): obiettivi settimanali, intervalli del pasto bilanciato, orari
  base("settings", [
    { type: "json", name: "goals" },
    { type: "json", name: "ranges" },
    { type: "json", name: "times" },
  ])

  // una foto per ricetta
  base("photos", [
    { type: "text", name: "recipe", required: true },
    { type: "file", name: "image", maxSelect: 1, maxSize: 8 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  ], ["CREATE UNIQUE INDEX idx_photos_recipe ON photos (recipe)"])

  // niente registrazioni pubbliche: gli utenti si creano dalla dashboard; sessione lunga sul telefono
  const users = app.findCollectionByNameOrId("users")
  users.createRule = null
  users.authToken.duration = 180 * 24 * 60 * 60
  app.save(users)

  // backup automatico ogni lunedì alle 3:00 in pb_data/backups, tiene gli ultimi 8
  const settings = app.settings()
  settings.meta.appName = "Cucinario"
  settings.backups.cron = "0 3 * * 1"
  settings.backups.cronMaxKeep = 8
  app.save(settings)
}, (app) => {
  for (const name of ["photos", "settings", "shopping", "plan"]) {
    app.delete(app.findCollectionByNameOrId(name))
  }
})
