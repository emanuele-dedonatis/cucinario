#!/bin/sh
# Aggiorna Cucinario sulla Raspberry: scarica le modifiche e ricostruisce il container solo se serve.
# Uso manuale: ./deploy.sh        Da cron (ogni 5 minuti): */5 * * * * cd ~/cucinario && ./deploy.sh >> deploy.log 2>&1
set -e
cd "$(dirname "$0")"

git fetch --quiet origin main
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && [ "$1" != "--force" ]; then
  exit 0
fi

git pull --quiet --ff-only origin main
docker compose up -d --build
docker image prune -f > /dev/null
echo "$(date '+%F %T') deploy di $(git rev-parse --short HEAD)"
