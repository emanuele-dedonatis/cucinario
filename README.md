# Cucinario

App di famiglia per pianificare pranzi e cene della settimana, con obiettivi per fonte proteica, riempimento automatico, lista della spesa e bilanciamento dei pasti.

- **Indirizzo:** https://ededona.es:8092
- **Backend:** [PocketBase](https://pocketbase.io) v0.40.5 in un solo container (SQLite, login, sincronizzazione in tempo reale, foto, file statici).
- **Frontend:** PWA in HTML/CSS/JS senza build (`pb_public/`), installabile sulla home di iPhone e Android, utilizzabile anche offline.

```
Dockerfile             immagine: alpine + binario PocketBase (amd64 / arm64 / armv7)
docker-compose.yml     servizio "cucinario" su 127.0.0.1:8091, dati in ./pb_data
deploy.sh              git pull + rebuild, solo se ci sono novità (adatto a cron)
pb_migrations/         schema del database (applicato in automatico all'avvio)
pb_public/             l'app: index.html, app.css, app.js, sw.js, manifest, icone, SDK PocketBase
```

## Prima installazione sulla Raspberry

Serve un sistema a 64 bit (consigliato) con Docker e il plugin `docker compose`.

```bash
git clone git@github.com:<utente>/cucinario.git ~/cucinario
cd ~/cucinario
docker compose up -d --build
```

### 1. Account amministratore

```bash
docker compose exec cucinario /pb/pocketbase superuser upsert TUA@EMAIL.it 'una-password-lunga' --dir=/pb/pb_data
```

La dashboard di amministrazione è su `https://ededona.es:8092/_/`.

### 2. Utenti della famiglia

Dalla dashboard: **Collections → users → New record**, una volta per persona (email, password, spunta *verified*). Le registrazioni pubbliche sono disattivate: entra solo chi crei tu.

### 3. Reverse proxy

Il container ascolta in HTTP solo su `127.0.0.1:8091` (la 8090 è di ChirpStack); nginx la pubblica sulla porta successiva. HTTPS lo fa l'nginx della Raspberry, gestito con Ansible nel repo [infra](https://github.com/emanuele-dedonatis/infra): la voce `cucinario` in `group_vars/all/reverse_proxy.yml` pubblica `ededona.es` sulla porta 8092 (serve il port forwarding 8092 sul router). La sincronizzazione in tempo reale usa Server-Sent Events: per questo il proxy ha `proxy_buffering off` e un `read_timeout` lungo.

### 4. Installare l'app sul telefono

Apri `https://ededona.es:8092`, accedi, poi:

- **iPhone (Safari):** Condividi → *Aggiungi alla schermata Home*.
- **Android (Chrome):** menu ⋮ → *Installa app*.

## Aggiornare

```bash
cd ~/cucinario && ./deploy.sh
```

Per il deploy automatico a ogni push su `main`, aggiungi a `crontab -e`:

```
*/5 * * * * cd ~/cucinario && ./deploy.sh >> deploy.log 2>&1
```

Il cron deve poter fare `git fetch` senza password: usa una deploy key in sola lettura (GitHub → repo → Settings → Deploy keys).

I telefoni ricevono la nuova versione dell'app alla riapertura successiva: il service worker mostra subito la copia in cache e scarica quella nuova in background.

## Backup

- **Automatico:** ogni lunedì alle 3:00 PocketBase crea uno zip in `pb_data/backups/` e tiene gli ultimi 8 (si cambia da dashboard → *Settings → Backups*, dove si può anche attivare la copia su uno storage S3).
- **Copia fuori dalla Raspberry** (consigliata), ad esempio da un altro computer:

  ```bash
  rsync -a raspi:~/cucinario/pb_data/backups/ ~/backup-cucinario/
  ```

- **Ripristino:** dashboard → *Settings → Backups* → *Restore*, oppure a container fermo si sostituisce la cartella `pb_data`.

## Sviluppo in locale

Senza Docker: scarica il binario di PocketBase per il tuo sistema da GitHub Releases e lancia, dalla radice del repo:

```bash
./pocketbase serve --dir=./pb_data --publicDir=./pb_public --migrationsDir=./pb_migrations --automigrate=false
```

L'app è su <http://127.0.0.1:8090>, la dashboard su <http://127.0.0.1:8090/_/>.

Con Docker: `docker compose up --build`, poi <http://127.0.0.1:8091>.

## Come funzionano i dati

| Collezione | Contenuto | Id del record |
|---|---|---|
| `plan` | un giorno: `date`, `pranzo`, `cena` (id ricetta, `{"o":"nota"}` se fuori casa, oppure `null`) | `p` + data, es. `p20261031000000` |
| `shopping` | una settimana: `week` (lunedì), `checks` (spunte), `have` (già a casa) | `w` + data del lunedì |
| `settings` | `goals`, `ranges`, `times` | `settings0000000` |
| `photos` | `recipe`, `image` | `ph` + hash dell'id ricetta |

Gli id sono deterministici, così ogni telefono sa quale record aggiornare anche se è stato creato dall'altro. Ogni modifica finisce in una coda locale (`localStorage`) e parte appena c'è rete; il server rimanda le modifiche all'altro telefono in tempo reale. Se due modifiche toccano lo stesso campo, vince l'ultima.

Le ricette per ora sono nel codice (`R` in `pb_public/app.js`).
