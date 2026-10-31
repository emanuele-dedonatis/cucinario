/// <reference path="../pb_data/types.d.ts" />

// Proxy verso Open Food Facts (database libero, licenza ODbL) per i valori nutrizionali degli ingredienti.
// Passa dal server perché il motore di ricerca di OFF non accetta chiamate dal browser (CORS) e perché OFF chiede
// un User-Agent che identifichi l'app. Solo per utenti autenticati.
//   GET /api/cucinario/off/search?q=ceci&country=en:spain → { products: [... con grp e name], category }
//   GET /api/cucinario/off/product/<codice>                → { product: {...} } oppure 404
// Con un paese: il nome (in italiano) si riconosce come categoria di OFF, che vale in tutte le lingue
// ("ceci" → en:chickpeas), e si cercano i prodotti di quella categoria venduti nel paese (i garbanzos in Spagna).
// grp: 0 = categoria nel paese, 1 = parole nel paese, 2 = parole ovunque (come prima, se il resto trova poco).
routerAdd("GET", "/api/cucinario/off/search", (e) => {
  const UA = "Cucinario/1.0 (app di famiglia; https://cucinario.ededona.es)"
  const BASE = "https://search.openfoodfacts.org"
  const LANG = { "en:spain": "es", "en:italy": "it", "en:france": "fr", "en:portugal": "pt", "en:germany": "de", "en:united-kingdom": "en", "en:switzerland": "de" }
  const q = String(e.request.url.query().get("q") || "").trim().slice(0, 80)
  const country = String(e.request.url.query().get("country") || "")
  if (!q) return e.json(400, { message: "q mancante" })
  if (country && !LANG[country]) return e.json(400, { message: "paese non valido" })
  const lang = LANG[country] || "it"
  const fields = "code,product_name,product_name_it,product_name_" + lang + ",brands,nutriments"
  const get = (url) => $http.send({ url, headers: { "User-Agent": UA }, timeout: 15 })
  const search = (query, langs) => {
    const res = get(BASE + "/search?page_size=24&langs=" + langs + "&fields=" + fields + "&q=" + encodeURIComponent(query))
    if (res.statusCode !== 200) throw new Error("Open Food Facts ha risposto " + res.statusCode)
    return (res.json && res.json.hits) || []
  }
  const hasVals = (p) => { const n = p.nutriments || {}; return n.carbohydrates_100g != null && n.proteins_100g != null && n.fat_100g != null }

  const out = [], seen = new Set()
  let category = null, failed = null
  const add = (hits, grp) => { for (const p of hits) if (p.code && !seen.has(p.code)) { seen.add(p.code); p.grp = grp; p.name = p["product_name_" + lang] || p.product_name_it || p.product_name || ""; out.push(p) } }
  if (country) {
    // categoria: la ricerca delle categorie confronta l'inizio delle parole, quindi "zucchina" non trova "Zucchine":
    // riprovo togliendo l'ultima lettera alle parole lunghe e poi con la sola prima parola
    const words = q.toLowerCase().split(/\s+/)
    const cut = (w) => (w.length > 4 ? w.slice(0, -1) : w)
    const tries = [q, words.map(cut).join(" "), words[0], cut(words[0])].filter((x, i, a) => x && a.indexOf(x) === i)
    for (const t of tries) {
      try {
        const ac = get(BASE + "/autocomplete?taxonomy_names=category&lang=it&size=1&q=" + encodeURIComponent(t))
        const o = ac.statusCode === 200 && ac.json && (ac.json.options || [])[0]
        if (o) { category = { id: o.id, name: o.text }; break }
      } catch (err) { failed = err }
    }
    const inCountry = ' countries_tags:"' + country + '"'
    if (category) { try { add(search('categories_tags:"' + category.id + '"' + inCountry, lang + ",it"), 0) } catch (err) { failed = err } }
    try { add(search(q + inCountry, "it," + lang), 1) } catch (err) { failed = err }
  }
  if (out.filter(hasVals).length < 8) { try { add(search(q, "it"), 2) } catch (err) { failed = err } }
  if (!out.length && failed) return e.json(502, { message: String(failed) })
  return e.json(200, { products: out, category: category && category.name })
}, $apis.requireAuth())

routerAdd("GET", "/api/cucinario/off/product/{code}", (e) => {
  const code = String(e.request.pathValue("code") || "").replace(/\D/g, "")
  if (code.length < 8 || code.length > 14) return e.json(400, { message: "codice non valido" })
  const res = $http.send({
    url: "https://world.openfoodfacts.org/api/v2/product/" + code + "?fields=code,product_name,product_name_it,product_name_es,brands,nutriments",
    headers: { "User-Agent": "Cucinario/1.0 (app di famiglia; https://cucinario.ededona.es)" },
    timeout: 15,
  })
  if (res.statusCode === 404 || (res.json && res.json.status === 0)) return e.json(404, { message: "prodotto non trovato" })
  if (res.statusCode !== 200) return e.json(502, { message: "Open Food Facts ha risposto " + res.statusCode })
  return e.json(200, { product: res.json.product })
}, $apis.requireAuth())
