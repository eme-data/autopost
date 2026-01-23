#!/bin/bash

# Script pour créer la Pull Request avec GitHub CLI
# Usage: ./create-pr.sh

set -e

echo "========================================="
echo "  Création de la Pull Request"
echo "========================================="
echo ""

# Vérifier que gh est installé
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) n'est pas installé"
    echo ""
    echo "Installez-le avec:"
    echo "  apt install gh"
    echo ""
    echo "Ou créez la PR manuellement:"
    echo "  https://github.com/eme-data/autopost/compare/claude/social-media-post-generator-CoQ6Z"
    exit 1
fi

# Vérifier l'authentification
if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI n'est pas authentifié"
    echo ""
    echo "Pour vous authentifier:"
    echo "  gh auth login"
    echo ""
    echo "Ou créez la PR manuellement:"
    echo "  https://github.com/eme-data/autopost/compare/claude/social-media-post-generator-CoQ6Z"
    exit 1
fi

# Lire la description depuis le fichier
DESCRIPTION=$(cat PR_DESCRIPTION.md)

# Créer la Pull Request
echo "Création de la Pull Request..."
echo ""

gh pr create \
  --title "Application AutoPost complète avec infrastructure de production" \
  --body-file PR_DESCRIPTION.md \
  --head claude/social-media-post-generator-CoQ6Z

echo ""
echo "✅ Pull Request créée avec succès !"
echo ""
echo "Pour voir la PR:"
echo "  gh pr view --web"
echo ""
