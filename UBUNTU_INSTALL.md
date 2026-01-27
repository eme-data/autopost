# 🐧 AutoPost - Installation Ubuntu 24.04 (Docker)

Guide complet d'installation et d'utilisation d'AutoPost sur Ubuntu 24.04 LTS avec Docker.

---

## 📋 Prérequis Système

- **OS** : Ubuntu 24.04 LTS (Noble Numbat)
- **RAM** : Minimum 2GB (4GB recommandé)
- **Disque** : Minimum 10GB d'espace libre
- **Accès** : Privilèges sudo
- **Réseau** : Connexion Internet

---

## 🚀 Installation Rapide (Méthode Recommandée)

### Étape 1 : Installation Docker

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y ca-certificates curl gnupg lsb-release

# Ajouter la clé GPG officielle de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Ajouter votre utilisateur au groupe docker (évite d'utiliser sudo)
sudo usermod -aG docker $USER

# Redémarrer la session pour appliquer les changements
newgrp docker
```

**Vérification :**
```bash
docker --version
docker compose version
```

Vous devriez voir quelque chose comme :
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

### Étape 2 : Cloner le Projet

```bash
# Installer Git si nécessaire
sudo apt install -y git

# Cloner le repository
git clone https://github.com/votre-username/autopost.git
cd autopost
```

### Étape 3 : Configuration

```bash
# Copier le template d'environnement
cp .env.docker .env

# Éditer la configuration
nano .env
```

**Configuration minimale requise dans `.env` :**

```env
# Sécurité JWT - IMPORTANT : Générez une clé aléatoire !
JWT_SECRET=changez-cette-cle-par-une-valeur-aleatoire-de-32-caracteres-minimum

# API Intelligence Artificielle (au moins une requise)
ANTHROPIC_API_KEY=sk-ant-votre-cle-anthropic
GEMINI_API_KEY=votre-cle-gemini
GROQ_API_KEY=gsk_votre-cle-groq

# OAuth LinkedIn (optionnel pour publication automatique)
LINKEDIN_CLIENT_ID=votre-client-id
LINKEDIN_CLIENT_SECRET=votre-client-secret
LINKEDIN_REDIRECT_URI=http://votre-domaine.com/api/oauth/linkedin/callback

# OAuth Facebook (optionnel pour publication automatique)
FACEBOOK_APP_ID=votre-app-id
FACEBOOK_APP_SECRET=votre-app-secret
FACEBOOK_REDIRECT_URI=http://votre-domaine.com/api/oauth/facebook/callback

# Configuration
FRONTEND_URL=http://votre-domaine.com
EXTERNAL_PORT=80
```

**💡 Obtenir les clés API :**
- **Anthropic (Claude)** : https://console.anthropic.com/
- **Google (Gemini)** : https://makersuite.google.com/app/apikey
- **Groq** : https://console.groq.com/
- **LinkedIn** : https://www.linkedin.com/developers/
- **Facebook** : https://developers.facebook.com/

**🔒 Générer un JWT_SECRET sécurisé :**
```bash
openssl rand -base64 32
```

Sauvegardez avec `Ctrl+X`, puis `Y`, puis `Entrée`.

### Étape 4 : Déploiement

```bash
# Construire et démarrer les conteneurs
docker compose up -d

# Vérifier le statut
docker compose ps
```

**Résultat attendu :**
```
NAME                  STATUS          PORTS
autopost-backend      Up (healthy)    5000/tcp
autopost-frontend     Up (healthy)    0.0.0.0:80->80/tcp
```

### Étape 5 : Créer un Compte Administrateur

```bash
docker compose exec backend node create-admin.js admin@example.com VotreMotDePasse "Administrateur"
```

### Étape 6 : Accéder à l'Application

Ouvrez votre navigateur et accédez à :

- **Application** : http://localhost (ou http://votre-ip-serveur)
- **API Health** : http://localhost/api/health

**✅ Installation terminée ! L'application est opérationnelle.**

---

## 🌐 Configuration avec Nom de Domaine et HTTPS

### Prérequis
- Un nom de domaine (ex: autopost.example.com)
- DNS configuré pour pointer vers l'IP de votre serveur
- Ports 80 et 443 ouverts

### Étape 1 : Modifier le Port Docker

```bash
nano .env
```

Changez le port pour éviter le conflit avec Nginx système :
```env
EXTERNAL_PORT=8080
FRONTEND_URL=https://autopost.example.com
```

Redémarrez Docker :
```bash
docker compose up -d
```

### Étape 2 : Installer Nginx (reverse proxy)

```bash
sudo apt install -y nginx
```

### Étape 3 : Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/autopost
```

Configuration :
```nginx
server {
    listen 80;
    server_name autopost.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site :
```bash
sudo ln -s /etc/nginx/sites-available/autopost /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 4 : Installer le Certificat SSL (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d autopost.example.com

# Renouvellement automatique (déjà configuré par Certbot)
sudo certbot renew --dry-run
```

### Étape 5 : Mettre à Jour les URLs OAuth

Éditez `.env` et mettez à jour les URLs de callback :
```env
LINKEDIN_REDIRECT_URI=https://autopost.example.com/api/oauth/linkedin/callback
FACEBOOK_REDIRECT_URI=https://autopost.example.com/api/oauth/facebook/callback
```

Redémarrez :
```bash
docker compose restart
```

**✅ Votre application est maintenant accessible en HTTPS !**

---

## 📚 Utilisation

### Gestion des Conteneurs

```bash
# Voir les logs
docker compose logs -f

# Logs backend uniquement
docker compose logs -f backend

# Logs frontend uniquement
docker compose logs -f frontend

# Redémarrer
docker compose restart

# Arrêter
docker compose down

# Démarrer
docker compose up -d

# Voir le statut
docker compose ps

# Voir l'utilisation des ressources
docker stats
```

### Gestion des Utilisateurs

```bash
# Créer un administrateur
docker compose exec backend node create-admin.js email@example.com password "Nom"

# Initialiser les paramètres (après modification .env)
docker compose exec backend npm run init-settings

# Accéder au shell du backend
docker compose exec backend sh
```

### Sauvegardes

```bash
# Sauvegarde complète
./docker-backup.sh

# Sauvegarde manuelle de la base de données
docker run --rm -v autopost_sqlite_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Restaurer une sauvegarde
docker compose down
docker run --rm -v autopost_sqlite_data:/data -v $(pwd)/backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/db_YYYYMMDD_HHMMSS.tar.gz"
docker compose up -d
```

### Mises à Jour

```bash
# Mise à jour automatique
git pull
./docker-update.sh

# Mise à jour manuelle
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 🔧 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs détaillés
docker compose logs

# Vérifier que le port n'est pas utilisé
sudo netstat -tulpn | grep :80

# Redémarrer Docker
sudo systemctl restart docker
docker compose up -d
```

### Erreur "Permission denied" avec Docker

```bash
# Vérifier que vous êtes dans le groupe docker
groups

# Si docker n'apparaît pas, ajoutez-vous
sudo usermod -aG docker $USER

# Déconnectez-vous et reconnectez-vous (ou redémarrez)
```

### L'API ne répond pas

```bash
# Vérifier le healthcheck
docker compose ps

# Vérifier les logs backend
docker compose logs backend

# Redémarrer le backend
docker compose restart backend
```

### Problème de base de données

```bash
# Vérifier les permissions du volume
docker volume inspect autopost_sqlite_data

# En dernier recours : recréer le volume
docker compose down
docker volume rm autopost_sqlite_data
docker compose up -d
# Restaurer depuis backup si nécessaire
```

### Nettoyer l'espace disque

```bash
# Nettoyer les images inutilisées
docker system prune -a

# Nettoyer les volumes inutilisés
docker volume prune

# Voir l'utilisation du disque
docker system df
```

---

## 🔒 Sécurité

### Pare-feu UFW

```bash
# Installer UFW
sudo apt install -y ufw

# Configurer les règles
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### Mises à Jour Système

```bash
# Activer les mises à jour automatiques
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Sauvegardes Automatiques

Créez un cron job pour sauvegardes quotidiennes :

```bash
# Éditer crontab
crontab -e

# Ajouter cette ligne (sauvegarde à 2h du matin)
0 2 * * * cd /chemin/vers/autopost && ./docker-backup.sh >> /var/log/autopost-backup.log 2>&1
```

---

## 📊 Monitoring

### Installer Docker Stats Monitoring

```bash
# Installer ctop (Docker monitoring interactif)
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

# Lancer ctop
ctop
```

### Logs Centralisés

```bash
# Voir tous les logs avec timestamps
docker compose logs -f --timestamps

# Exporter les logs
docker compose logs > autopost-logs-$(date +%Y%m%d).txt
```

---

## 🚦 Démarrage Automatique au Boot

Docker Compose redémarre automatiquement les conteneurs grâce à `restart: unless-stopped`.

Pour vérifier que Docker démarre au boot :

```bash
sudo systemctl enable docker
sudo systemctl status docker
```

---

## 📈 Performance

### Optimisation des Ressources

Modifier `docker-compose.prod.yml` si nécessaire :

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Augmenter si nécessaire
          memory: 2G       # Augmenter si nécessaire
```

Redémarrer avec configuration production :
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🆘 Support

- **Documentation complète** : [DOCKER.md](DOCKER.md)
- **Guide général** : [README.md](README.md)
- **Problèmes OAuth** : [PUBLICATION_AUTOMATIQUE.md](PUBLICATION_AUTOMATIQUE.md)

---

## ✅ Checklist de Production

- [ ] Docker et docker-compose installés
- [ ] Fichier `.env` configuré avec vraies clés
- [ ] JWT_SECRET changé (32+ caractères aléatoires)
- [ ] Compte administrateur créé
- [ ] Nom de domaine configuré
- [ ] Certificat SSL installé
- [ ] Pare-feu UFW activé
- [ ] Sauvegardes automatiques configurées
- [ ] URLs OAuth mises à jour
- [ ] Test de restauration effectué
- [ ] Monitoring configuré

---

**Votre installation AutoPost sur Ubuntu 24.04 est prête ! 🚀**
