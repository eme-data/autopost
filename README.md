# AutoPost - Générateur de Posts IA

Application web pour générer automatiquement des posts LinkedIn et Facebook en utilisant l'IA (Claude d'Anthropic et Gemini de Google) **avec publication automatique sur les réseaux sociaux**.

## 📋 Fonctionnalités

- 🔐 **Authentification sécurisée** avec JWT et hashage bcrypt
- 🤖 **Double IA** : Claude (Anthropic) et Gemini (Google)
- 📱 **Multi-plateformes** : LinkedIn et Facebook
- 🎨 **Personnalisation** : ton, longueur, hashtags, emojis
- 📚 **Historique** : sauvegarde et gestion des posts générés
- 🚀 **Publication automatique** : publiez directement sur LinkedIn et Facebook via OAuth
- 🔗 **Gestion des comptes** : connectez et gérez vos comptes sociaux
- 👑 **Panneau d'administration** : statistiques, gestion des utilisateurs, configuration
- 🔒 **Sécurité** : protection CORS, rate limiting, helmet

## 🛠️ Stack Technologique

### Backend
- Node.js + Express
- SQLite (base de données)
- JWT (authentification)
- bcryptjs (hashage de mots de passe)
- @anthropic-ai/sdk (Claude)
- @google/generative-ai (Gemini)

### Frontend
- React 18
- React Router (navigation)
- Axios (API)
- Vite (build tool)

## 📦 Installation

### Prérequis

**Le script `deploy.sh` vérifie et installe automatiquement les prérequis manquants !**

**Prérequis requis :**
- Node.js >= 18.x (installé automatiquement si manquant)
- npm >= 8.x (installé avec Node.js)

**Prérequis optionnels :**
- PM2 pour la gestion des processus (installé automatiquement)
- Nginx pour le reverse proxy (configuration manuelle)
- Git (recommandé pour le versioning)
- SQLite3 CLI (optionnel, le package npm sera utilisé sinon)

> **Note :** Le script `deploy.sh` détecte automatiquement :
> - Si Node.js existe dans `/opt/node22` et crée les liens symboliques
> - Si Node.js n'est pas installé et l'installe automatiquement (Debian/Ubuntu/RedHat)
> - Si PM2 n'est pas installé et l'installe globalement

### Installation Rapide (Recommandée)

```bash
# Cloner le repository
git clone <votre-repo>
cd autopost

# Rendre le script de déploiement exécutable
chmod +x deploy.sh

# Lancer le déploiement automatique
# Le script vérifiera et installera tous les prérequis manquants
./deploy.sh
```

**Le script s'occupe de :**
1. ✅ Vérifier et installer Node.js/npm si nécessaire
2. ✅ Installer les dépendances backend
3. ✅ Configurer le fichier .env
4. ✅ Installer les dépendances frontend
5. ✅ Builder le frontend
6. ✅ Installer et configurer PM2
7. ✅ Démarrer l'application

### Installation Manuelle

#### 1. Backend

```bash
cd backend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
nano .env  # Éditer avec vos clés API
```

Configuration requise dans `.env` :
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=votre-cle-secrete-forte-et-aleatoire
ANTHROPIC_API_KEY=votre-cle-anthropic
GEMINI_API_KEY=votre-cle-gemini
FRONTEND_URL=http://votre-domaine.com
```

**Obtenir les clés API :**
- **Claude (Anthropic)** : https://console.anthropic.com/
- **Gemini (Google)** : https://makersuite.google.com/app/apikey

#### 2. Frontend

```bash
cd frontend
npm install

# Configuration (optionnel)
cp .env.example .env
nano .env  # Éditer si nécessaire
```

#### 3. Build Frontend

```bash
cd frontend
npm run build
```

## 🚀 Démarrage

### Mode Développement

**Backend :**
```bash
cd backend
npm run dev  # Démarre sur http://localhost:5000
```

**Frontend :**
```bash
cd frontend
npm run dev  # Démarre sur http://localhost:3000
```

### Mode Production

**Avec PM2 (recommandé) :**
```bash
# Depuis la racine du projet
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Configuration du démarrage automatique
```

**Sans PM2 :**
```bash
cd backend
npm start
```

## 🌐 Configuration Nginx

1. Copier la configuration :
```bash
sudo cp nginx.conf /etc/nginx/sites-available/autopost
```

2. Éditer le fichier :
```bash
sudo nano /etc/nginx/sites-available/autopost
```

Remplacer :
- `votre-domaine.com` par votre domaine
- `/chemin/vers/autopost` par le chemin complet

3. Activer le site :
```bash
sudo ln -s /etc/nginx/sites-available/autopost /etc/nginx/sites-enabled/
sudo nginx -t  # Vérifier la configuration
sudo systemctl restart nginx
```

## 🔒 Configuration SSL (HTTPS)

Utiliser Let's Encrypt pour un certificat SSL gratuit :

```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique (déjà configuré par certbot)
```

## 📝 Utilisation

1. **Inscription/Connexion**
   - Créez un compte avec email et mot de passe
   - Connectez-vous pour accéder au dashboard

2. **Générer un Post**
   - Saisissez le sujet de votre post
   - Choisissez la plateforme (LinkedIn/Facebook)
   - Sélectionnez le modèle IA (Claude/Gemini)
   - Personnalisez le ton et la longueur
   - Cliquez sur "Générer le post"

3. **Connecter vos comptes sociaux** (pour publication automatique)
   - Allez dans l'onglet "Comptes sociaux"
   - Connectez votre compte LinkedIn et/ou Facebook
   - Les tokens seront stockés de manière sécurisée

4. **Publier automatiquement**
   - Après génération, cliquez sur "Publier sur LinkedIn" ou "Publier sur Facebook"
   - Le post sera publié instantanément sur vos réseaux
   - Un lien vers le post publié sera affiché

5. **Gérer l'Historique**
   - Consultez tous vos posts générés
   - Copiez ou supprimez les posts

6. **Panneau d'Administration** (réservé aux admins)
   - Accédez aux statistiques globales
   - Gérez les utilisateurs (rôles, statuts)
   - Configurez les paramètres de l'application
   - Consultez les logs d'audit

## 👑 Panneau d'Administration

AutoPost inclut un panneau d'administration complet pour gérer l'application.

### Accès administrateur

Créez le premier administrateur :

```bash
cd backend
node create-admin.js admin@example.com MotDePasseSecurisé Admin Système
```

### Fonctionnalités

- **📊 Statistiques** : Vue d'ensemble de l'utilisation (users, posts, plateformes, IA)
- **👥 Gestion des utilisateurs** : Liste, recherche, modification de rôles, activation/désactivation
- **⚙️ Configuration** : Gestion des clés API et paramètres (peut remplacer .env)
- **📋 Logs d'audit** : Traçabilité complète des actions administratives

### Sécurité

- Accès réservé aux comptes avec rôle "admin"
- Impossibilité de se retirer ses propres droits
- Toutes les actions sont enregistrées dans les logs d'audit
- Protection contre les suppressions accidentelles

📖 **Documentation complète** : Consultez [ADMIN_GUIDE.md](ADMIN_GUIDE.md) pour plus de détails.

## ⚙️ Configuration via Interface Admin

Gérez toutes les clés API et identifiants OAuth directement depuis l'interface web (pas besoin d'éditer `.env` !).

### Initialisation

```bash
cd backend
npm run init-settings
```

Cette commande importe vos variables `.env` dans la base de données et les rend éditables via l'interface admin.

### Utilisation

1. Connectez-vous en tant qu'admin
2. **Administration** → **⚙️ Configuration**
3. Modifiez les paramètres par catégorie :
   - API - Intelligence Artificielle (Claude, Gemini)
   - OAuth - LinkedIn (Client ID, Secret, Redirect URI)
   - OAuth - Facebook (App ID, Secret, Redirect URI)
   - Sécurité (JWT Secret, expiration)
   - Configuration générale (URLs, ports)

### Avantages

✅ **Modification sans SSH** : Changez la config depuis votre navigateur
✅ **Organisée par catégorie** : Toutes les clés groupées logiquement
✅ **Sécurisée** : Valeurs sensibles masquées, logs d'audit
✅ **Flexible** : `.env` garde toujours la priorité si défini

📖 **Guide complet** : [CONFIGURATION.md](CONFIGURATION.md)

## 🚀 Publication Automatique

AutoPost permet de publier directement vos posts générés sur LinkedIn et Facebook.

### Configuration requise

1. **Applications développeur** :
   - Créez une app LinkedIn sur [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Créez une app Facebook sur [Facebook Developers](https://developers.facebook.com/)

2. **Configuration OAuth** :
   - Ajoutez les identifiants dans `backend/.env`
   - Configurez les URLs de redirection

📖 **Guide complet** : Consultez [PUBLICATION_AUTOMATIQUE.md](PUBLICATION_AUTOMATIQUE.md) pour les instructions détaillées.

### Résumé rapide

```env
# Dans backend/.env
LINKEDIN_CLIENT_ID=votre_client_id
LINKEDIN_CLIENT_SECRET=votre_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/oauth/linkedin/callback

FACEBOOK_APP_ID=votre_app_id
FACEBOOK_APP_SECRET=votre_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/oauth/facebook/callback
```

**Important** :
- LinkedIn nécessite une vérification pour "Share on LinkedIn"
- Facebook nécessite une Page (pas un profil personnel)
- Les tokens expirent et doivent être renouvelés

## 🔧 Commandes PM2 Utiles

```bash
pm2 status              # Voir l'état de l'application
pm2 logs                # Voir les logs en temps réel
pm2 logs --lines 100    # Voir les 100 dernières lignes
pm2 restart autopost-backend  # Redémarrer
pm2 stop autopost-backend     # Arrêter
pm2 delete autopost-backend   # Supprimer
pm2 monit               # Monitoring en temps réel
```

## 🗄️ Structure du Projet

```
autopost/
├── backend/
│   ├── config/
│   │   └── database.js       # Configuration SQLite
│   ├── middleware/
│   │   └── auth.js           # Middleware JWT
│   ├── routes/
│   │   ├── auth.js           # Routes authentification
│   │   └── posts.js          # Routes posts
│   ├── .env.example
│   ├── package.json
│   └── server.js             # Point d'entrée
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Generator.jsx
│   │   │   └── History.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── ecosystem.config.js       # Configuration PM2
├── nginx.conf               # Configuration Nginx
├── deploy.sh               # Script de déploiement
└── README.md
```

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt (10 rounds)
- Authentification JWT avec expiration
- Protection CSRF et XSS
- Rate limiting (100 requêtes/15min)
- Headers de sécurité avec Helmet
- CORS configuré
- Validation des entrées utilisateur
- **Support HTTPS/SSL avec Let's Encrypt** (recommandé en production)

## 🔒 Configuration HTTPS (Production)

Pour sécuriser votre application avec HTTPS en production :

### Installation Automatique

```bash
# Configuration HTTPS avec Let's Encrypt
./setup-https.sh votre-domaine.com votre@email.com
```

**Ce que fait le script :**
- ✅ Installe Certbot (Let's Encrypt)
- ✅ Obtient un certificat SSL gratuit
- ✅ Configure Nginx pour HTTPS
- ✅ Redirige automatiquement HTTP → HTTPS
- ✅ Met à jour les URLs OAuth
- ✅ Configure le renouvellement automatique (90 jours)

### Gestion des Certificats

```bash
# Voir le statut des certificats
./manage-ssl.sh status

# Informations détaillées
./manage-ssl.sh info

# Renouveler manuellement
./manage-ssl.sh renew

# Tester le renouvellement
./manage-ssl.sh test-renew
```

### Prérequis pour HTTPS

1. **Nom de domaine** (ex: autopost.example.com)
2. **DNS configuré** pointant vers l'IP de votre serveur
3. **Port 80 accessible** depuis Internet

**📚 Guide complet :** Voir `HTTPS_GUIDE.md` pour plus de détails

## 🐛 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier les logs
pm2 logs autopost-backend

# Vérifier que le port 5000 n'est pas utilisé
sudo lsof -i :5000
```

### Erreur de connexion à l'API
- Vérifiez que le backend est démarré
- Vérifiez la configuration CORS dans `backend/server.js`
- Vérifiez les clés API dans `.env`

### Build frontend échoue
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📊 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérifier le token

### Posts
- `POST /api/posts/generate` - Générer un post (protégé)
- `GET /api/posts/history` - Historique (protégé)
- `DELETE /api/posts/:id` - Supprimer (protégé)

### OAuth (Comptes sociaux)
- `GET /api/oauth/linkedin/auth-url` - Obtenir l'URL d'auth LinkedIn (protégé)
- `GET /api/oauth/linkedin/callback` - Callback OAuth LinkedIn
- `GET /api/oauth/facebook/auth-url` - Obtenir l'URL d'auth Facebook (protégé)
- `GET /api/oauth/facebook/callback` - Callback OAuth Facebook
- `GET /api/oauth/connected-accounts` - Liste des comptes connectés (protégé)
- `DELETE /api/oauth/disconnect/:platform` - Déconnecter un compte (protégé)

### Publication
- `POST /api/publish/linkedin` - Publier sur LinkedIn (protégé)
- `POST /api/publish/facebook` - Publier sur Facebook (protégé)
- `POST /api/publish/both` - Publier sur les deux (protégé)

### Administration (réservé aux admins)
- `GET /api/admin/stats` - Statistiques globales
- `GET /api/admin/users` - Liste des utilisateurs
- `GET /api/admin/users/:id` - Détails d'un utilisateur
- `PUT /api/admin/users/:id/role` - Modifier le rôle
- `PUT /api/admin/users/:id/status` - Activer/désactiver un compte
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur
- `GET /api/admin/settings` - Configuration de l'application
- `PUT /api/admin/settings/:key` - Mettre à jour un paramètre
- `GET /api/admin/audit-logs` - Logs d'audit

## 📄 Licence

MIT

## 🤝 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Note:** N'oubliez pas de configurer vos clés API avant d'utiliser l'application !