# --------- Étape 1 : install des dépendances ---------
  FROM node:18-alpine AS deps
  WORKDIR /app
  COPY package.json package-lock.json ./
  RUN npm ci --frozen-lockfile
  
  # --------- Étape 2 : build Next.js -------------------
  FROM node:18-alpine AS builder
  WORKDIR /app
  # Copie des deps installées
  COPY --from=deps /app/node_modules ./node_modules

  # Variable d'environnement pour le build
  ARG NEXT_PUBLIC_API_URL
  ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

  ARG NEXT_PUBLIC_THEME
  ENV NEXT_PUBLIC_THEME=${NEXT_PUBLIC_THEME}
  
  # Copie du reste du code (y compris config.json, public/, etc.)
  COPY . .
  
  # ───> Si votre build dépend d'une variable :
  # ARG NEXT_PUBLIC_API_ADDRESS
  # ENV NEXT_PUBLIC_API_ADDRESS=$NEXT_PUBLIC_API_ADDRESS
  
  RUN npm run build && \
      echo "🗂  .next contenu :" && find .next -maxdepth 2
  
  # --------- Étape 3 : image runtime minimale ----------
  FROM node:18-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  # Télémetry off, sinon Next demande l'opt‑in
  ENV NEXT_TELEMETRY_DISABLED=1
  
  # Copie uniquement ce qui est nécessaire pour run
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/package.json ./package.json
  
  EXPOSE 3000
  CMD ["npm", "start"]