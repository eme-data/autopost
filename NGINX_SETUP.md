# Configuration Nginx pour AutoPost

Ce guide explique comment configurer et gérer Nginx pour servir votre application AutoPost.

## ✅ Configuration Actuelle

**Votre serveur est déjà configuré et fonctionnel !**

- **URL d'accès :** http://21.0.0.224
- **Port HTTP :** 80
- **Backend API :** http://21.0.0.224/api
- **Fichier de configuration :** /etc/nginx/sites-available/autopost
- **Logs :** /var/log/nginx/autopost-*.log

## 🌐 Accéder à l'Application

Ouvrez votre navigateur et accédez à :

```
http://21.0.0.224
```

**Ou si vous avez un nom de domaine :**
```
http://votre-domaine.com
```

## 📋 Architecture

```
┌─────────────┐
│  Navigateur │
└──────┬──────┘
       │ Port 80
       ▼
┌─────────────┐
│    Nginx    │ ← Reverse Proxy
└──────┬──────┘
       │
       ├──► /           → Frontend (fichiers statiques)
       │                  /home/user/autopost/frontend/dist
       │
       └──► /api/*      → Backend (Node.js)
                          http://localhost:5000
```

## 🔧 Commandes Nginx Utiles

### Gestion du Service

```bash
# Démarrer Nginx
nginx

# Arrêter Nginx
nginx -s stop

# Arrêt gracieux (termine les requêtes en cours)
nginx -s quit

# Recharger la configuration (sans interruption)
nginx -s reload

# Tester la configuration
nginx -t

# Vérifier si Nginx est actif
ps aux | grep nginx
```

### Logs

```bash
# Voir les logs d'accès
tail -f /var/log/nginx/autopost-access.log

# Voir les logs d'erreur
tail -f /var/log/nginx/autopost-error.log

# Afficher les 50 dernières lignes
tail -50 /var/log/nginx/autopost-access.log
```

## 📝 Fichier de Configuration

Le fichier de configuration se trouve ici :
```
/etc/nginx/sites-available/autopost
```

**Points clés de la configuration :**

1. **Frontend** : Sert les fichiers statiques depuis `/home/user/autopost/frontend/dist`
2. **Backend API** : Proxy inverse vers `http://localhost:5000`
3. **Optimisations** : Cache des fichiers statiques (1 an)
4. **Sécurité** : Headers de sécurité (X-Frame-Options, etc.)

## 🔄 Modifier la Configuration

Si vous devez modifier la configuration :

```bash
# Éditer le fichier
nano /etc/nginx/sites-available/autopost

# Tester la configuration
nginx -t

# Recharger Nginx
nginx -s reload
```

## 🌍 Utiliser un Nom de Domaine

Si vous avez un nom de domaine (ex: autopost.example.com) :

1. **Pointer le domaine vers votre serveur**
   - Créez un enregistrement DNS A pointant vers `21.0.0.224`

2. **Modifier la configuration Nginx**
   ```bash
   nano /etc/nginx/sites-available/autopost
   ```

   Changez la ligne :
   ```nginx
   server_name 21.0.0.224 autopost.local _;
   ```

   En :
   ```nginx
   server_name autopost.example.com;
   ```

3. **Recharger Nginx**
   ```bash
   nginx -t
   nginx -s reload
   ```

4. **Mettre à jour backend/.env**
   ```bash
   nano backend/.env
   ```

   Changez :
   ```
   FRONTEND_URL=http://autopost.example.com
   LINKEDIN_REDIRECT_URI=http://autopost.example.com/api/oauth/linkedin/callback
   FACEBOOK_REDIRECT_URI=http://autopost.example.com/api/oauth/facebook/callback
   ```

   Puis redémarrez le backend :
   ```bash
   pm2 restart autopost-backend
   ```

## 🔒 Activer HTTPS (SSL/TLS)

Pour sécuriser votre application avec HTTPS (fortement recommandé en production) :

### Méthode 1 : Let's Encrypt (Gratuit)

```bash
# 1. Installer Certbot
apt install -y certbot python3-certbot-nginx

# 2. Obtenir et configurer automatiquement le certificat SSL
certbot --nginx -d autopost.example.com

# 3. Suivre les instructions (entrez votre email, acceptez les conditions)

# 4. Le certificat sera automatiquement renouvelé tous les 90 jours
# Vérifier le renouvellement automatique :
certbot renew --dry-run
```

**Certbot va automatiquement :**
- Obtenir un certificat SSL valide
- Modifier votre configuration Nginx
- Rediriger HTTP vers HTTPS
- Configurer le renouvellement automatique

### Méthode 2 : Configuration Manuelle HTTPS

Si vous avez déjà un certificat SSL, décommentez la section HTTPS dans le fichier de configuration :

```bash
nano /etc/nginx/sites-available/autopost
```

Décommentez les lignes avec `#` dans la section HTTPS et ajustez les chemins vers vos certificats.

## 🚀 Performance et Optimisation

### Cache des Fichiers Statiques

La configuration actuelle met en cache les fichiers statiques pendant 1 an :

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Compression Gzip

Pour activer la compression Gzip, ajoutez dans `/etc/nginx/nginx.conf` :

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript
           application/x-javascript application/xml+rss
           application/json application/javascript;
```

Puis rechargez :
```bash
nginx -s reload
```

### Limite de Taille des Uploads

La limite actuelle est de 10MB. Pour modifier :

```nginx
client_max_body_size 50M;  # Par exemple, pour 50 MB
```

## 🔍 Diagnostic et Dépannage

### Vérifier que Nginx fonctionne

```bash
# Vérifier les processus
ps aux | grep nginx

# Vérifier les ports en écoute
lsof -i :80

# Tester l'accès HTTP
curl -I http://localhost:80

# Tester l'API
curl http://localhost:80/api/posts/history
```

### Erreur 502 Bad Gateway

Si vous obtenez une erreur 502, cela signifie que Nginx ne peut pas se connecter au backend :

```bash
# Vérifier que le backend fonctionne
pm2 status

# Vérifier les logs du backend
pm2 logs autopost-backend

# Redémarrer le backend
pm2 restart autopost-backend

# Vérifier que le port 5000 est actif
lsof -i :5000
```

### Erreur 404 sur le Frontend

Si vous obtenez des 404 sur les routes frontend :

```bash
# Vérifier que les fichiers frontend existent
ls -la /home/user/autopost/frontend/dist/

# Vérifier les permissions
chmod -R 755 /home/user/autopost/frontend/dist/

# Vérifier les logs Nginx
tail -f /var/log/nginx/autopost-error.log
```

### Erreur "Permission Denied"

```bash
# Vérifier les permissions du dossier
ls -la /home/user/autopost/frontend/

# Ajuster si nécessaire
chmod -R 755 /home/user/autopost/frontend/dist/
```

## 📊 Monitoring

### Voir les Statistiques en Temps Réel

```bash
# Nombre de connexions actives
ps aux | grep nginx | wc -l

# Logs d'accès en temps réel
tail -f /var/log/nginx/autopost-access.log

# Filtrer les erreurs 4xx et 5xx
tail -f /var/log/nginx/autopost-access.log | grep " [45][0-9][0-9] "

# Compter les requêtes par minute
tail -1000 /var/log/nginx/autopost-access.log | cut -d ' ' -f 4 | cut -d ':' -f 1-2 | uniq -c
```

## 🔄 Mise à Jour de l'Application

Quand vous mettez à jour le frontend :

```bash
# 1. Rebuild le frontend
cd /home/user/autopost/frontend
npm run build

# 2. Les nouveaux fichiers sont dans dist/
# Nginx les sert automatiquement

# 3. Vider le cache du navigateur ou utiliser Ctrl+F5
```

Pas besoin de redémarrer Nginx pour les fichiers statiques !

## 📋 Checklist de Production

Avant de mettre en production :

- [ ] Activer HTTPS avec Let's Encrypt
- [ ] Configurer un nom de domaine
- [ ] Mettre à jour les clés API dans `.env`
- [ ] Changer le `JWT_SECRET` dans `.env`
- [ ] Activer la compression Gzip
- [ ] Configurer les backups de la base de données
- [ ] Mettre en place un monitoring
- [ ] Configurer les alertes pour les erreurs 5xx
- [ ] Tester les routes OAuth avec les vraies URLs
- [ ] Vérifier que PM2 démarre au boot

## 🆘 Commandes de Secours

Si quelque chose ne va pas :

```bash
# Arrêter tout
nginx -s stop
pm2 stop autopost-backend

# Vérifier la configuration
nginx -t
pm2 logs autopost-backend --lines 50

# Redémarrer proprement
pm2 restart autopost-backend
nginx

# Vérifier que tout fonctionne
curl http://localhost:80
curl http://localhost:80/api/posts/history
```

## 📚 Ressources

- **Documentation Nginx** : https://nginx.org/en/docs/
- **Certbot (SSL)** : https://certbot.eff.org/
- **PM2** : https://pm2.keymetrics.io/

---

**Configuration actuelle générée le :** 2026-01-23
**IP du serveur :** 21.0.0.224
**URL d'accès :** http://21.0.0.224
