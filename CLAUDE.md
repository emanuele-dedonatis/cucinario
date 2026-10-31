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
- **Frontend** senza build in `pb_public/`: `index.html`, `app.css`, `app.js` (un'unica IIFE, stile compatto della demo), `sw.js`, `manifest.json`, SDK in `vendor/pocketbase.umd.js` (0.28.1).
- **Sincronizzazione** (`app.js`, sezione "Stato"): stato `S` in cache su `localStorage`; ogni modifica passa da `setSlot` / `queueSettings` / `queueShop` → coda `outbox` → `upsert` (update, se 404 create con id deterministico). Il realtime e `pull()` aggiornano `S`; `applyPending()` dà precedenza alle modifiche locali non ancora inviate. I campi json viaggiano come testo JSON (`wire`), così una stringa resta stringa.
- **Collezioni:** `plan` (un record per giorno), `shopping` (uno per settimana), `settings` (record unico), `photos` (una foto per ricetta, 960×600 JPEG; il record si cerca per `recipe`), `recipes`, `ingredients` (catalogo). Regole: solo utenti autenticati. Registrazione pubblica disattivata.
- **Locale per dispositivo:** `shopMode` (Controllo a casa / Al mercato).
- **Service worker:** file dell'app stale-while-revalidate, foto e font cache-first, `/api/` sempre in rete.
- **Ricette nel database** (migrazione `1761980400_recipes.js`, che ha importato le 17 di esempio): `recipes` = nome, `ingredients` `[[nome, quantità, unità]]` già per 2,5 porzioni (l'olio è un ingrediente, "Olio extravergine"), `steps`, `vis` (illustrazione), `archived` (eliminata: sparisce da elenco, selettore e riempimento ma resta nei pasti pianificati). `ingredients` = catalogo per nome: `cats` (id delle categorie), `c`/`p`/`f`/`fib` per 100 g, `unit_g` (peso di un'unità). `categories` = `name`, `color` (indice 0–9 della tavolozza `--k0…--k9` in `app.css`), `order`, `goal` `{min, max}` (migrazione `1762156800_categories.js`: le sette fonti proteiche sono diventate categorie; via `prot`, `dept`, `recipes.cat`, `recipes.oil`, `settings.goals`). In `app.js` `rebuildRecipes()` costruisce `CAT` (categorie in ordine), `R` (attive), `byId` (tutte, più gli alias dei vecchi id tipo `ceci` → `rceci0000000000`; `r.k` = categorie della ricetta) e `ING`. Id: ricette e categorie nuove casuali, ingredienti `i` + hash del nome (casuale se quell'id è già preso da un ingrediente rinominato). La coda `outbox` gestisce anche le eliminazioni (`del: true`).
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
- Le categorie sono: i **tag** di ricette e ingredienti, i **filtri** delle due liste, i **gruppi della lista della spesa** e la base degli **obiettivi settimanali**.
- Eliminare una categoria la toglie da tutti gli ingredienti e ne cancella l'obiettivo.

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
- Foto, categorie, porzioni, ingredienti con quantità, procedimento.
- **Bilanciamento del pasto** (solo qui, NON nella vista settimanale: ogni singolo pasto dev'essere bilanciato, non si compensa tra pasti):
  - verdetto: "Pasto bilanciato" o "Da rivedere" con cosa non va;
  - **carboidrati, proteine, grassi in % sulle calorie** e in grammi, con barra che mostra **intervallo** e valore;
  - **fibre in grammi** con un minimo; calorie per porzione.
- Intervalli default: carboidrati **45–60%**, proteine **15–25%**, grassi **20–35%**, fibre **≥ 8 g** a pasto. Modificabili.
- Valori calcolati dagli ingredienti (catalogo: per 100 g + peso di un'unità); l'olio è un ingrediente come gli altri (le ricette di esempio ne hanno 12–25 g).
- Nell'elenco Ricette, le ricette fuori intervallo hanno solo un **triangolino arancione** (non un'etichetta testuale, che si confondeva con i tag delle categorie).

### Porzioni
**Tutte le ricette sono per 2 adulti + 1 bambina = 2,5 porzioni.** (Porzioni variabili per pasto: valutate e scartate per ora.)

### Lista della spesa
- Somma gli ingredienti della settimana visualizzata, raggruppati per categoria (la prima dell'ingrediente, nell'ordine delle categorie; senza categoria in "Altro"); sotto ogni prodotto le ricette che lo usano. I fuori casa non contano.
- Due modalità:
  - **Controllo a casa**: ogni riga ha **− quantità +** per scalare ciò che ho già. Passo: 1 per i pezzi, 50 g (100 g sopra il kg). Toccando il nome = "ce l'ho tutto".
  - **Al mercato**: lista da spuntare con quantità ridotte; barra di avanzamento; presi in fondo; "Già in casa" in una riga in fondo. Deve funzionare **offline**.
- Quantità "a casa" e spunte valgono per la settimana visualizzata.

### Ricette e ingredienti: creare, modificare, eliminare
- Scheda Ricette → **＋ Nuova ricetta**; dal dettaglio di una ricetta (anche dal pasto in settimana) → **Modifica** / **Elimina**.
- Editor: nome, righe ingrediente (nome dal catalogo, quantità, unità), procedimento (un passaggio per riga). Le categorie e il pannello del bilanciamento si aggiornano mentre si scrive.
- Ingrediente non ancora nel catalogo: la riga diventa arancione e chiede categorie, valori per 100 g e peso di un'unità; non si salva finché non sono inseriti. Cambiare i valori di un ingrediente esistente vale per tutte le ricette.
- **Catalogo ingredienti**: scheda Ricette → interruttore **Ricette / Ingredienti**. Elenco alfabetico con ricerca e filtro per categoria, "in N ricette" (solo ricette attive) e tag delle categorie; **＋ Nuovo**; toccando un ingrediente si modificano nome, categorie (chip da accendere) e valori.
  - **Rinominare** aggiorna il nome in tutte le ricette che lo usano (anche quelle eliminate, senza mostrarle).
  - Cambiare le categorie di un ingrediente cambia subito quelle delle ricette che lo usano.
  - **Eliminare** è possibile solo se nessuna ricetta attiva lo usa: altrimenti mostra l'elenco delle ricette. Le ricette eliminate non contano (né nel conteggio né nell'elenco); se ne usavano uno eliminato, nei pasti passati quell'ingrediente non ha più valori e, ripristinando la ricetta, l'editor lo chiede come nuovo. Eliminare un ingrediente lo cancella davvero dal database.
- Eliminare = archiviare; salvare dall'editor una ricetta eliminata la ripristina.

### Impostazioni (scheda in basso)
Obiettivi settimanali e categorie (creare, rinominare, colore, eliminare), Pasto bilanciato (intervalli), Orari dei pasti, Account (esci).

### Navigazione
Barra in basso: **Settimana · Spesa · Ricette · Impostazioni**.

## Da fare / domande aperte
1. **Pasti composti?** Molti secondi risultano "da rivedere" perché sono il piatto da solo (es. orata senza contorno né pane). Decidere se un pasto può avere più elementi (secondo + contorno + pane) con bilanciamento sull'insieme, oppure se ogni ricetta include già tutto.
2. **Opzione "avanzi di ieri sera"**: copiare la cena nel pranzo del giorno dopo senza duplicare gli ingredienti nella spesa (proposta, non confermata).
3. Sostituire le 17 ricette di esempio con le nostre ricette vere.

## Note
- Alternative scartate: Firebase Spark (Cloud Storage richiede Blaze), artifact con database condiviso di Claude.
- Claude Code sulla Raspberry (comandarla dal telefono): `claude remote-control` dentro tmux con ciclo di riavvio, avviato con `@reboot` da cron; "Require trusted devices" attivo; SSH dal telefono come riserva.
