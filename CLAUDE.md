# Cucinario: contesto del progetto

App su misura per pianificare pranzi e cene di famiglia. Nata come demo in un solo file HTML (ottobre 2026), ora pubblicata con PocketBase su una Raspberry Pi di casa. Istruzioni di installazione e deploy: `README.md`.

## Chi la usa
- Famiglia: **2 adulti + 1 bambina**. Due telefoni (Android e iPhone), **dati condivisi e sincronizzati**.
- Lingua dell'app, dei testi e dei commenti nel codice: **italiano**.

## Perché un'app su misura
Plan to Eat, AnyList, Paprika, RecipeSage e altre non gestiscono i **vincoli settimanali per fonte proteica** né la **generazione automatica** della settimana a partire dalle nostre ricette.

## Architettura
- **PocketBase v0.40.5** in Docker (`Dockerfile`, `docker-compose.yml`): SQLite, login, realtime (SSE), file, e serve anche `pb_public/`.
- **Schema** in `pb_migrations/` (JS, API PocketBase ≥ 0.23: `new Collection({...fields})`, `app.save`). Le modifiche allo schema vanno fatte con una **nuova** migrazione, non modificando quelle già applicate. `--automigrate=false`.
- **Frontend** senza build in `pb_public/`: `index.html`, `app.css`, `app.js` (un'unica IIFE, stile compatto della demo), `sw.js`, `manifest.json`, SDK in `vendor/pocketbase.umd.js` (0.28.1), `vendor/zxing.min.js` (`@zxing/library` 0.21.3, letto al primo uso per i codici a barre).
- **Hook** in `pb_hooks/off.pb.js` (`--hooksDir`): proxy autenticato verso **Open Food Facts** (`/api/cucinario/off/search?q=`, `/api/cucinario/off/product/<codice>`), perché il motore di ricerca di OFF non accetta chiamate dal browser (CORS) e OFF chiede un User-Agent dell'app. La ricerca a volte risponde 503: il client riprova una volta.
- **Sincronizzazione** (`app.js`, sezione "Stato"): stato `S` in cache su `localStorage`; ogni modifica passa da `setSlot` / `queueSettings` / `queueShop` → coda `outbox` → `upsert` (update, se 404 create con id deterministico). Il realtime e `pull()` aggiornano `S`; `applyPending()` dà precedenza alle modifiche locali non ancora inviate. I campi json viaggiano come testo JSON (`wire`), così una stringa resta stringa.
- **Collezioni:** `plan` (un record per giorno), `shopping` (uno per settimana), `settings` (record unico), `photos` (una foto per ricetta, 960×600 JPEG; il record si cerca per `recipe`), `recipes`, `ingredients` (catalogo). Regole: solo utenti autenticati. Registrazione pubblica disattivata.
- **Locale per dispositivo:** `shopMode` (Controllo a casa / Al mercato).
- **Service worker:** file dell'app stale-while-revalidate, foto e font cache-first, `/api/` sempre in rete.
- **Ricette nel database** (migrazione `1761980400_recipes.js`, che ha importato le 17 di esempio): `recipes` = nome, `ingredients` `[[nome, quantità, unità]]` per una persona adulta (l'olio è un ingrediente, "Olio extravergine"), `steps`, `vis` (illustrazione), `archived` (eliminata: sparisce da elenco, selettore e riempimento ma resta nei pasti pianificati). `ingredients` = catalogo per nome: `cats` (id delle categorie), `c`/`p`/`f`/`fib` per 100 g, `unit_g` (peso di un'unità). `categories` = `name`, `color` (indice 0–9 della tavolozza `--k0…--k9` in `app.css`), `order`, `goal` `{min, max}` (migrazione `1762156800_categories.js`: le sette fonti proteiche sono diventate categorie; via `prot`, `dept`, `recipes.cat`, `recipes.oil`, `settings.goals`). Pasto e tipo (migrazione `1762243200_types.js`): `recipes.meals` (`["pranzo","cena"]`), `recipes.types` (id), collezione `types` (`name`, `order`; iniziali `tferiale0000000`, `tfestivo0000000`), `settings.schedule` (settimana tipo `{pranzo:[7], cena:[7]}`, null = qualsiasi), `plan.kinds` (tipo cambiato per quel giorno; `kindOf()` in `app.js`). Persone (migrazione `1762416000_persone.js`, che ha diviso per 2,5 le quantità esistenti): `plan.people` `{pranzo:[adulti,bambini], cena:[…]}` (salvato quando si sceglie una ricetta; `peopleOf()`), `settings.people` `{a, b, kid}` (persone proposte per i pasti nuovi e % di un adulto che mangia un bambino; `pplFactor()`). In `app.js` `rebuildRecipes()` costruisce `CAT` (categorie in ordine), `R` (attive), `byId` (tutte, più gli alias dei vecchi id tipo `ceci` → `rceci0000000000`; `r.k` = categorie della ricetta) e `ING`. Id: ricette e categorie nuove casuali, ingredienti `i` + hash del nome (casuale se quell'id è già preso da un ingrediente rinominato). La coda `outbox` gestisce anche le eliminazioni (`del: true`).
- Online su https://cucinario.ededona.es: container su `127.0.0.1:8091`, nginx in Docker gestito con Ansible dal repo `infra` sulla Raspberry (`~/infra`, voce `cucinario` in `proxy_sites`).
- Deploy: `./deploy.sh` (git pull + `docker compose up -d --build`), anche da cron ogni 5 minuti.
- Backup: cron interno di PocketBase, lunedì 3:00, ultimi 8 in `pb_data/backups/`.

## Funzionalità (tutte presenti)

### Vista Settimana (schermata principale)
- Si apre sulla **settimana corrente** e scorre a **oggi**; scorrendo in su si vedono i giorni passati.
- Frecce o swipe orizzontale per le altre settimane. Toccare la data riporta a oggi.
- Ogni giorno: **pranzo** e **cena**.
- **Giorni passati e pasti passati di oggi: opachi**. Il pranzo di oggi diventa "passato" dopo un orario configurabile (default **18:00**), la cena dopo le **23:00**.
- Ogni ricetta ha una **foto** (illustrazione generata, o foto vera caricata dal telefono).
- Home pulita: nessuna impostazione in fondo alla pagina.

### Categorie
Le crea e gestisce la famiglia (Impostazioni → Obiettivi settimanali e categorie): nome, colore, obiettivo. Hanno sostituito "fonte proteica" e "reparto" (novembre 2026); quelle iniziali sono le sette fonti proteiche: lenticchie, fagioli, ceci, pesce, carne, uova, latticini.
- Un **ingrediente** ha zero o più categorie; una **ricetta** ha tutte le categorie dei suoi ingredienti (non si scelgono sulla ricetta). Es. polpette = carne + uova (+ latticini se il parmigiano è segnato latticini).
- Le categorie sono: i **tag** di ricette e ingredienti, i **filtri** delle due liste e la base degli **obiettivi settimanali**.
- Eliminare una categoria la toglie da tutti gli ingredienti e ne cancella l'obiettivo.

### Pasto e tipo
- Ogni ricetta ha un **pasto**: pranzo e/o cena (fisso, almeno uno) e uno o più **tipi** (personalizzabili, all'inizio **Feriale** e **Festivo**; "Lavoro" scartato perché coincide col pranzo feriale). Si scelgono nell'editor con dei chip; elenco e dettaglio li mostrano ("Pranzo e cena · Feriale, Festivo").
- **Settimana tipo** (Impostazioni → Pasti e tipi, insieme a creare/rinominare/eliminare i tipi): il tipo di ogni pranzo e cena da lunedì a domenica. Default: pranzi lun–ven e cene lun–gio feriali; venerdì sera e fine settimana festivi. "Qualsiasi" = nessun vincolo.
- **Per una sola settimana** (es. festivo infrasettimanale): "✦ Riempi" → **Tipi di questa settimana**, oppure il menu "Tipo di questo pasto" nel selettore. I pasti cambiati sono evidenziati in arancione nella settimana; "Torna alla settimana tipo" annulla.
- Nella settimana ogni pasto mostra il suo tipo ("PRANZO · FERIALE").
- **Riempi** usa solo ricette adatte al pasto e al suo tipo; se per un pasto non ce n'è nessuna lo lascia vuoto e lo dice. Il **selettore** mostra prima le adatte e sotto, sbiadite, "Non adatte a questo pasto" (sempre sceglibili).
- Una ricetta senza tipi (es. dopo aver eliminato il suo unico tipo) va bene per tutti. Eliminare un tipo lo toglie dalle ricette e mette "qualsiasi" nella settimana tipo.

### Obiettivi settimanali
- Per categoria: **almeno N** e/o **al massimo N** volte a settimana (pranzi + cene). Un pasto conta una volta per ognuna delle sue categorie.
- Valori iniziali: lenticchie ≥1, fagioli ≥1, ceci ≥1, pesce ≥2, carne ≤2, uova ≤2, latticini ≤3 (in produzione sono quelli che aveva impostato la famiglia).
- Accanto alla data della settimana, un'**icona**: ✓ verde se tutti gli obiettivi sono rispettati, ! arancione se no, grigia se la settimana è vuota.
- Toccandola si apre il **resoconto**: una tessera per categoria con conteggio / obiettivo, verde se rispettato, arancione con "manca 1" o "+1 di troppo"; da lì "Modifica obiettivi". (Prima le tessere stavano fisse in cima: troppo ingombranti.)
- Il selettore avvisa cosa manca e mette prima le ricette con le categorie che servono.

### Pasto fuori casa
- In cima al selettore, con **nota** (suggerimenti: Ristorante, Pizza, Pranzo al lavoro, Salto il pasto…).
- Nella settimana: **sfondo rosso con simbolo di divieto** su forchetta e coltello, nota al posto del nome.
- **Non conta** per obiettivi né per la spesa.

### Pulsante "✦ Riempi"
- **Riempi solo gli spazi vuoti** / **Rifai tutta la settimana** (i fuori casa restano).
- **Copia una settimana passata** (mantiene i fuori casa della settimana corrente).
- **Svuota la settimana.**
- Regole del riempimento automatico (`autofill`: ricerca locale che minimizza un costo, partendo da scelte a caso e cambiando un pasto alla volta; in ordine di peso):
  1. rispettare **minimi** e **massimi** di ogni categoria;
  2. **evitare la stessa categoria a pranzo e a cena dello stesso giorno** (contando anche i pasti scelti a mano);
  3. evitare di ripetere la stessa ricetta nella settimana;
  4. un po' di varietà tra le categorie;
  5. **cena → pranzo del giorno dopo**: cuciniamo la cena e insieme il pranzo del giorno dopo, quindi il pranzo preferisce ricette che **condividono ingredienti** con la cena della sera prima (esclusi minori: aglio, erbe, limone, farina, capperi, parmigiano, burro, vino, olio). I pranzi collegati mostrano "🔗 con la cena di ieri"; il dettaglio dice cosa hanno in comune; nel selettore queste ricette compaiono per prime.

### Dettaglio ricetta
- Foto, categorie, ingredienti con quantità, procedimento. Dalla settimana le quantità sono per le persone di quel pasto (con − + per cambiarle); dall'elenco Ricette sono per una persona.
- **Bilanciamento del pasto** (solo qui, NON nella vista settimanale: ogni singolo pasto dev'essere bilanciato, non si compensa tra pasti):
  - verdetto: "Pasto bilanciato" o "Da rivedere" con cosa non va;
  - **carboidrati, proteine, grassi in % sulle calorie** e in grammi, con barra che mostra **intervallo** e valore;
  - **fibre in grammi** con un minimo; calorie a persona (porzione di un adulto).
- Intervalli default: carboidrati **45–60%**, proteine **15–25%**, grassi **20–35%**, fibre **≥ 8 g** a pasto. Modificabili.
- Valori calcolati dagli ingredienti (catalogo: per 100 g + peso di un'unità); l'olio è un ingrediente come gli altri (le ricette di esempio ne hanno 12–25 g).
- Nell'elenco Ricette, le ricette fuori intervallo hanno solo un **triangolino arancione** (non un'etichetta testuale, che si confondeva con i tag delle categorie).

### Porzioni
- Nell'editor le quantità si scrivono **per una persona adulta**; il bilanciamento è sulla porzione di un adulto.
- Ogni pasto della settimana ha le sue **persone: adulti e bambini** (− + nel selettore e nel dettaglio del pasto). Si parte da quelle di casa (Impostazioni → Persone e porzioni, default **2 adulti + 1 bambino**); nella settimana sono scritte sotto il nome solo se diverse da quelle di casa.
- Un **bambino mangia il 60%** di un adulto (modificabile, 10–100%). Quantità del pasto = per persona × (adulti + bambini × %).
- Dettaglio del pasto: grammi interi, pezzi e cucchiai al mezzo. Spesa: somma dei pasti, grammi interi, pezzi arrotondati per eccesso.
- Riempi e Copia usano le persone già scelte per quel pasto (o quelle di casa); Copia porta anche le persone della settimana copiata.

### Lista della spesa
- **Non è per settimana** (novembre 2026): somma gli ingredienti di **tutti i pasti ancora da fare** (da adesso in poi, con gli orari di "passato"; per le persone di ogni pasto), in un unico elenco alfabetico; in cima "Per N pasti da fare, da … a …". Al mercato sotto ogni prodotto le ricette che lo usano. I fuori casa non contano. Nessuna freccia di settimana nella scheda Spesa.
- **Spesa fatta** (in fondo, al mercato): i pasti in lista diventano "comprati" ed escono dalla spesa (`done` `{"data|pasto": id ricetta}`: se la ricetta del pasto cambia, torna in lista); i prodotti non spuntati passano in Altro con la quantità ("Pasta · 900 g"); spunte e "a casa" si azzerano; le cose di Altro spuntate spariscono.
- In fondo, **Altro**: cose che non vengono dalle ricette (detersivo, pane…), aggiunte a mano col campo in fondo e tolte con ✕ (in Controllo a casa); al mercato si spuntano come le altre e il campo per aggiungere c'è ancora.
- Dati: un solo record `shopping` (`week` = "lista", id `wlista000000000`, migrazione `1762588800_spesa_unica.js`) con `checks`, `have`, `extra` `[{id, n}]` e `done`; in `app.js` `S.shop`, `shopMeals()`, `shopDone()`. I vecchi record per settimana restano nel database ma non si usano.
- Due modalità:
  - **Controllo a casa**: ogni riga ha **− quantità +** per scalare ciò che ho già. Passo: 1 per i pezzi, 50 g (100 g sopra il kg). Toccando il nome = "ce l'ho tutto".
  - **Al mercato**: lista da spuntare con quantità ridotte; barra di avanzamento; presi in fondo; "Già in casa" in una riga in fondo. Deve funzionare **offline**.

### Ricette e ingredienti: creare, modificare, eliminare
- Scheda Ricette → **＋ Nuova ricetta**; dal dettaglio di una ricetta (anche dal pasto in settimana) → **Modifica** / **Elimina**.
- Editor: nome, righe ingrediente (nome dal catalogo, quantità, unità), procedimento (un passaggio per riga). Le categorie e il pannello del bilanciamento si aggiornano mentre si scrive.
- Ingrediente non ancora nel catalogo: la riga diventa arancione e chiede categorie, valori per 100 g e peso di un'unità; non si salva finché non sono inseriti. Cambiare i valori di un ingrediente esistente vale per tutte le ricette.
- **Valori automatici da Open Food Facts** (gratis, licenza ODbL; Claude API valutata e scartata per non avere costi): nei campi di un ingrediente (catalogo ed editor) ci sono **🔍 Cerca i valori** (per nome; elenco di prodotti con carb · prot · grassi · fibre per 100 g, prima i nomi uguali o che iniziano col nome cercato) e **▦ Codice a barre** (foto; `BarcodeDetector` su Android, ZXing altrimenti; se non legge, cifre a mano). Toccando un prodotto i valori si compilano e restano modificabili. Per un ingrediente nuovo la ricerca parte da sola: nell'editor, appena si scrive un nome che non è nel catalogo, si apre il suo pannello già con i risultati. Un ingrediente nuovo non si salva finché non ha valori (scelti o scritti; uno 0 scritto a mano vale, es. il sale). Prodotti senza valori o tutti a zero sono scartati. Serve la rete.
- **Catalogo ingredienti**: scheda Ricette → interruttore **Ricette / Ingredienti**. Elenco alfabetico con ricerca e filtro per categoria, "in N ricette" (solo ricette attive) e tag delle categorie; **＋ Nuovo**; toccando un ingrediente si modificano nome, categorie (chip da accendere) e valori.
  - **Rinominare** aggiorna il nome in tutte le ricette che lo usano (anche quelle eliminate, senza mostrarle).
  - Cambiare le categorie di un ingrediente cambia subito quelle delle ricette che lo usano.
  - **Eliminare** è possibile solo se nessuna ricetta attiva lo usa: altrimenti mostra l'elenco delle ricette. Le ricette eliminate non contano (né nel conteggio né nell'elenco); se ne usavano uno eliminato, nei pasti passati quell'ingrediente non ha più valori e, ripristinando la ricetta, l'editor lo chiede come nuovo. Eliminare un ingrediente lo cancella davvero dal database.
- Eliminare = archiviare; salvare dall'editor una ricetta eliminata la ripristina.

### Impostazioni (scheda in basso)
Obiettivi settimanali e categorie (creare, rinominare, colore, eliminare), Pasti e tipi (tipi e settimana tipo), Pasto bilanciato (intervalli), Persone e porzioni, Orari dei pasti, Account (esci).

### Navigazione
Barra in basso: **Settimana · Spesa · Ricette · Impostazioni**.

## Da fare / domande aperte
1. **Pasti composti?** Molti secondi risultano "da rivedere" perché sono il piatto da solo (es. orata senza contorno né pane). Decidere se un pasto può avere più elementi (secondo + contorno + pane) con bilanciamento sull'insieme, oppure se ogni ricetta include già tutto.
2. **Opzione "avanzi di ieri sera"**: copiare la cena nel pranzo del giorno dopo senza duplicare gli ingredienti nella spesa (proposta, non confermata).
3. Inserire le nostre ricette vere: il 31/10/2026 ricette, ingredienti e foto sono stati azzerati in produzione (migrazione `1762329600_azzera_ricette.js`; pasti fuori casa, categorie, tipi e impostazioni restano).

## Note
- Alternative scartate: Firebase Spark (Cloud Storage richiede Blaze), artifact con database condiviso di Claude.
- Claude Code sulla Raspberry (comandarla dal telefono): `claude remote-control` dentro tmux con ciclo di riavvio, avviato con `@reboot` da cron; "Require trusted devices" attivo; SSH dal telefono come riserva.
