#!/bin/bash

# ====================================
# Script de déploiement Docker - AutoPost
# ====================================

set -e  # Arrêt en cas d'erreur

echo "╔════════════════════════════════════════╗"
echo "║   🐳 AutoPost - Déploiement Docker    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_step() {
    echo -e "${BLUE}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Vérifier que Docker est installé
print_step "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Installez Docker Desktop ou Docker Engine."
    exit 1
fi
print_success "Docker trouvé: $(docker --version)"

# Détecter si docker-compose ou docker compose est disponible
print_step "Vérification de docker-compose..."
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    print_success "docker-compose V1 trouvé"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
    print_success "docker compose V2 trouvé"
else
    print_error "Ni 'docker-compose' ni 'docker compose' n'est disponible."
    exit 1
fi

# Vérifier si le fichier .env existe
print_step "Vérification du fichier .env..."
if [ ! -f .env ]; then
    print_warning "Fichier .env non trouvé"
    echo ""
    echo "Création du fichier .env depuis le template..."
    cp .env.docker .env
    print_success "Fichier .env créé"
    echo ""
    print_warning "⚠️  IMPORTANT: Éditez le fichier .env et configurez vos clés API !"
    echo "   Ouvrez .env et remplacez les valeurs 'your-*' par vos vraies clés"
    echo ""
    read -p "Appuyez sur Entrée après avoir configuré le fichier .env..."
else
    print_success "Fichier .env trouvé"
fi

# Arrêter les conteneurs existants (si présents)
print_step "Arrêt des conteneurs existants..."
$DOCKER_COMPOSE down 2>/dev/null || true
print_success "Conteneurs arrêtés"

# Build des images
print_step "Construction des images Docker..."
echo "   Cela peut prendre quelques minutes..."
if $DOCKER_COMPOSE build --no-cache; then
    print_success "Images construites avec succès"
else
    print_error "Échec de la construction des images"
    exit 1
fi

# Démarrage des conteneurs
print_step "Démarrage des conteneurs..."
if $DOCKER_COMPOSE up -d; then
    print_success "Conteneurs démarrés"
else
    print_error "Échec du démarrage des conteneurs"
    exit 1
fi

# Attendre que le backend soit prêt
print_step "Attente du démarrage du backend..."
sleep 5

# Vérifier le statut des conteneurs
print_step "Vérification du statut des conteneurs..."
$DOCKER_COMPOSE ps

# Healthcheck
print_step "Vérification de la santé de l'API..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost/api/health > /dev/null 2>&1; then
        print_success "API opérationnelle !"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "L'API ne répond pas après ${max_attempts} tentatives"
    echo ""
    echo "Logs du backend:"
    $DOCKER_COMPOSE logs backend
    exit 1
fi

echo ""
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✓ Déploiement réussi !               ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 Application accessible sur: http://localhost"
echo "📊 API Health: http://localhost/api/health"
echo ""
echo "📋 Commandes utiles:"
echo "   $DOCKER_COMPOSE logs -f              # Voir les logs en temps réel"
echo "   $DOCKER_COMPOSE logs backend         # Logs du backend"
echo "   $DOCKER_COMPOSE logs frontend        # Logs du frontend"
echo "   $DOCKER_COMPOSE ps                   # Statut des conteneurs"
echo "   $DOCKER_COMPOSE restart              # Redémarrer"
echo "   $DOCKER_COMPOSE down                 # Arrêter"
echo ""
echo "👤 Créer un compte admin:"
echo "   $DOCKER_COMPOSE exec backend node create-admin.js admin@example.com password \"Admin Name\""
echo ""
print_success "Prêt à l'emploi ! 🚀"
