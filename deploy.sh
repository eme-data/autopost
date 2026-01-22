#!/bin/bash

# Script de déploiement pour serveur Linux
# Usage: ./deploy.sh

set -e  # Arrêter le script en cas d'erreur

echo "========================================="
echo "  Déploiement AutoPost"
echo "========================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo -e "${RED}Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# 1. Backend
echo -e "${YELLOW}[1/5] Installation des dépendances backend...${NC}"
cd backend
npm install --production
cd ..
echo -e "${GREEN}✓ Dépendances backend installées${NC}"

# 2. Configuration backend
echo -e "${YELLOW}[2/5] Configuration backend...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Fichier .env manquant. Copie de .env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠ IMPORTANT: Éditez backend/.env avec vos clés API et configurations${NC}"
fi
echo -e "${GREEN}✓ Configuration backend vérifiée${NC}"

# 3. Frontend
echo -e "${YELLOW}[3/5] Installation des dépendances frontend...${NC}"
cd frontend
npm install
echo -e "${GREEN}✓ Dépendances frontend installées${NC}"

# 4. Build frontend
echo -e "${YELLOW}[4/5] Build du frontend...${NC}"
npm run build
cd ..
echo -e "${GREEN}✓ Frontend buildé avec succès${NC}"

# 5. PM2
echo -e "${YELLOW}[5/5] Démarrage avec PM2...${NC}"

# Vérifier si PM2 est installé
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 n'est pas installé. Installation...${NC}"
    npm install -g pm2
fi

# Créer le dossier de logs s'il n'existe pas
mkdir -p logs

# Démarrer ou redémarrer l'application
pm2 delete autopost-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}✓ Application démarrée avec PM2${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}  Déploiement terminé avec succès !${NC}"
echo "========================================="
echo ""
echo "Prochaines étapes:"
echo "1. Éditez backend/.env avec vos clés API"
echo "2. Configurez nginx (voir nginx.conf)"
echo "3. Redémarrez nginx: sudo systemctl restart nginx"
echo ""
echo "Commandes utiles:"
echo "  pm2 status           - Voir le statut"
echo "  pm2 logs             - Voir les logs"
echo "  pm2 restart all      - Redémarrer"
echo "  pm2 stop all         - Arrêter"
echo ""
