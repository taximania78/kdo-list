
# syntax=docker/dockerfile:1

# ============================================================
# STAGE 0 — Base Node.js pour les builds
# ============================================================
FROM node:24-alpine3.24 AS node-base


# ============================================================
# STAGE 1 — Dépendances complètes
# ============================================================
FROM node-base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# ============================================================
# STAGE 2 — Dépendances de production
# ============================================================
FROM node-base AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


# ============================================================
# STAGE 3 — Compilation Next.js
# ============================================================
FROM node-base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .

RUN npm run build


# ============================================================
# STAGE 4 — Runtime Alpine minimal sans npm
# ============================================================
FROM alpine:3.24 AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Bibliothèques nécessaires à Node.js,
# certificats TLS et gestion des signaux
RUN apk add --no-cache \
      libatomic \
      libstdc++ \
      ca-certificates \
      dumb-init \
    && addgroup -S -g 1001 nodejs \
    && adduser -S -u 1001 -G nodejs nextjs

# Copier uniquement le binaire Node.js
# Aucun npm, npx ou Yarn dans le runtime
COPY --from=node-base \
    /usr/local/bin/node /usr/local/bin/node

# Vérifier que Node.js fonctionne
RUN node --version

# Ressources publiques
COPY --from=builder /app/public ./public

# Configuration applicative
COPY --from=builder --chmod=644 \
    /app/package.json ./package.json

# Build Next.js
COPY --from=builder /app/.next ./.next

# Dépendances de production uniquement
COPY --from=prod-deps \
    /app/node_modules ./node_modules

# Fichiers applicatifs lisibles, non modifiables
# par l'utilisateur d'exécution
RUN chmod -R a+rX /app/public /app/.next \
    && mkdir -p /app/public/kdos /app/.next/cache \
    && chown -R nextjs:nodejs /app/.next/cache \
    && chmod -R u+rwX,go-rwx /app/.next/cache

# Exécution non-root
USER 1001:1001

EXPOSE 3000

# Démarrage direct sans npm
# dumb-init gère correctement les signaux d'arrêt
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "node_modules/next/dist/bin/next", "start"]
