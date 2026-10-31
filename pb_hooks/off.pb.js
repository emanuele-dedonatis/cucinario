/// <reference path="../pb_data/types.d.ts" />

// Proxy verso Open Food Facts (database libero, licenza ODbL) per i valori nutrizionali degli ingredienti.
// Passa dal server perché il motore di ricerca di OFF non accetta chiamate dal browser (CORS) e perché OFF chiede
// un User-Agent che identifichi l'app. Solo per utenti autenticati.
//   GET /api/cucinario/off/search?q=avocado   → { products: [...] }
//   GET /api/cucinario/off/product/<codice>    → { product: {...} } oppure 404
routerAdd("GET", "/api/cucinario/off/search", (e) => {
  const q = String(e.request.url.query().get("q") || "").trim().slice(0, 80)
  if (!q) return e.json(400, { message: "q mancante" })
  const fields = "code,product_name,product_name_it,brands,nutriments"
  const res = $http.send({
    url: "https://search.openfoodfacts.org/search?langs=it&page_size=24&fields=" + fields + "&q=" + encodeURIComponent(q),
    headers: { "User-Agent": "Cucinario/1.0 (app di famiglia; https://cucinario.ededona.es)" },
    timeout: 15,
  })
  if (res.statusCode !== 200) return e.json(502, { message: "Open Food Facts ha risposto " + res.statusCode })
  return e.json(200, { products: (res.json && res.json.hits) || [] })
}, $apis.requireAuth())

routerAdd("GET", "/api/cucinario/off/product/{code}", (e) => {
  const code = String(e.request.pathValue("code") || "").replace(/\D/g, "")
  if (code.length < 8 || code.length > 14) return e.json(400, { message: "codice non valido" })
  const res = $http.send({
    url: "https://world.openfoodfacts.org/api/v2/product/" + code + "?fields=code,product_name,product_name_it,brands,nutriments",
    headers: { "User-Agent": "Cucinario/1.0 (app di famiglia; https://cucinario.ededona.es)" },
    timeout: 15,
  })
  if (res.statusCode === 404 || (res.json && res.json.status === 0)) return e.json(404, { message: "prodotto non trovato" })
  if (res.statusCode !== 200) return e.json(502, { message: "Open Food Facts ha risposto " + res.statusCode })
  return e.json(200, { product: res.json.product })
}, $apis.requireAuth())
