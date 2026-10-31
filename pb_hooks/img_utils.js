// Funzioni condivise da img.pb.js (in PocketBase ogni gestore gira isolato: si caricano con require).
// Wikimedia Commons: foto libere (Creative Commons o pubblico dominio), senza chiave e veloce.
// (Openverse, provato prima, impiegava 15–40 secondi per ricerca.)
const UA = "Cucinario/1.0 (app di famiglia; https://cucinario.ededona.es)"
// autore e licenza (extmetadata) solo per la foto scelta: chiesti per 30 foto insieme, Commons li dà solo ad alcune
const API = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|mime|size"
const META = "&iiprop=url|mime|size|extmetadata&iiextmetadatafilter=Artist|LicenseShortName"

function get(url, timeout) {
  return $http.send({ url, headers: { "User-Agent": UA }, timeout: timeout || 15 })
}

const strip = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim()

// pagine di Commons → foto (solo jpeg/png/webp abbastanza grandi: niente scansioni di libri, pdf, svg)
function items(json) {
  const pages = Object.values((json && json.query && json.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0))
  const out = []
  for (const p of pages) {
    const ii = (p.imageinfo || [])[0]
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime) || ii.width < 400 || ii.height < 250) continue
    out.push({ id: p.title, title: p.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""), thumb: ii.thumburl || ii.url })
  }
  return out
}

// ricerca con le parole date; se trova poco riprova senza le parole piccole e poi con la sola prima parola
const SMALL = new Set(["a", "al", "alla", "alle", "ai", "agli", "all", "con", "di", "del", "della", "dei", "delle", "e", "ed", "in", "per", "su", "allo", "il", "la", "lo", "le", "gli", "i"])
function search(q) {
  const words = q.toLowerCase().split(/[\s']+/).filter(Boolean)
  const big = words.filter((w) => !SMALL.has(w))
  const tries = [q, big.join(" "), big[0]].filter((x, i, a) => x && a.indexOf(x) === i)
  const seen = new Set(), out = []
  for (const t of tries) {
    const res = get(API + "&generator=search&gsrnamespace=6&gsrlimit=30&iiurlwidth=500&gsrsearch=" + encodeURIComponent(t + " filetype:bitmap"))
    if (res.statusCode !== 200) throw new Error("Commons ha risposto " + res.statusCode)
    for (const x of items(res.json)) if (!seen.has(x.id)) { seen.add(x.id); out.push(x) }
    if (out.length >= 12) break
  }
  return out.slice(0, 20)
}

// autore · licenza · fonte, da mostrare sotto la foto
function credit(ii) {
  const md = (ii && ii.extmetadata) || {}
  const artist = strip(md.Artist && md.Artist.value).slice(0, 60)
  const lic = strip(md.LicenseShortName && md.LicenseShortName.value)
  return [artist, lic, "Wikimedia Commons"].filter(Boolean).join(" · ")
}

module.exports = { API, META, get, items, search, credit }
