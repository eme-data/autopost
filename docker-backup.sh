#!/bin/bash

# ====================================
# Script de sauvegarde Docker - AutoPost
# ====================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="autopost_backup_${TIMESTAMP}.tar.gz"

echo "╔════════════════════════════════════════╗"
echo "║   💾 AutoPost - Sauvegarde Docker     ║"
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

# Créer le dossier de sauvegarde
mkdir -p "$BACKUP_DIR"

# 1. Exporter le volume de base de données
print_step "Export de la base de données..."
docker run --rm -v autopost_sqlite_data:/data -v "$(pwd)/${BACKUP_DIR}:/backup" alpine tar czf "/backup/db_${TIMESTAMP}.tar.gz" -C /data .
print_success "Base de données exportée"

# 2. Sauvegarder le fichier .env
print_step "Sauvegarde de la configuration..."
if [ -f .env ]; then
    cp .env "${BACKUP_DIR}/.env_${TIMESTAMP}"
    print_success "Configuration sauvegardée"
fi

# 3. Créer une archive complète
print_step "Création de l'archive complète..."
tar czf "${BACKUP_DIR}/${BACKUP_FILE}" \
    --exclude='node_modules' \
    --exclude='frontend/dist' \
    --exclude='backend/data' \
    --exclude='backups' \
    .
print_success "Archive créée: ${BACKUP_FILE}"

echo ""
print_success "Sauvegarde terminée !"
echo "📦 Emplacement: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "📊 Base de données: ${BACKUP_DIR}/db_${TIMESTAMP}.tar.gz"

# Afficher la taille
echo ""
echo "Taille des sauvegardes:"
ls -lh "${BACKUP_DIR}" | tail -n +2
