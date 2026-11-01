
# syntax=docker/dockerfile:1

# ============================================================
# STAGE 1 — Dépendances complètes pour la compilation
# ============================================================
FROM node:24-alpine3.24 AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Installation reproductible depuis le lockfile
RUN npm ci


# ============================================================
# STAGE 2 — Dépendances de production uniquement
# ============================================================
FROM node:24-alpine3.24 AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./

# Exclut les devDependencies de l'image finale
RUN npm ci --omit=dev


# ============================================================
# STAGE 3 — Compilation Next.js
# ============================================================
FROM node:24-alpine3.24 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# URL publique intégrée au build Next.js
# Ne jamais utiliser ARG pour transmettre des secrets
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .

RUN npm run build


# ============================================================
# STAGE 4 — Image de production
# ============================================================
FROM node:24-alpine3.24 AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Utilisateur et groupe dédiés
RUN addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

# Fichiers publics : propriété root, lecture autorisée
COPY --from=builder /app/public ./public

# package.json : lecture seule pour l'application
COPY --from=builder --chmod=644 \
    /app/package.json ./package.json

# Build Next.js : fichiers applicatifs appartenant à root
COPY --from=builder /app/.next ./.next

# Uniquement les dépendances de production
COPY --from=prod-deps /app/node_modules ./node_modules

# Permissions :
# - Lecture des fichiers publics et du build Next.js
# - Pas d'écriture dans le code applicatif
# - Écriture limitée au cache Next.js
RUN chmod -R a+rX /app/public /app/.next && \
    mkdir -p /app/public/kdos /app/.next/cache && \
    chown -R nextjs:nodejs /app/.next/cache && \
    chmod -R u+rwX,go-rwx /app/.next/cache

# Exécution sans privilèges root
USER 1001:1001

EXPOSE 3000

CMD ["npm", "start"]
