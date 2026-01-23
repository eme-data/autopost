# Guide HTTPS pour AutoPost

Ce guide explique comment sécuriser votre application AutoPost avec HTTPS en utilisant Let's Encrypt.

## 🔒 Pourquoi HTTPS ?

**HTTPS est essentiel pour :**
- ✅ Chiffrer les communications entre le navigateur et le serveur
- ✅ Protéger les mots de passe et données sensibles
- ✅ Éviter les attaques "Man-in-the-Middle"
- ✅ Améliorer le référencement SEO
- ✅ Inspirer confiance aux utilisateurs
- ✅ **Obligatoire pour OAuth LinkedIn/Facebook** (exigent HTTPS en production)

## 📋 Prérequis

Avant de configurer HTTPS, vous devez avoir :

1. **Un nom de domaine** (ex: autopost.example.com)
   - Vous ne pouvez pas obtenir de certificat SSL pour une adresse IP
   - Le domaine doit vous appartenir

2. **DNS configuré**
   - Créez un enregistrement A pointant vers l'IP de votre serveur
   - Attendez la propagation DNS (quelques minutes à quelques heures)

3. **Nginx installé et fonctionnel**
   - Déjà configuré par le script `deploy.sh`

4. **Port 80 accessible depuis Internet**
   - Let's Encrypt a besoin d'accéder au port 80 pour valider votre domaine

## 🚀 Installation Automatique (Recommandé)

### Méthode Rapide

```bash
# Depuis le dossier du projet
./setup-https.sh votre-domaine.com votre@email.com
```

**Exemple :**
```bash
./setup-https.sh autopost.mycompany.com admin@mycompany.com
```

### Ce que fait le script automatiquement :

1. ✅ Vérifie que le domaine pointe vers le serveur
2. ✅ Installe Certbot (si nécessaire)
3. ✅ Met à jour la configuration Nginx avec votre domaine
4. ✅ Obtient le certificat SSL auprès de Let's Encrypt
5. ✅ Configure la redirection HTTP → HTTPS
6. ✅ Met à jour le fichier `.env` avec les URLs HTTPS
7. ✅ Redémarre le backend
8. ✅ Configure le renouvellement automatique

### Mode Test

Pour tester sans obtenir un vrai certificat :

```bash
./setup-https.sh votre-domaine.com votre@email.com --test
```

Cela effectue un "dry-run" pour vérifier que tout fonctionne sans consommer la limite de certificats.

## 📝 Installation Manuelle

Si vous préférez configurer manuellement :

### 1. Installer Certbot

```bash
apt update
apt install -y certbot python3-certbot-nginx
```

### 2. Vérifier la Configuration DNS

```bash
# Vérifier que le domaine pointe vers votre serveur
dig +short votre-domaine.com

# Devrait retourner l'IP de votre serveur
```

### 3. Mettre à Jour Nginx

Éditez `/etc/nginx/sites-available/autopost` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;  # ← Changez ici

    # ... reste de la configuration
}
```

Testez et rechargez :

```bash
nginx -t
nginx -s reload
```

### 4. Obtenir le Certificat SSL

```bash
certbot --nginx -d votre-domaine.com --email votre@email.com --agree-tos --redirect
```

**Options :**
- `--nginx` : Utilise le plugin Nginx
- `-d votre-domaine.com` : Votre domaine
- `--email` : Email pour les notifications d'expiration
- `--agree-tos` : Accepte les conditions d'utilisation
- `--redirect` : Configure automatiquement la redirection HTTP → HTTPS

### 5. Mettre à Jour le Backend

Éditez `backend/.env` :

```bash
nano backend/.env
```

Changez :
```env
FRONTEND_URL=https://votre-domaine.com
LINKEDIN_REDIRECT_URI=https://votre-domaine.com/api/oauth/linkedin/callback
FACEBOOK_REDIRECT_URI=https://votre-domaine.com/api/oauth/facebook/callback
```

Redémarrez le backend :
```bash
pm2 restart autopost-backend
```

## 🔧 Gestion des Certificats

Utilisez le script `manage-ssl.sh` pour gérer vos certificats :

### Voir le Statut des Certificats

```bash
./manage-ssl.sh status
```

Affiche tous les certificats installés avec leurs dates d'expiration.

### Informations Détaillées

```bash
./manage-ssl.sh info
```

Affiche :
- Domaines couverts
- Date d'expiration
- Jours restants avant expiration
- Chemin des certificats

### Renouveler Manuellement

```bash
./manage-ssl.sh renew
```

Renouvelle tous les certificats qui arrivent à expiration (< 30 jours).

### Tester le Renouvellement

```bash
./manage-ssl.sh test-renew
```

Effectue un test (dry-run) du renouvellement sans toucher aux certificats.

### Forcer le Renouvellement

```bash
./manage-ssl.sh force-renew
```

Force le renouvellement même si le certificat n'expire pas bientôt.

### Vérifier le Renouvellement Automatique

```bash
./manage-ssl.sh check-timer
```

Vérifie que le timer systemd est actif pour le renouvellement automatique.

### Révoquer un Certificat

```bash
./manage-ssl.sh revoke
```

Révoque et supprime un certificat (action irréversible).

## 🔄 Renouvellement Automatique

Les certificats Let's Encrypt sont valides **90 jours**.

### Configuration Automatique

Certbot configure automatiquement le renouvellement via systemd :

```bash
# Vérifier le statut
systemctl status certbot.timer

# Voir la prochaine exécution
systemctl list-timers certbot.timer
```

### Test du Renouvellement

```bash
# Test avec dry-run (recommandé)
certbot renew --dry-run

# Ou avec le script
./manage-ssl.sh test-renew
```

### Renouvellement Manuel

Si vous devez renouveler manuellement :

```bash
certbot renew
nginx -s reload
```

## 📊 Vérification et Tests

### Tester HTTPS

1. **Accédez à votre site :**
   ```
   https://votre-domaine.com
   ```

2. **Vérifiez le cadenas** 🔒 dans la barre d'adresse du navigateur

3. **Testez la redirection HTTP → HTTPS :**
   ```bash
   curl -I http://votre-domaine.com
   # Devrait retourner un code 301 vers HTTPS
   ```

### SSL Labs Test

Testez la qualité de votre configuration SSL :

```
https://www.ssllabs.com/ssltest/analyze.html?d=votre-domaine.com
```

**Objectif : Note A ou A+**

### Vérifier le Certificat

```bash
# Voir les détails du certificat
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com < /dev/null | openssl x509 -noout -dates

# Vérifier l'expiration
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com < /dev/null | openssl x509 -noout -checkend 0
```

## 🔍 Dépannage

### Erreur : "Timeout during connect"

**Cause :** Le port 80 n'est pas accessible depuis Internet

**Solutions :**
```bash
# Vérifier que Nginx écoute sur le port 80
lsof -i :80

# Vérifier le firewall
iptables -L -n | grep 80

# Ouvrir le port si nécessaire
ufw allow 80
ufw allow 443
```

### Erreur : "DNS problem: NXDOMAIN"

**Cause :** Le domaine ne résout pas

**Solutions :**
```bash
# Vérifier la résolution DNS
dig +short votre-domaine.com
nslookup votre-domaine.com

# Attendre la propagation DNS (peut prendre plusieurs heures)
```

### Erreur : "Too many certificates already issued"

**Cause :** Limite de 5 certificats par semaine pour un domaine

**Solutions :**
- Attendez une semaine
- Utilisez `--test` ou `--dry-run` pour tester d'abord
- Utilisez un sous-domaine différent

### Erreur : "Failed authorization procedure"

**Cause :** Let's Encrypt ne peut pas valider votre domaine

**Solutions :**
```bash
# Vérifier que Nginx sert bien le domaine
curl http://votre-domaine.com

# Vérifier les logs Certbot
tail -100 /var/log/letsencrypt/letsencrypt.log

# Tester la configuration Nginx
nginx -t
```

### Certificat Non Renouvelé Automatiquement

```bash
# Vérifier le timer
systemctl status certbot.timer

# Activer le timer si nécessaire
systemctl enable certbot.timer
systemctl start certbot.timer

# Vérifier les logs
journalctl -u certbot.timer -n 50
```

## 🔐 Améliorer la Sécurité SSL

### Configuration SSL Optimale

Éditez `/etc/nginx/sites-available/autopost` et ajoutez dans le bloc `server` HTTPS :

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Protocoles et chiffrements sécurisés
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/votre-domaine.com/chain.pem;

    # Session SSL
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Headers de sécurité additionnels
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ... reste de la configuration
}
```

Rechargez Nginx :
```bash
nginx -t
nginx -s reload
```

### Tester la Configuration

```bash
# Test SSL Labs (devrait donner A+)
https://www.ssllabs.com/ssltest/analyze.html?d=votre-domaine.com

# Test des headers de sécurité
https://securityheaders.com/?q=https://votre-domaine.com
```

## 📚 Fichiers et Chemins Importants

### Certificats Let's Encrypt

```
/etc/letsencrypt/live/votre-domaine.com/
├── cert.pem           # Certificat du domaine
├── chain.pem          # Chaîne de certificats
├── fullchain.pem      # Certificat + chaîne (utilisé par Nginx)
└── privkey.pem        # Clé privée (utilisé par Nginx)
```

### Configuration Nginx

```
/etc/nginx/sites-available/autopost  # Configuration
/etc/nginx/sites-enabled/autopost    # Lien symbolique
```

### Logs

```
/var/log/letsencrypt/letsencrypt.log  # Logs Certbot
/var/log/nginx/autopost-access.log    # Accès Nginx
/var/log/nginx/autopost-error.log     # Erreurs Nginx
```

## 🔄 Mise à Jour OAuth après HTTPS

Une fois HTTPS configuré, mettez à jour vos applications OAuth :

### LinkedIn

1. Allez sur https://www.linkedin.com/developers/apps
2. Sélectionnez votre application
3. Dans "Auth" → "Redirect URLs", changez :
   ```
   http://21.0.0.224/api/oauth/linkedin/callback
   ```
   En :
   ```
   https://votre-domaine.com/api/oauth/linkedin/callback
   ```

### Facebook

1. Allez sur https://developers.facebook.com/apps
2. Sélectionnez votre application
3. Dans "Facebook Login" → "Valid OAuth Redirect URIs", changez :
   ```
   http://21.0.0.224/api/oauth/facebook/callback
   ```
   En :
   ```
   https://votre-domaine.com/api/oauth/facebook/callback
   ```

## 📋 Checklist de Production

Avant de mettre en production avec HTTPS :

- [ ] Domaine configuré et pointant vers le serveur
- [ ] Certificat SSL obtenu et valide
- [ ] Redirection HTTP → HTTPS fonctionnelle
- [ ] `.env` mis à jour avec URLs HTTPS
- [ ] Backend redémarré
- [ ] OAuth LinkedIn/Facebook mis à jour
- [ ] Test SSL Labs > A
- [ ] Renouvellement automatique configuré
- [ ] Backup de la configuration Nginx effectué

## 🆘 Commandes de Secours

Si quelque chose ne va pas :

```bash
# Restaurer la configuration HTTP (sans HTTPS)
cp /etc/nginx/sites-available/autopost.backup /etc/nginx/sites-available/autopost
nginx -s reload

# Supprimer un certificat problématique
certbot delete --cert-name votre-domaine.com

# Réinitialiser complètement
certbot revoke --cert-name votre-domaine.com
certbot delete --cert-name votre-domaine.com
rm -rf /etc/letsencrypt/live/votre-domaine.com
rm -rf /etc/letsencrypt/archive/votre-domaine.com
rm -rf /etc/letsencrypt/renewal/votre-domaine.com.conf
```

## 📞 Support et Ressources

- **Documentation Let's Encrypt :** https://letsencrypt.org/docs/
- **Certbot :** https://certbot.eff.org/
- **SSL Labs :** https://www.ssllabs.com/ssltest/
- **Security Headers :** https://securityheaders.com/
- **Mozilla SSL Config Generator :** https://ssl-config.mozilla.org/

## 💡 Conseils

1. **Testez d'abord en dry-run** avant d'obtenir un vrai certificat
2. **Configurez le renouvellement automatique** dès le début
3. **Surveillez la date d'expiration** (Let's Encrypt envoie des emails)
4. **Sauvegardez votre configuration** avant de faire des changements
5. **Utilisez HSTS** une fois que HTTPS fonctionne parfaitement
6. **Testez régulièrement** avec SSL Labs

---

**Configuration créée le :** 2026-01-23
**Scripts disponibles :**
- `setup-https.sh` - Installation automatique HTTPS
- `manage-ssl.sh` - Gestion des certificats SSL
