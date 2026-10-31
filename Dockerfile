FROM alpine:3.22

# Aggiornare qui per passare a una nuova versione di PocketBase
ARG PB_VERSION=0.40.5

RUN apk add --no-cache ca-certificates tzdata \
 && case "$(uname -m)" in \
      x86_64) ARCH=amd64 ;; \
      aarch64) ARCH=arm64 ;; \
      armv7l|armv6l) ARCH=armv7 ;; \
      *) echo "Architettura non supportata: $(uname -m)"; exit 1 ;; \
    esac \
 && cd /tmp \
 && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip" \
 && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/checksums.txt" \
 && grep "pocketbase_${PB_VERSION}_linux_${ARCH}.zip" checksums.txt | sha256sum -c - \
 && mkdir -p /pb && unzip -q "pocketbase_${PB_VERSION}_linux_${ARCH}.zip" pocketbase -d /pb \
 && rm -f /tmp/*

COPY pb_migrations /pb/pb_migrations
COPY pb_public /pb/pb_public

ENV TZ=Europe/Rome
EXPOSE 8090
VOLUME /pb/pb_data

HEALTHCHECK --interval=60s --timeout=5s --start-period=20s \
  CMD wget -q -O /dev/null http://127.0.0.1:8090/api/health || exit 1

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", \
     "--publicDir=/pb/pb_public", "--migrationsDir=/pb/pb_migrations", "--automigrate=false"]
