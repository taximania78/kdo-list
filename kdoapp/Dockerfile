# --------- Étape 1 : install des dépendances ---------
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# --------- Étape 2 : build Next.js -------------------
FROM node:18-alpine AS builder
WORKDIR /app
# Copie des deps installées
COPY --from=deps /app/node_modules ./node_modules

# Variable d'environnement pour le build
# On déclare les build-args
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_THEME

# On exporte ces args en ENV pour que Next.js les lise au build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_THEME=${NEXT_PUBLIC_THEME}

# Copie du reste du code (y compris config.json, public/, etc.)
COPY . .

RUN npm run build && \
    echo "🗂  .next contenu :" && find .next -maxdepth 2

# --------- Étape 3 : image runtime minimale ----------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Télémetry off, sinon Next demande l'opt‑in
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un groupe et utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copie uniquement ce qui est nécessaire pour run
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copier le dossier .next avec les bonnes permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Passer à l'utilisateur non-root
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
