# 🐳 AutoPost - Guide Docker

Guide complet pour déployer et gérer AutoPost avec Docker.

---

## 🎯 Avantages Docker

✅ **Installation ultra-simple** : Une seule commande `docker-compose up`  
✅ **Isolation complète** : Pas de conflits avec d'autres applications  
✅ **Portabilité** : Fonctionne sur Windows, Linux, macOS  
✅ **Environnements identiques** : Dev = Staging = Production  
✅ **Mises à jour faciles** : Script automatisé  
✅ **Rollback rapide** : Retour arrière en quelques secondes  
✅ **Scaling prêt** : Préparé pour une montée en charge

---

## 📋 Prérequis

### Installation Docker

**Windows / macOS :**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Linux (Ubuntu/Debian) :**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Vérification :**
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### Installation en 3 étapes

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd autopost

# 2. Configurer l'environnement
cp .env.docker .env
nano .env  # Éditer avec vos clés API

# 3. Déployer avec Docker
chmod +x docker-deploy.sh
./docker-deploy.sh
```

**C'est tout ! 🎉**

L'application sera accessible sur **http://localhost**

---

## ⚙️ Configuration

### Fichier .env

Éditez le fichier `.env` et configurez vos clés :

```env
# Sécurité JWT (CHANGEZ CETTE CLÉ !)
JWT_SECRET=votre-cle-secrete-minimum-32-caracteres-aleatoires

# API Intelligence Artificielle
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...

# OAuth LinkedIn
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://localhost/api/oauth/linkedin/callback

# OAuth Facebook
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_REDIRECT_URI=http://localhost/api/oauth/facebook/callback

# Port externe (optionnel)
EXTERNAL_PORT=80
```

### Obtenir les clés API

- **Google (Gemini)** : https://makersuite.google.com/app/apikey
- **Groq** : https://console.groq.com/
- **Groq** : https://console.groq.com/
- **LinkedIn Developer** : https://www.linkedin.com/developers/
- **Facebook Developer** : https://developers.facebook.com/

---

## 🛠️ Utilisation

### Démarrage

```bash
# Déploiement complet (première fois)
./docker-deploy.sh

# OU manuellement
docker-compose up -d
```

### Arrêt

```bash
docker-compose down
```

### Redémarrage

```bash
docker-compose restart
```

### Logs

```bash
# Tous les logs en temps réel
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Frontend uniquement
docker-compose logs -f frontend

# Dernières 100 lignes
docker-compose logs --tail=100
```

### Statut des conteneurs

```bash
docker-compose ps
```

---

## 👤 Gestion des utilisateurs

### Créer un compte administrateur

```bash
docker-compose exec backend node create-admin.js admin@example.com MotDePasse "Admin Name"
```

### Initialiser les paramètres

```bash
docker-compose exec backend npm run init-settings
```

---

## 🔄 Mises à jour

### Script automatisé

```bash
chmod +x docker-update.sh
./docker-update.sh
```

Ce script :
1. Récupère le nouveau code (git pull)
2. Reconstruit les images
3. Redémarre les conteneurs
4. Nettoie les anciennes images

### Mise à jour manuelle

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Mettre à jour le code
git pull

# 3. Rebuild
docker-compose build --no-cache

# 4. Redémarrer
docker-compose up -d
```

---

## 💾 Sauvegarde & Restauration

### Sauvegarde automatisée

```bash
chmod +x docker-backup.sh
./docker-backup.sh
```

Les sauvegardes sont stockées dans `./backups/` avec :
- Base de données SQLite
- Configuration (.env)
- Code source

### Sauvegarde manuelle de la base de données

```bash
# Export du volume
docker run --rm -v autopost_sqlite_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db_$(date +%Y%m%d).tar.gz -C /data .
```

### Restauration

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Restaurer le volume
docker run --rm -v autopost_sqlite_data:/data -v $(pwd)/backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/db_YYYYMMDD.tar.gz"

# 3. Redémarrer
docker-compose up -d
```

---

## 🌐 Déploiement Production

### Avec HTTPS/SSL (Let's Encrypt)

**1. Configuration Nginx système (reverse proxy)**

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**2. Modifier le port dans .env**

```env
EXTERNAL_PORT=8080
FRONTEND_URL=https://votre-domaine.com
```

**3. Obtenir un certificat SSL**

```bash
sudo certbot --nginx -d votre-domaine.com
```

**4. Déployer avec limites de ressources**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Redémarrage automatique au boot

Les conteneurs redémarrent automatiquement grâce à `restart: unless-stopped` dans docker-compose.yml.

---

## 🐛 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier les ports
sudo netstat -tulpn | grep :80
```

### L'API ne répond pas

```bash
# Vérifier le healthcheck
docker-compose ps

# Logs du backend
docker-compose logs backend

# Redémarrer le backend
docker-compose restart backend
```

### Erreur de permissions (Linux)

```bash
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

### Base de données corrompue

```bash
# Restaurer depuis une sauvegarde
docker-compose down
docker volume rm autopost_sqlite_data
# Restaurer backup (voir section Restauration)
docker-compose up -d
```

### Nettoyer complètement

```bash
# ATTENTION : Supprime TOUTES les données !
docker-compose down -v
docker system prune -a
```

### Port déjà utilisé

Changez `EXTERNAL_PORT` dans `.env` :

```env
EXTERNAL_PORT=8080
```

---

## 🔧 Développement

### Mode développement avec hot-reload

**Backend :**
```bash
docker-compose run --rm -p 5000:5000 -v $(pwd)/backend:/app backend npm run dev
```

**Frontend :**
```bash
cd frontend
npm run dev  # Exécuter localement pour le hot-reload
```

### Accéder au shell d'un conteneur

```bash
# Backend
docker-compose exec backend sh

# Frontend (nginx)
docker-compose exec frontend sh
```

### Inspecter la base de données

```bash
# Copier la DB localement
docker cp autopost-backend:/app/data/database.sqlite ./database.sqlite

# Ouvrir avec sqlite3
sqlite3 database.sqlite
```

---

## 📊 Monitoring

### Utilisation des ressources

```bash
docker stats
```

### Espace disque des volumes

```bash
docker system df -v
```

### Limites de ressources (Production)

Les limites sont définies dans `docker-compose.prod.yml` :

- **Backend** : Max 1 CPU, 1GB RAM
- **Frontend** : Max 0.5 CPU, 512MB RAM

---

## 🔄 Migration depuis l'installation manuelle

### 1. Sauvegarder les données existantes

```bash
# Copier la base de données
cp backend/database.sqlite backups/

# Copier la configuration
cp backend/.env backups/
```

### 2. Arrêter les services PM2/systemd

```bash
pm2 stop all
# OU
sudo systemctl stop autopost
```

### 3. Configurer Docker

```bash
cp .env.docker .env
# Copier les valeurs depuis backups/.env
```

### 4. Restaurer la base de données

```bash
# Démarrer Docker une première fois
docker-compose up -d

# Arrêter
docker-compose down

# Copier la DB dans le volume
docker run --rm -v autopost_sqlite_data:/data -v $(pwd)/backups:/backup \
  alpine cp /backup/database.sqlite /data/database.sqlite

# Redémarrer
docker-compose up -d
```

---

## 📦 Architecture Docker

```
┌─────────────────────────────────────┐
│         Docker Network              │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend   │ │
│  │   (Nginx)    │──│  (Node.js)  │ │
│  │   Port 80    │  │  Port 5000  │ │
│  └──────────────┘  └─────────────┘ │
│                           │         │
│                    ┌──────▼──────┐  │
│                    │   Volume    │  │
│                    │  SQLite DB  │  │
│                    └─────────────┘  │
└─────────────────────────────────────┘
```

### Services

- **frontend** : Nginx servant le build React + reverse proxy API
- **backend** : API Node.js avec Express
- **sqlite_data** : Volume persistant pour la base de données

---

## 📚 Commandes de référence rapide

```bash
# Démarrage
./docker-deploy.sh                    # Déploiement complet
docker-compose up -d                  # Démarrer en arrière-plan
docker-compose up                     # Démarrer avec logs

# Arrêt
docker-compose down                   # Arrêter
docker-compose down -v                # Arrêter + supprimer volumes

# Logs
docker-compose logs -f                # Logs temps réel
docker-compose logs -f backend        # Logs backend uniquement
docker-compose logs --tail=100        # 100 dernières lignes

# Gestion
docker-compose ps                     # Statut
docker-compose restart                # Redémarrer
docker-compose restart backend        # Redémarrer backend seulement
docker-compose exec backend sh        # Shell dans backend

# Mise à jour
./docker-update.sh                    # Mise à jour automatique
docker-compose pull                   # Pull nouvelles images
docker-compose build --no-cache       # Rebuild sans cache

# Sauvegarde
./docker-backup.sh                    # Backup automatique

# Nettoyage
docker system prune                   # Nettoyer images inutilisées
docker volume prune                   # Nettoyer volumes inutilisés
docker-compose down --rmi all -v      # Tout supprimer
```

---

## 🆘 Support

En cas de problème :

1. Vérifier les logs : `docker-compose logs`
2. Vérifier le statut : `docker-compose ps`
3. Redémarrer : `docker-compose restart`
4. Consulter ce guide de dépannage
5. Ouvrir une issue sur GitHub

---

**Prêt à déployer ? Lancez `./docker-deploy.sh` ! 🚀**
