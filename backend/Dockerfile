# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les dépendances depuis le builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code source
COPY --chown=nodejs:nodejs . .

# Créer le dossier pour la base de données
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "server.js"]
