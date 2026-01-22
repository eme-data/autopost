# Guide d'Installation - AutoPost

Guide pas à pas pour installer AutoPost sur un serveur Linux dédié.

## 📋 Prérequis Serveur

### 1. Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Installation de Node.js

```bash
# Installation de Node.js 18.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérification
node --version  # doit afficher v18.x ou supérieur
npm --version
```

### 3. Installation de Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Installation de PM2 (gestionnaire de processus)

```bash
sudo npm install -g pm2
```

### 5. (Optionnel) Installation de Git

```bash
sudo apt install -y git
```

## 🚀 Installation de l'Application

### Étape 1 : Récupérer le code

**Option A - Via Git :**
```bash
cd /var/www  # ou tout autre répertoire de votre choix
git clone <url-du-repo> autopost
cd autopost
```

**Option B - Upload manuel :**
```bash
# Créer le répertoire
sudo mkdir -p /var/www/autopost
sudo chown $USER:$USER /var/www/autopost

# Uploader les fichiers via SCP, SFTP ou FTP
# Ensuite :
cd /var/www/autopost
```

### Étape 2 : Configuration des clés API

1. Obtenir les clés API :
   - **Claude (Anthropic)** : https://console.anthropic.com/
   - **Gemini (Google)** : https://makersuite.google.com/app/apikey

2. Configurer le backend :
```bash
cd backend
cp .env.example .env
nano .env
```

3. Éditer le fichier `.env` :
```env
PORT=5000
NODE_ENV=production

# Générez une clé secrète forte (utilisez par exemple : openssl rand -hex 32)
JWT_SECRET=votre-cle-secrete-tres-longue-et-aleatoire

# Durée de validité du token
JWT_EXPIRES_IN=7d

# Clés API IA
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# URL du frontend (votre domaine)
FRONTEND_URL=https://votre-domaine.com

# Base de données
DATABASE_PATH=./database.sqlite
```

4. Sauvegarder et quitter (Ctrl+X, puis Y, puis Entrée)

### Étape 3 : Déploiement automatique

```bash
cd /var/www/autopost
./deploy.sh
```

Ce script va :
- Installer les dépendances backend
- Installer et builder le frontend
- Démarrer l'application avec PM2

### Étape 4 : Configuration Nginx

1. Éditer le fichier de configuration :
```bash
sudo nano nginx.conf
```

2. Remplacer :
   - `votre-domaine.com` par votre domaine réel
   - `/chemin/vers/autopost` par `/var/www/autopost` (ou votre chemin)

3. Copier dans Nginx :
```bash
sudo cp nginx.conf /etc/nginx/sites-available/autopost
```

4. Activer le site :
```bash
sudo ln -s /etc/nginx/sites-available/autopost /etc/nginx/sites-enabled/
```

5. Tester et redémarrer Nginx :
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 5 : Configuration SSL (HTTPS)

**Fortement recommandé pour la production !**

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Le certificat se renouvellera automatiquement
```

### Étape 6 : Configuration du Firewall

```bash
# Autoriser HTTP et HTTPS
sudo ufw allow 'Nginx Full'

# Autoriser SSH (si pas déjà fait)
sudo ufw allow OpenSSH

# Activer le firewall
sudo ufw enable
```

## ✅ Vérification de l'Installation

### 1. Vérifier PM2

```bash
pm2 status
# Devrait afficher "autopost-backend" avec le statut "online"

pm2 logs
# Devrait afficher les logs sans erreur
```

### 2. Vérifier Nginx

```bash
sudo systemctl status nginx
# Devrait afficher "active (running)"
```

### 3. Tester l'API

```bash
curl http://localhost:5000/api/health
# Devrait retourner : {"success":true,"message":"API AutoPost opérationnelle",...}
```

### 4. Tester dans le navigateur

Ouvrez votre navigateur et accédez à :
- `http://votre-domaine.com` (ou https si SSL configuré)

Vous devriez voir la page de connexion d'AutoPost.

## 🔧 Post-Installation

### Configurer le démarrage automatique

PM2 au démarrage du serveur :
```bash
pm2 startup
pm2 save
```

### Optimisation (optionnel)

Activer la compression Gzip dans Nginx :
```bash
sudo nano /etc/nginx/nginx.conf
```

Décommenter ou ajouter dans le bloc `http {}` :
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

Redémarrer Nginx :
```bash
sudo systemctl restart nginx
```

## 📊 Monitoring et Maintenance

### Voir les logs

```bash
# Logs PM2
pm2 logs

# Logs Nginx
sudo tail -f /var/log/nginx/autopost-access.log
sudo tail -f /var/log/nginx/autopost-error.log
```

### Mettre à jour l'application

```bash
cd /var/www/autopost

# Sauvegarder la base de données
cp backend/database.sqlite backend/database.sqlite.backup

# Mettre à jour le code
git pull  # si vous utilisez git

# Redéployer
./deploy.sh

# Redémarrer PM2
pm2 restart autopost-backend
```

### Sauvegardes

Configuration d'une sauvegarde automatique quotidienne :

```bash
# Créer un script de sauvegarde
sudo nano /usr/local/bin/backup-autopost.sh
```

Contenu du script :
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/autopost"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /var/www/autopost/backend/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "database_*.sqlite" -type f -mtime +7 -delete
```

Rendre exécutable et ajouter au cron :
```bash
sudo chmod +x /usr/local/bin/backup-autopost.sh
sudo crontab -e
```

Ajouter la ligne :
```
0 2 * * * /usr/local/bin/backup-autopost.sh
```

## 🆘 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs autopost-backend

# Vérifier les variables d'environnement
cat backend/.env

# Vérifier les permissions
ls -la backend/

# Redémarrer
pm2 restart autopost-backend
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que le backend est démarré
pm2 status

# Vérifier que le port 5000 est accessible
curl http://localhost:5000/api/health

# Vérifier la configuration Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Base de données corrompue

```bash
cd /var/www/autopost/backend

# Restaurer depuis un backup
cp database.sqlite database.sqlite.corrupt
cp database.sqlite.backup database.sqlite

# Ou réinitialiser (ATTENTION : perte de données)
rm database.sqlite
pm2 restart autopost-backend
```

## 📞 Support

En cas de problème persistant :
1. Vérifiez les logs : `pm2 logs` et `/var/log/nginx/`
2. Vérifiez la configuration : `.env` et `nginx.conf`
3. Consultez la documentation complète dans `README.md`

---

**Félicitations !** Votre application AutoPost est maintenant installée et opérationnelle.
