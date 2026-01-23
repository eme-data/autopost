#!/bin/bash

# Script de gestion des certificats SSL
# Usage: ./manage-ssl.sh [commande]

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

show_usage() {
    echo "========================================="
    echo "  Gestion des Certificats SSL"
    echo "========================================="
    echo ""
    echo "Usage: ./manage-ssl.sh [commande]"
    echo ""
    echo "Commandes disponibles:"
    echo "  status        - Afficher le statut des certificats"
    echo "  renew         - Renouveler les certificats manuellement"
    echo "  test-renew    - Tester le renouvellement (dry-run)"
    echo "  info          - Informations détaillées sur les certificats"
    echo "  revoke        - Révoquer un certificat"
    echo "  check-timer   - Vérifier le renouvellement automatique"
    echo "  force-renew   - Forcer le renouvellement même si pas expiré"
    echo ""
    echo "Exemples:"
    echo "  ./manage-ssl.sh status"
    echo "  ./manage-ssl.sh renew"
    echo "  ./manage-ssl.sh test-renew"
    echo ""
}

check_certbot() {
    if ! command -v certbot &> /dev/null; then
        echo -e "${RED}✗ Certbot n'est pas installé${NC}"
        echo "Installez-le avec: apt install certbot python3-certbot-nginx"
        exit 1
    fi
}

show_status() {
    echo -e "${BLUE}Statut des certificats SSL:${NC}"
    echo ""
    certbot certificates
    echo ""
}

show_info() {
    echo -e "${BLUE}Informations détaillées:${NC}"
    echo ""

    if [ -d "/etc/letsencrypt/live" ]; then
        for domain_dir in /etc/letsencrypt/live/*/; do
            if [ -d "$domain_dir" ]; then
                domain=$(basename "$domain_dir")
                echo -e "${GREEN}Domaine: $domain${NC}"

                if [ -f "$domain_dir/cert.pem" ]; then
                    echo "Certificat: $domain_dir/cert.pem"
                    echo "Validité:"
                    openssl x509 -in "$domain_dir/cert.pem" -noout -dates
                    echo ""
                    echo "Expiration dans:"
                    openssl x509 -in "$domain_dir/cert.pem" -noout -checkend 0 && \
                        echo "  ✓ Certificat valide" || \
                        echo "  ✗ Certificat expiré !"

                    # Calculer les jours restants
                    expiry_date=$(openssl x509 -in "$domain_dir/cert.pem" -noout -enddate | cut -d= -f2)
                    expiry_epoch=$(date -d "$expiry_date" +%s)
                    current_epoch=$(date +%s)
                    days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))

                    if [ $days_left -gt 30 ]; then
                        echo -e "  ${GREEN}$days_left jours restants${NC}"
                    elif [ $days_left -gt 7 ]; then
                        echo -e "  ${YELLOW}$days_left jours restants${NC}"
                    else
                        echo -e "  ${RED}$days_left jours restants - Renouvelez vite !${NC}"
                    fi

                    echo ""
                fi
            fi
        done
    else
        echo -e "${YELLOW}Aucun certificat trouvé${NC}"
    fi
}

renew_certificates() {
    echo -e "${YELLOW}Renouvellement des certificats...${NC}"
    echo ""

    certbot renew

    echo ""
    echo -e "${GREEN}✓ Renouvellement terminé${NC}"
    echo ""
    echo "Rechargement de Nginx..."
    nginx -s reload
    echo -e "${GREEN}✓ Nginx rechargé${NC}"
}

test_renew() {
    echo -e "${YELLOW}Test du renouvellement (dry-run)...${NC}"
    echo ""

    certbot renew --dry-run

    echo ""
    echo -e "${GREEN}✓ Test réussi ! Le renouvellement fonctionnera correctement.${NC}"
}

force_renew() {
    echo -e "${YELLOW}Forcer le renouvellement...${NC}"
    echo ""

    certbot renew --force-renewal

    echo ""
    echo -e "${GREEN}✓ Renouvellement forcé terminé${NC}"
    echo ""
    echo "Rechargement de Nginx..."
    nginx -s reload
    echo -e "${GREEN}✓ Nginx rechargé${NC}"
}

check_timer() {
    echo -e "${BLUE}Statut du renouvellement automatique:${NC}"
    echo ""

    if systemctl is-active --quiet certbot.timer; then
        echo -e "${GREEN}✓ Timer actif${NC}"
        echo ""
        systemctl status certbot.timer --no-pager
        echo ""
        echo "Prochaine exécution:"
        systemctl list-timers certbot.timer --no-pager
    else
        echo -e "${RED}✗ Timer inactif${NC}"
        echo ""
        echo "Pour l'activer:"
        echo "  systemctl enable certbot.timer"
        echo "  systemctl start certbot.timer"
    fi
}

revoke_certificate() {
    echo -e "${RED}Révocation d'un certificat${NC}"
    echo ""

    # Lister les certificats
    certbot certificates

    echo ""
    read -p "Entrez le nom de domaine à révoquer: " domain

    if [ -z "$domain" ]; then
        echo -e "${RED}Aucun domaine spécifié${NC}"
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}⚠ Attention: Cette action est irréversible !${NC}"
    read -p "Êtes-vous sûr de vouloir révoquer le certificat pour $domain ? (yes/NO): " confirm

    if [ "$confirm" = "yes" ]; then
        certbot revoke --cert-name "$domain"
        certbot delete --cert-name "$domain"
        echo -e "${GREEN}✓ Certificat révoqué et supprimé${NC}"
    else
        echo "Annulé"
        exit 0
    fi
}

# Vérifier les arguments
if [ -z "$1" ]; then
    show_usage
    exit 0
fi

# Vérifier que certbot est installé
check_certbot

# Exécuter la commande
case "$1" in
    status)
        show_status
        ;;
    info)
        show_info
        ;;
    renew)
        renew_certificates
        ;;
    test-renew)
        test_renew
        ;;
    force-renew)
        force_renew
        ;;
    check-timer)
        check_timer
        ;;
    revoke)
        revoke_certificate
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Commande inconnue: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
