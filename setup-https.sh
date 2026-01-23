#!/bin/bash

# Script d'installation et configuration HTTPS avec Let's Encrypt
# Usage: ./setup-https.sh votre-domaine.com votre@email.com

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "  Configuration HTTPS avec Let's Encrypt"
echo "========================================="
echo ""

# Vérifier les arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Usage: ./setup-https.sh <domaine> <email>${NC}"
    echo ""
    echo "Exemples:"
    echo "  ./setup-https.sh autopost.example.com admin@example.com"
    echo "  ./setup-https.sh www.monsite.fr contact@monsite.fr"
    echo ""
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo -e "${YELLOW}Configuration pour:${NC}"
echo "  Domaine: $DOMAIN"
echo "  Email: $EMAIL"
echo ""

# Vérifier que nous sommes root
if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then
    echo -e "${YELLOW}Ce script nécessite les privilèges root${NC}"
    echo "Relancez avec: sudo ./setup-https.sh $DOMAIN $EMAIL"
    exit 1
fi

# Vérifier que le domaine pointe vers ce serveur
echo -e "${YELLOW}[1/6] Vérification DNS...${NC}"
SERVER_IP=$(hostname -I | awk '{print $1}')
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ -z "$DOMAIN_IP" ]; then
    echo -e "${RED}✗ Le domaine $DOMAIN ne résout pas vers une IP${NC}"
    echo -e "${YELLOW}Veuillez configurer votre DNS avant de continuer${NC}"
    echo "  1. Créez un enregistrement A pour $DOMAIN"
    echo "  2. Pointez-le vers l'IP de ce serveur: $SERVER_IP"
    echo "  3. Attendez la propagation DNS (peut prendre quelques minutes)"
    echo ""
    read -p "Voulez-vous continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ DNS configuré: $DOMAIN → $DOMAIN_IP${NC}"
    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        echo -e "${YELLOW}⚠ Attention: Le domaine pointe vers $DOMAIN_IP mais ce serveur est sur $SERVER_IP${NC}"
        read -p "Continuer quand même ? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Installer Certbot
echo -e "${YELLOW}[2/6] Installation de Certbot...${NC}"
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✓ Certbot déjà installé${NC}"
else
    apt update
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installé${NC}"
fi

# Mettre à jour la configuration Nginx avec le domaine
echo -e "${YELLOW}[3/6] Mise à jour de la configuration Nginx...${NC}"

# Backup de la config actuelle si elle existe
if [ -f /etc/nginx/sites-available/autopost ]; then
    cp /etc/nginx/sites-available/autopost /etc/nginx/sites-available/autopost.backup
    echo -e "${GREEN}✓ Backup de la configuration créé${NC}"
else
    echo -e "${RED}✗ Fichier de configuration Nginx non trouvé${NC}"
    echo "Veuillez d'abord déployer l'application avec ./deploy.sh"
    exit 1
fi

# Mettre à jour le server_name
sed -i "s/server_name .*/server_name $DOMAIN;/" /etc/nginx/sites-available/autopost

# Tester la configuration
nginx -t

echo -e "${GREEN}✓ Configuration Nginx mise à jour${NC}"

# Recharger Nginx
echo -e "${YELLOW}[4/6] Rechargement de Nginx...${NC}"
nginx -s reload
echo -e "${GREEN}✓ Nginx rechargé${NC}"

# Obtenir le certificat SSL
echo -e "${YELLOW}[5/6] Obtention du certificat SSL...${NC}"
echo "Cela peut prendre quelques instants..."

# Options pour Certbot
CERTBOT_OPTIONS="--nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect"

# Tester d'abord en mode dry-run si demandé
if [ "$3" = "--test" ]; then
    echo -e "${YELLOW}Mode test activé (dry-run)${NC}"
    certbot --nginx -d $DOMAIN --dry-run --email $EMAIL --agree-tos
    echo -e "${GREEN}✓ Test réussi ! Le certificat peut être obtenu.${NC}"
    echo "Relancez sans --test pour obtenir le vrai certificat"
    exit 0
fi

# Obtenir le certificat réel
if certbot $CERTBOT_OPTIONS; then
    echo -e "${GREEN}✓ Certificat SSL obtenu avec succès !${NC}"
else
    echo -e "${RED}✗ Erreur lors de l'obtention du certificat${NC}"
    echo ""
    echo "Causes possibles:"
    echo "  - Le domaine ne pointe pas vers ce serveur"
    echo "  - Le port 80 n'est pas accessible depuis Internet"
    echo "  - Le domaine a déjà atteint la limite de certificats (5 par semaine)"
    echo ""
    echo "Pour déboguer:"
    echo "  1. Vérifiez que le port 80 est ouvert: lsof -i :80"
    echo "  2. Testez l'accès: curl http://$DOMAIN"
    echo "  3. Vérifiez les logs Certbot: tail -100 /var/log/letsencrypt/letsencrypt.log"
    echo ""
    echo "Restauration de la configuration précédente..."
    mv /etc/nginx/sites-available/autopost.backup /etc/nginx/sites-available/autopost
    nginx -s reload
    exit 1
fi

# Mettre à jour le fichier .env
echo -e "${YELLOW}[6/6] Mise à jour de la configuration backend...${NC}"

if [ -f /home/user/autopost/backend/.env ]; then
    # Mettre à jour les URLs avec HTTPS
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" /home/user/autopost/backend/.env
    sed -i "s|LINKEDIN_REDIRECT_URI=.*|LINKEDIN_REDIRECT_URI=https://$DOMAIN/api/oauth/linkedin/callback|" /home/user/autopost/backend/.env
    sed -i "s|FACEBOOK_REDIRECT_URI=.*|FACEBOOK_REDIRECT_URI=https://$DOMAIN/api/oauth/facebook/callback|" /home/user/autopost/backend/.env

    echo -e "${GREEN}✓ Fichier .env mis à jour${NC}"

    # Redémarrer le backend
    if command -v pm2 &> /dev/null; then
        pm2 restart autopost-backend
        echo -e "${GREEN}✓ Backend redémarré${NC}"
    fi
fi

# Configuration du renouvellement automatique
echo ""
echo -e "${YELLOW}Configuration du renouvellement automatique...${NC}"
if systemctl is-active --quiet certbot.timer; then
    echo -e "${GREEN}✓ Renouvellement automatique déjà configuré${NC}"
else
    # Le timer systemd est normalement créé automatiquement par Certbot
    systemctl enable certbot.timer 2>/dev/null || echo "Timer systemd non disponible"
fi

# Test du renouvellement
echo -e "${YELLOW}Test du renouvellement automatique...${NC}"
if certbot renew --dry-run; then
    echo -e "${GREEN}✓ Le renouvellement automatique fonctionne${NC}"
else
    echo -e "${YELLOW}⚠ Le test de renouvellement a échoué${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}  Configuration HTTPS terminée !${NC}"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Votre site est maintenant accessible en HTTPS${NC}"
echo ""
echo "Informations:"
echo "  URL HTTPS: https://$DOMAIN"
echo "  Certificat: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Clé privée: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "  Validité: 90 jours"
echo "  Renouvellement: Automatique via certbot.timer"
echo ""
echo "Redirection HTTP → HTTPS:"
echo "  ✓ Automatiquement configurée par Certbot"
echo "  http://$DOMAIN → https://$DOMAIN"
echo ""
echo "Prochaines étapes:"
echo "  1. Testez votre site: https://$DOMAIN"
echo "  2. Vérifiez le score SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "  3. Mettez à jour vos configurations OAuth LinkedIn/Facebook avec la nouvelle URL"
echo ""
echo "Commandes utiles:"
echo "  certbot certificates              - Voir les certificats"
echo "  certbot renew                     - Renouveler manuellement"
echo "  certbot renew --dry-run           - Tester le renouvellement"
echo "  systemctl status certbot.timer    - Statut du renouvellement auto"
echo ""
