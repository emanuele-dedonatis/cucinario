/// <reference path="../pb_data/types.d.ts" />

// Via "fonte proteica" e "reparto": gli ingredienti hanno una lista di categorie (collezione categories, creata e
// modificata dall'app), e una ricetta ha le categorie dei suoi ingredienti. Gli obiettivi settimanali stanno nelle
// categorie (goal = {min, max}). L'olio non è più un campo della ricetta ma un ingrediente come gli altri.
// Le sette fonti proteiche diventano le prime sette categorie, con gli obiettivi salvati nelle impostazioni.
// Non si torna indietro: prima del deploy si fa un backup di pb_data.
migrate((app) => {
  const auth = "@request.auth.id != ''"
  const pad15 = (s) => (s.replace(/[^a-z0-9]/g, "") + "000000000000000").slice(0, 15)
  const hash36 = (s) => {
    let a = 0xdeadbeef, b = 0x41c6ce57
    for (let i = 0; i < s.length; i++) { const x = s.charCodeAt(i); a = Math.imul(a ^ x, 2654435761); b = Math.imul(b ^ x, 1597334677) }
    a = Math.imul(a ^ a >>> 16, 2246822507) ^ Math.imul(b ^ b >>> 13, 3266489909)
    b = Math.imul(b ^ b >>> 16, 2246822507) ^ Math.imul(a ^ a >>> 13, 3266489909)
    return (b >>> 0).toString(36) + (a >>> 0).toString(36)
  }

  // color = indice della tavolozza in app.css (--k0 … --k9)
  app.save(new Collection({
    type: "base",
    name: "categories",
    listRule: auth, viewRule: auth, createRule: auth, updateRule: auth, deleteRule: auth,
    fields: [
      { type: "text", name: "name", required: true },
      { type: "number", name: "color", min: 0 },
      { type: "number", name: "order" },
      { type: "json", name: "goal" },
    ],
  }))
  const catCol = app.findCollectionByNameOrId("categories")

  const settings = app.findAllRecords("settings")[0]
  let goals = {}
  if (settings) goals = JSON.parse(settings.getString("goals") || "null") || {}
  const DEF = { lenticchie: { min: 1, max: null }, fagioli: { min: 1, max: null }, ceci: { min: 1, max: null }, pesce: { min: 2, max: null },
    carne: { min: 0, max: 2 }, uova: { min: 0, max: 2 }, latticini: { min: 0, max: 3 } }
  const OLD = [["lenticchie", "Lenticchie", 1], ["fagioli", "Fagioli", 2], ["ceci", "Ceci", 3], ["pesce", "Pesce", 0],
    ["carne", "Carne", 4], ["uova", "Uova", 6], ["latticini", "Latticini", 5]]
  const catId = {}
  OLD.forEach(([key, name, color], i) => {
    const g = goals[key] || DEF[key]
    const rec = new Record(catCol)
    catId[key] = pad15("k" + key)
    rec.set("id", catId[key])
    rec.set("name", name)
    rec.set("color", color)
    rec.set("order", i)
    rec.set("goal", { min: g.min || 0, max: g.max == null ? null : g.max })
    app.save(rec)
  })

  // ingredienti: prot -> cats; via reparto e fonte proteica
  const ing = app.findCollectionByNameOrId("ingredients")
  ing.fields.add(new JSONField({ name: "cats" }))
  app.save(ing)
  for (const r of app.findAllRecords("ingredients")) {
    const p = r.getString("prot")
    r.set("cats", catId[p] ? [catId[p]] : [])
    app.save(r)
  }
  const ing2 = app.findCollectionByNameOrId("ingredients")
  ing2.fields.removeByName("prot")
  ing2.fields.removeByName("dept")
  app.save(ing2)

  // olio: da campo della ricetta a ingrediente
  const OLIO = "Olio extravergine"
  let olio = null
  try { olio = app.findFirstRecordByData("ingredients", "name", OLIO) } catch (e) {}
  if (!olio) {
    olio = new Record(app.findCollectionByNameOrId("ingredients"))
    olio.set("id", pad15("i" + hash36(OLIO)))
    olio.set("name", OLIO)
    olio.set("c", 0); olio.set("p", 0); olio.set("f", 100); olio.set("fib", 0); olio.set("unit_g", 0)
    olio.set("cats", [])
    app.save(olio)
  }
  for (const r of app.findAllRecords("recipes")) {
    const oil = r.getFloat("oil")
    if (!(oil > 0)) continue
    const rows = JSON.parse(r.getString("ingredients") || "[]")
    if (rows.some((x) => x[0] === OLIO)) continue
    rows.push([OLIO, oil, "g"])
    r.set("ingredients", rows)
    app.save(r)
  }
  const rec = app.findCollectionByNameOrId("recipes")
  rec.fields.removeByName("oil")
  rec.fields.removeByName("cat")
  app.save(rec)

  // gli obiettivi ora stanno nelle categorie
  const set = app.findCollectionByNameOrId("settings")
  set.fields.removeByName("goals")
  app.save(set)
})
