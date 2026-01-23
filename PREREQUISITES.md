# Prérequis pour AutoPost

Ce document détaille tous les prérequis nécessaires pour faire fonctionner AutoPost.

## ✅ Installation Automatique (Recommandée)

Le script `deploy.sh` **installe automatiquement** tous les prérequis manquants :

```bash
chmod +x deploy.sh
./deploy.sh
```

Le script :
- ✅ Détecte si Node.js est installé
- ✅ Crée des liens symboliques si Node.js est dans `/opt/node22`
- ✅ Installe Node.js 20 LTS si absent (Debian/Ubuntu/RedHat)
- ✅ Installe PM2 globalement si absent
- ✅ Vérifie Git et SQLite3 (optionnels)

## 📋 Prérequis Détaillés

### 1. Node.js (Requis)

**Version minimale :** Node.js >= 18.x (recommandé : 20.x LTS)

#### Installation Automatique

Le script `deploy.sh` installe automatiquement Node.js si nécessaire.

#### Installation Manuelle

**Ubuntu/Debian :**
```bash
# Installer Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version  # v20.x.x
npm --version   # 10.x.x
```

**RedHat/CentOS/Fedora :**
```bash
# Installer Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

**macOS :**
```bash
# Avec Homebrew
brew install node@20

# Ou télécharger depuis
# https://nodejs.org/
```

**Windows :**
Téléchargez l'installateur depuis https://nodejs.org/

#### Cas spécial : Node.js dans /opt/node22

Si Node.js est déjà installé dans `/opt/node22` :

```bash
# Créer les liens symboliques
sudo ln -sf /opt/node22/bin/node /usr/local/bin/node
sudo ln -sf /opt/node22/bin/npm /usr/local/bin/npm
sudo ln -sf /opt/node22/bin/npx /usr/local/bin/npx

# Vérifier
node --version
npm --version
```

### 2. npm (Requis)

**Version minimale :** npm >= 8.x

npm est automatiquement installé avec Node.js.

**Mise à jour de npm :**
```bash
npm install -g npm@latest
```

### 3. PM2 (Recommandé pour la production)

PM2 est un gestionnaire de processus pour Node.js.

#### Installation Automatique

Le script `deploy.sh` installe automatiquement PM2 si nécessaire.

#### Installation Manuelle

```bash
npm install -g pm2

# Configurer PM2 pour démarrer au boot
pm2 startup
pm2 save
```

**Commandes PM2 utiles :**
```bash
pm2 status              # Voir les processus
pm2 logs                # Voir les logs
pm2 restart autopost-backend
pm2 stop autopost-backend
pm2 delete autopost-backend
pm2 monit               # Monitoring en temps réel
```

### 4. Git (Optionnel mais recommandé)

Git est utilisé pour cloner le repository et gérer les versions.

**Ubuntu/Debian :**
```bash
sudo apt-get update
sudo apt-get install -y git
```

**RedHat/CentOS/Fedora :**
```bash
sudo yum install -y git
```

**macOS :**
```bash
brew install git
# Ou utiliser Xcode Command Line Tools
xcode-select --install
```

**Vérification :**
```bash
git --version
```

### 5. SQLite3 (Optionnel)

SQLite3 CLI est optionnel car le package npm `better-sqlite3` fournit la bibliothèque nécessaire.

**Si vous souhaitez interroger la base de données directement :**

**Ubuntu/Debian :**
```bash
sudo apt-get install -y sqlite3
```

**RedHat/CentOS/Fedora :**
```bash
sudo yum install -y sqlite
```

**macOS :**
```bash
brew install sqlite3
```

**Utilisation :**
```bash
# Se connecter à la base de données
sqlite3 backend/database.db

# Exemples de commandes SQLite
.tables                 # Lister les tables
.schema users           # Voir le schéma d'une table
SELECT * FROM users;    # Requête SQL
.quit                   # Quitter
```

### 6. Nginx (Optionnel pour la production)

Nginx est utilisé comme reverse proxy et pour servir le frontend.

**Ubuntu/Debian :**
```bash
sudo apt-get install -y nginx
```

**RedHat/CentOS/Fedora :**
```bash
sudo yum install -y nginx
```

**Configuration :**
```bash
# Copier la configuration fournie
sudo cp nginx.conf /etc/nginx/sites-available/autopost
sudo ln -s /etc/nginx/sites-available/autopost /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Compilateur C++ (Requis pour better-sqlite3)

Le package `better-sqlite3` nécessite des outils de compilation.

**Ubuntu/Debian :**
```bash
sudo apt-get install -y build-essential python3
```

**RedHat/CentOS/Fedora :**
```bash
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3
```

**macOS :**
```bash
xcode-select --install
```

**Windows :**
```bash
npm install --global windows-build-tools
```

## 🔐 Configuration SSL/HTTPS (Optionnel mais recommandé)

Pour activer HTTPS en production :

### Avec Let's Encrypt (Gratuit)

```bash
# Installer Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement automatique est configuré par défaut
# Tester le renouvellement
sudo certbot renew --dry-run
```

### Configuration manuelle dans Nginx

Voir le fichier `nginx.conf` pour la configuration SSL complète.

## 📊 Récapitulatif des Commandes

### Installation Complète Automatique
```bash
# Clone et déploiement automatique
git clone <votre-repo>
cd autopost
chmod +x deploy.sh
./deploy.sh
```

### Vérification Post-Installation
```bash
# Vérifier Node.js et npm
node --version
npm --version

# Vérifier PM2
pm2 --version
pm2 status

# Vérifier que l'application fonctionne
curl http://localhost:5000/api/auth/test

# Vérifier les logs
pm2 logs autopost-backend
```

## ❗ Résolution de Problèmes

### Node.js n'est pas trouvé après installation

```bash
# Vérifier le PATH
echo $PATH

# Si Node.js est dans /opt/node22
sudo ln -sf /opt/node22/bin/node /usr/local/bin/node
sudo ln -sf /opt/node22/bin/npm /usr/local/bin/npm
```

### Erreurs de compilation avec better-sqlite3

```bash
# Installer les outils de build
sudo apt-get install -y build-essential python3

# Réinstaller le package
cd backend
npm rebuild better-sqlite3
```

### PM2 ne démarre pas au boot

```bash
# Reconfigurer le startup
pm2 unstartup
pm2 startup
pm2 save
```

### Port 5000 déjà utilisé

```bash
# Modifier le port dans backend/.env
PORT=5001

# Ou tuer le processus sur le port 5000
lsof -ti:5000 | xargs kill -9
```

### Permissions insuffisantes

```bash
# Si vous n'avez pas les droits sudo
# Installer Node.js avec nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Installer PM2 localement (sans -g)
npm install pm2
npx pm2 start ecosystem.config.js
```

## 📚 Ressources

- **Node.js** : https://nodejs.org/
- **npm** : https://www.npmjs.com/
- **PM2** : https://pm2.keymetrics.io/
- **Nginx** : https://nginx.org/
- **SQLite** : https://www.sqlite.org/
- **Let's Encrypt** : https://letsencrypt.org/

## 🆘 Support

Si vous rencontrez des problèmes lors de l'installation :

1. Vérifiez que vous utilisez la bonne version de Node.js : `node --version`
2. Consultez les logs : `pm2 logs`
3. Vérifiez les fichiers de configuration : `backend/.env`
4. Référez-vous à la documentation complète dans `INSTALLATION.md`
