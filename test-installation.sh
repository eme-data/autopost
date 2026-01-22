#!/bin/bash

# Script de test pour vérifier l'installation d'AutoPost

echo "========================================="
echo "  Test d'installation AutoPost"
echo "========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ERRORS=0

# Test 1 : Node.js
echo -n "Test 1 - Node.js installé : "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js non trouvé${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 2 : npm
echo -n "Test 2 - npm installé : "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ ${NPM_VERSION}${NC}"
else
    echo -e "${RED}✗ npm non trouvé${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 3 : Structure du projet
echo -n "Test 3 - Structure du projet : "
if [ -d "backend" ] && [ -d "frontend" ]; then
    echo -e "${GREEN}✓ Dossiers présents${NC}"
else
    echo -e "${RED}✗ Structure manquante${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 4 : Fichier .env backend
echo -n "Test 4 - Configuration backend : "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ backend/.env trouvé${NC}"
else
    echo -e "${YELLOW}⚠ backend/.env manquant${NC}"
    echo "   → Copiez backend/.env.example vers backend/.env"
    ERRORS=$((ERRORS + 1))
fi

# Test 5 : Dépendances backend
echo -n "Test 5 - Dépendances backend : "
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓ Installées${NC}"
else
    echo -e "${RED}✗ Non installées${NC}"
    echo "   → Exécutez : cd backend && npm install"
    ERRORS=$((ERRORS + 1))
fi

# Test 6 : Frontend buildé
echo -n "Test 6 - Frontend buildé : "
if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✓ Build présent${NC}"
else
    echo -e "${YELLOW}⚠ Build manquant${NC}"
    echo "   → Exécutez : cd frontend && npm install && npm run build"
    ERRORS=$((ERRORS + 1))
fi

# Test 7 : PM2
echo -n "Test 7 - PM2 installé : "
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✓ Installé${NC}"
else
    echo -e "${YELLOW}⚠ PM2 non trouvé (optionnel)${NC}"
    echo "   → Installez avec : sudo npm install -g pm2"
fi

# Test 8 : Nginx
echo -n "Test 8 - Nginx installé : "
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓ Installé${NC}"
else
    echo -e "${YELLOW}⚠ Nginx non trouvé (optionnel)${NC}"
    echo "   → Installez avec : sudo apt install nginx"
fi

# Test 9 : Backend démarré
echo -n "Test 9 - Backend en cours d'exécution : "
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend répond${NC}"
else
    echo -e "${YELLOW}⚠ Backend non accessible${NC}"
    echo "   → Démarrez avec : pm2 start ecosystem.config.js"
fi

# Test 10 : Validation du .env
if [ -f "backend/.env" ]; then
    echo ""
    echo "Test 10 - Validation de la configuration :"

    # Vérifier JWT_SECRET
    JWT_SECRET=$(grep "^JWT_SECRET=" backend/.env | cut -d '=' -f2)
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "your-super-secret-jwt-key-change-this-in-production" ]; then
        echo -e "  ${RED}✗ JWT_SECRET non configuré ou valeur par défaut${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}✓ JWT_SECRET configuré${NC}"
    fi

    # Vérifier ANTHROPIC_API_KEY
    ANTHROPIC_KEY=$(grep "^ANTHROPIC_API_KEY=" backend/.env | cut -d '=' -f2)
    if [ -z "$ANTHROPIC_KEY" ] || [ "$ANTHROPIC_KEY" == "your-anthropic-api-key-here" ]; then
        echo -e "  ${RED}✗ ANTHROPIC_API_KEY non configuré${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}✓ ANTHROPIC_API_KEY configuré${NC}"
    fi

    # Vérifier GEMINI_API_KEY
    GEMINI_KEY=$(grep "^GEMINI_API_KEY=" backend/.env | cut -d '=' -f2)
    if [ -z "$GEMINI_KEY" ] || [ "$GEMINI_KEY" == "your-gemini-api-key-here" ]; then
        echo -e "  ${RED}✗ GEMINI_API_KEY non configuré${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}✓ GEMINI_API_KEY configuré${NC}"
    fi
fi

# Résultat final
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Tous les tests sont passés !${NC}"
    echo "========================================="
    echo ""
    echo "L'installation est prête. Vous pouvez :"
    echo "  1. Démarrer le backend : pm2 start ecosystem.config.js"
    echo "  2. Accéder à l'application sur votre domaine"
    echo ""
else
    echo -e "${RED}✗ ${ERRORS} erreur(s) détectée(s)${NC}"
    echo "========================================="
    echo ""
    echo "Veuillez corriger les erreurs ci-dessus avant de continuer."
    echo "Consultez INSTALLATION.md pour plus de détails."
    echo ""
fi
