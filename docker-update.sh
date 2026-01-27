#!/bin/bash

# ====================================
# Script de mise à jour Docker - AutoPost
# ====================================

set -e

echo "╔════════════════════════════════════════╗"
echo "║   🔄 AutoPost - Mise à jour Docker    ║"
echo "╚════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Détecter si docker-compose ou docker compose est disponible
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Erreur: ni 'docker-compose' ni 'docker compose' n'est disponible"
    exit 1
fi

print_success "Utilisation de: $DOCKER_COMPOSE"

# 1. Pull du code (si Git est utilisé)
if [ -d .git ]; then
    print_step "Récupération des dernières modifications..."
    git pull
    print_success "Code mis à jour"
else
    print_step "Pas de repository Git détecté, passage à l'étape suivante..."
fi

# 2. Rebuild des images
print_step "Reconstruction des images..."
$DOCKER_COMPOSE build --no-cache
print_success "Images reconstruites"

# 3. Redémarrage des services
print_step "Redémarrage des conteneurs..."
$DOCKER_COMPOSE up -d --force-recreate
print_success "Conteneurs redémarrés"

# 4. Nettoyage des anciennes images
print_step "Nettoyage des anciennes images..."
docker image prune -f
print_success "Nettoyage effectué"

# 5. Vérification
print_step "Vérification de l'état..."
sleep 3
$DOCKER_COMPOSE ps

echo ""
print_success "Mise à jour terminée ! 🚀"
echo ""
echo "Vérifier les logs: $DOCKER_COMPOSE logs -f"
