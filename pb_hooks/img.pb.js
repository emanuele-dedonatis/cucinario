/// <reference path="../pb_data/types.d.ts" />

// Foto delle ricette dalla rete, come l'icona dei gruppi di WhatsApp: si cerca per nome su Wikimedia Commons e la foto
// scelta passa dal server (il browser non potrebbe ritagliarla: le immagini di altri siti non si leggono da un canvas).
// Solo per utenti autenticati.
//   GET /api/cucinario/img/search?q=pasta e ceci   → { images: [{id: "File:…", title, thumb}] }
//   GET /api/cucinario/img/file?t=File:…            → l'immagine (larga 1280 px al massimo); X-Credit = autore · licenza · fonte (URI-encoded)
routerAdd("GET", "/api/cucinario/img/search", (e) => {
  const u = require(`${__hooks}/img_utils.js`)
  const q = String(e.request.url.query().get("q") || "").trim().slice(0, 80)
  if (!q) return e.json(400, { message: "q mancante" })
  try { return e.json(200, { images: u.search(q) }) }
  catch (err) { return e.json(502, { message: String(err) }) }
}, $apis.requireAuth())

routerAdd("GET", "/api/cucinario/img/file", (e) => {
  const u = require(`${__hooks}/img_utils.js`)
  const t = String(e.request.url.query().get("t") || "")
  if (!/^File:[^|#<>\[\]{}]{1,240}$/.test(t)) return e.json(400, { message: "titolo non valido" })
  // l'indirizzo lo chiedo a Commons, non al browser: così il server scarica solo foto di Commons
  const info = u.get(u.API + u.META + "&iiurlwidth=1280&titles=" + encodeURIComponent(t))
  const ii = info.statusCode === 200 && Object.values((info.json.query && info.json.query.pages) || {}).map((p) => (p.imageinfo || [])[0]).find(Boolean)
  const url = ii && (ii.thumburl || ii.url)
  if (!url || !/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(url)) return e.json(404, { message: "foto non trovata" })
  const res = u.get(url, 30)
  const type = ((res.headers && res.headers["Content-Type"]) || [""])[0]
  if (res.statusCode !== 200 || !/^image\/(jpeg|png|webp)/.test(type)) return e.json(502, { message: "foto non scaricabile" })
  e.response.header().set("X-Credit", encodeURIComponent(u.credit(ii)))
  return e.blob(200, type, res.body)
}, $apis.requireAuth())
