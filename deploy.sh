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

# =========================================
# Vérification et installation des prérequis
# =========================================
echo -e "${YELLOW}[0/5] Vérification des prérequis...${NC}"

# Fonction pour vérifier une commande
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓ $1 est installé${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 n'est pas installé${NC}"
        return 1
    fi
}

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js n'est pas accessible via PATH${NC}"

    # Vérifier si Node.js existe dans /opt/node22
    if [ -f "/opt/node22/bin/node" ]; then
        echo -e "${YELLOW}Node.js trouvé dans /opt/node22, création des liens symboliques...${NC}"
        ln -sf /opt/node22/bin/node /usr/local/bin/node
        ln -sf /opt/node22/bin/npm /usr/local/bin/npm
        ln -sf /opt/node22/bin/npx /usr/local/bin/npx
        echo -e "${GREEN}✓ Liens symboliques créés${NC}"
    else
        echo -e "${RED}Node.js n'est pas installé${NC}"
        echo -e "${YELLOW}Installation de Node.js 20 LTS...${NC}"

        # Déterminer le système d'exploitation
        if [ -f /etc/debian_version ]; then
            # Debian/Ubuntu
            apt-get update
            apt-get install -y curl
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        elif [ -f /etc/redhat-release ]; then
            # RedHat/CentOS/Fedora
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            yum install -y nodejs
        else
            echo -e "${RED}Système d'exploitation non supporté pour l'installation automatique${NC}"
            echo -e "${YELLOW}Veuillez installer Node.js 18+ manuellement depuis https://nodejs.org/${NC}"
            exit 1
        fi
    fi
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION est installé${NC}"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm n'est pas installé${NC}"
    echo -e "${YELLOW}npm devrait être installé avec Node.js${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm $NPM_VERSION est installé${NC}"
fi

# Vérifier Git (optionnel mais recommandé)
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓ $GIT_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ Git n'est pas installé (optionnel)${NC}"
fi

# Vérifier SQLite3 (optionnel, fourni par le package npm)
if command -v sqlite3 &> /dev/null; then
    echo -e "${GREEN}✓ SQLite3 est installé${NC}"
else
    echo -e "${YELLOW}⚠ SQLite3 CLI n'est pas installé (optionnel, le package npm sera utilisé)${NC}"
fi

echo -e "${GREEN}✓ Tous les prérequis requis sont satisfaits${NC}"
echo ""

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

# Détecter l'IP du serveur
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo -e "${GREEN}✓ Application déployée et accessible${NC}"
echo ""
echo "URL d'accès:"
echo "  http://$SERVER_IP"
echo ""
echo "Prochaines étapes:"
echo "1. Créer un compte administrateur:"
echo "   cd backend && npm run create-admin email@example.com password Prenom Nom"
echo ""
echo "2. Configurer les clés API:"
echo "   nano backend/.env"
echo "   - ANTHROPIC_API_KEY (https://console.anthropic.com/)"
echo "   - GEMINI_API_KEY (https://makersuite.google.com/app/apikey)"
echo "   - JWT_SECRET (changez pour une clé forte)"
echo "   Puis: pm2 restart autopost-backend"
echo ""
echo "3. Initialiser les paramètres de configuration:"
echo "   cd backend && npm run init-settings"
echo ""
echo "4. (Optionnel) Configurer HTTPS avec Let's Encrypt:"
echo "   ./setup-https.sh votre-domaine.com votre@email.com"
echo "   Voir NGINX_SETUP.md pour plus de détails"
echo ""
echo "Commandes utiles:"
echo "  pm2 status              - Voir le statut de l'application"
echo "  pm2 logs                - Voir les logs en temps réel"
echo "  pm2 restart all         - Redémarrer l'application"
echo "  nginx -s reload         - Recharger Nginx"
echo "  ./manage-ssl.sh status  - Statut des certificats SSL"
echo ""
