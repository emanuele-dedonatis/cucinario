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
- **Ricette nel database** (migrazione `1761980400_recipes.js`, che ha importato le 17 di esempio): `recipes` = nome, `cat`, `ingredients` `[[nome, quantità, unità]]` già per 2,5 porzioni, `steps`, `oil` (g per tutta la ricetta), `vis` (illustrazione), `archived` (eliminata: sparisce da elenco, selettore e riempimento ma resta nei pasti pianificati). `ingredients` = catalogo per nome: `dept` (reparto della spesa), `prot` (fonte proteica, vuoto se non lo è), `c`/`p`/`f`/`fib` per 100 g, `unit_g` (peso di un'unità). `recipes.cat` è solo una copia: la categoria la calcola `recipeCat()` in `app.js`. In `app.js` `rebuildRecipes()` costruisce `R` (attive), `byId` (tutte, più gli alias dei vecchi id tipo `ceci` → `rceci0000000000`) e `ING`. Id: ricette nuove casuali, ingredienti `i` + hash del nome (casuale se quell'id è già preso da un ingrediente rinominato). La coda `outbox` gestisce anche le eliminazioni (`del: true`).
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

### Categorie = fonti proteiche
Sette: **lenticchie, fagioli, ceci, pesce, carne, uova, latticini** (i legumi erano un'unica categoria, divisa in tre a novembre 2026).
- La categoria di una ricetta **non si sceglie**: ogni ingrediente può essere una fonte proteica, e la ricetta prende quella dell'ingrediente che porta più proteine (es. farro, ceci e feta → ceci).
- Una ricetta senza ingredienti "fonte proteica" mostra "Nessuna fonte proteica", non conta per gli obiettivi e il riempimento automatico non la usa.

### Obiettivi settimanali
- Per categoria: **almeno N** e/o **al massimo N** volte a settimana (pranzi + cene).
- Default: lenticchie ≥1, fagioli ≥1, ceci ≥1, pesce ≥2, carne ≤2, uova ≤2, latticini ≤3. Obiettivi salvati con categorie che non esistono più (es. `legumi`) vengono completati con i default (`normGoals`).
- Accanto alla data della settimana, un'**icona**: ✓ verde se tutti gli obiettivi sono rispettati, ! arancione se no, grigia se la settimana è vuota.
- Toccandola si apre il **resoconto**: 7 tessere su due righe (i tre legumi sopra) con conteggio / obiettivo, verde se rispettato, arancione con "manca 1" o "+1 di troppo"; da lì "Modifica obiettivi". (Prima le tessere stavano fisse in cima: troppo ingombranti con sette categorie.)
- Il selettore avvisa cosa manca e mette prima le categorie che servono.

### Pasto fuori casa
- In cima al selettore, con **nota** (suggerimenti: Ristorante, Pizza, Pranzo al lavoro, Salto il pasto…).
- Nella settimana: **sfondo rosso con simbolo di divieto** su forchetta e coltello, nota al posto del nome.
- **Non conta** per obiettivi né per la spesa.

### Pulsante "✦ Riempi"
- **Riempi solo gli spazi vuoti** / **Rifai tutta la settimana** (i fuori casa restano).
- **Copia una settimana passata** (mantiene i fuori casa della settimana corrente).
- **Svuota la settimana.**
- Regole del riempimento automatico:
  1. prima i **minimi**, poi completa **senza superare i massimi**, categorie varie;
  2. **mai la stessa fonte proteica a pranzo e a cena dello stesso giorno** (contando anche i pasti scelti a mano);
  3. evita di ripetere la stessa ricetta nella settimana;
  4. **cena → pranzo del giorno dopo**: cuciniamo la cena e insieme il pranzo del giorno dopo, quindi il pranzo preferisce ricette che **condividono ingredienti** con la cena della sera prima (esclusi minori: aglio, erbe, limone, farina, capperi, parmigiano, burro, vino). I pranzi collegati mostrano "🔗 con la cena di ieri"; il dettaglio dice cosa hanno in comune; nel selettore queste ricette compaiono per prime.

### Dettaglio ricetta
- Foto, fonte proteica, porzioni, ingredienti con quantità, procedimento.
- **Bilanciamento del pasto** (solo qui, NON nella vista settimanale: ogni singolo pasto dev'essere bilanciato, non si compensa tra pasti):
  - verdetto: "Pasto bilanciato" o "Da rivedere" con cosa non va;
  - **carboidrati, proteine, grassi in % sulle calorie** e in grammi, con barra che mostra **intervallo** e valore;
  - **fibre in grammi** con un minimo; calorie per porzione.
- Intervalli default: carboidrati **45–60%**, proteine **15–25%**, grassi **20–35%**, fibre **≥ 8 g** a pasto. Modificabili.
- Valori calcolati dagli ingredienti (catalogo: per 100 g + peso di un'unità) più l'olio della ricetta (default 25 g, circa un cucchiaio a testa).
- Nell'elenco Ricette, le ricette fuori intervallo hanno solo un **triangolino arancione** (non un'etichetta testuale, che si confondeva con il tag della proteina).

### Porzioni
**Tutte le ricette sono per 2 adulti + 1 bambina = 2,5 porzioni.** (Porzioni variabili per pasto: valutate e scartate per ora.)

### Lista della spesa
- Somma gli ingredienti della settimana visualizzata, per reparto (Frutta e verdura, Pesce, Carne, Latticini e uova, Pane e pasta, Dispensa); sotto ogni prodotto le ricette che lo usano. I fuori casa non contano.
- Due modalità:
  - **Controllo a casa**: ogni riga ha **− quantità +** per scalare ciò che ho già. Passo: 1 per i pezzi, 50 g (100 g sopra il kg). Toccando il nome = "ce l'ho tutto".
  - **Al mercato**: lista da spuntare con quantità ridotte; barra di avanzamento; presi in fondo; "Già in casa" in una riga in fondo. Deve funzionare **offline**.
- Quantità "a casa" e spunte valgono per la settimana visualizzata.

### Ricette e ingredienti: creare, modificare, eliminare
- Scheda Ricette → **＋ Nuova ricetta**; dal dettaglio di una ricetta (anche dal pasto in settimana) → **Modifica** / **Elimina**.
- Editor: nome, righe ingrediente (nome dal catalogo, quantità, unità), olio, procedimento (un passaggio per riga). La fonte proteica e il pannello del bilanciamento si aggiornano mentre si scrive.
- Ingrediente non ancora nel catalogo: la riga diventa arancione e chiede reparto, fonte proteica, valori per 100 g e peso di un'unità; non si salva finché non sono inseriti. Cambiare i valori di un ingrediente esistente vale per tutte le ricette.
- **Catalogo ingredienti**: scheda Ricette → interruttore **Ricette / Ingredienti**. Elenco per reparto con ricerca, "in N ricette" e tag della fonte proteica; **＋ Nuovo**; toccando un ingrediente si modificano nome, reparto, fonte proteica e valori.
  - **Rinominare** aggiorna il nome in tutte le ricette che lo usano (anche quelle eliminate).
  - Cambiare la fonte proteica ricalcola la categoria delle ricette.
  - **Eliminare** è possibile solo se nessuna ricetta lo usa (nemmeno eliminata): altrimenti mostra l'elenco delle ricette. Eliminare un ingrediente lo cancella davvero dal database.
- Eliminare = archiviare; salvare dall'editor una ricetta eliminata la ripristina.

### Impostazioni (scheda in basso)
Obiettivi settimanali, Pasto bilanciato (intervalli), Orari dei pasti, Account (esci).

### Navigazione
Barra in basso: **Settimana · Spesa · Ricette · Impostazioni**.

## Da fare / domande aperte
1. **Pasti composti?** Molti secondi risultano "da rivedere" perché sono il piatto da solo (es. orata senza contorno né pane). Decidere se un pasto può avere più elementi (secondo + contorno + pane) con bilanciamento sull'insieme, oppure se ogni ricetta include già tutto.
2. **Opzione "avanzi di ieri sera"**: copiare la cena nel pranzo del giorno dopo senza duplicare gli ingredienti nella spesa (proposta, non confermata).
3. Sostituire le 17 ricette di esempio con le nostre ricette vere.

## Note
- Alternative scartate: Firebase Spark (Cloud Storage richiede Blaze), artifact con database condiviso di Claude.
- Claude Code sulla Raspberry (comandarla dal telefono): `claude remote-control` dentro tmux con ciclo di riavvio, avviato con `@reboot` da cron; "Require trusted devices" attivo; SSH dal telefono come riserva.
