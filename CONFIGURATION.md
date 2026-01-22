# Guide de Configuration - AutoPost

Ce guide explique comment configurer AutoPost via l'interface d'administration web.

## 🎯 Vue d'ensemble

AutoPost peut être configuré de **deux manières** :

1. **Via le fichier `.env`** (traditionnel, recommandé en production)
2. **Via l'interface admin** (pratique, recommandé en développement)

**Important :** Les variables d'environnement (`.env`) ont **toujours la priorité** sur la configuration en base de données.

## 🚀 Configuration initiale

### Étape 1 : Initialiser les paramètres

Après l'installation, initialisez les paramètres de configuration :

```bash
cd backend
npm run init-settings
```

Ou directement :

```bash
node init-settings.js
```

Cette commande va :
- ✅ Créer tous les paramètres dans la base de données
- ✅ Importer les valeurs actuelles depuis `.env`
- ✅ Organiser les paramètres par catégorie
- ✅ Marquer les valeurs sensibles

### Étape 2 : Créer un administrateur

Si ce n'est pas déjà fait :

```bash
npm run create-admin admin@example.com MotDePasse Admin Système
```

### Étape 3 : Accéder à l'interface admin

1. Démarrez l'application
2. Connectez-vous avec vos identifiants admin
3. Cliquez sur **"Administration"** dans la navbar
4. Allez dans l'onglet **"⚙️ Configuration"**

## 📋 Paramètres disponibles

### API - Intelligence Artificielle

| Paramètre | Description | Sensible | Exemple |
|-----------|-------------|----------|---------|
| `ANTHROPIC_API_KEY` | Clé API Claude (Anthropic) | ✅ | `sk-ant-api03-...` |
| `GEMINI_API_KEY` | Clé API Gemini (Google) | ✅ | `AIzaSy...` |

**Obtenir les clés :**
- Claude : https://console.anthropic.com/
- Gemini : https://makersuite.google.com/app/apikey

### OAuth - LinkedIn

| Paramètre | Description | Sensible | Exemple |
|-----------|-------------|----------|---------|
| `LINKEDIN_CLIENT_ID` | Client ID LinkedIn | ❌ | `86abcdef123456` |
| `LINKEDIN_CLIENT_SECRET` | Client Secret LinkedIn | ✅ | `WPL_AP1.xxx...` |
| `LINKEDIN_REDIRECT_URI` | URL de callback OAuth | ❌ | `https://domain.com/api/oauth/linkedin/callback` |

**Configurer :**
1. Créer une app sur https://www.linkedin.com/developers/
2. Demander l'accès à "Share on LinkedIn"
3. Configurer l'URL de redirection

### OAuth - Facebook

| Paramètre | Description | Sensible | Exemple |
|-----------|-------------|----------|---------|
| `FACEBOOK_APP_ID` | App ID Facebook | ❌ | `123456789012345` |
| `FACEBOOK_APP_SECRET` | App Secret Facebook | ✅ | `abc123def456...` |
| `FACEBOOK_REDIRECT_URI` | URL de callback OAuth | ❌ | `https://domain.com/api/oauth/facebook/callback` |

**Configurer :**
1. Créer une app sur https://developers.facebook.com/
2. Demander les permissions `pages_manage_posts`
3. Configurer l'URL de redirection

### Sécurité

| Paramètre | Description | Sensible | Exemple |
|-----------|-------------|----------|---------|
| `JWT_SECRET` | Clé secrète pour JWT | ✅ | `super-secret-key-change-this` |
| `JWT_EXPIRES_IN` | Durée de validité des tokens | ❌ | `7d` (7 jours) |

**Générer une clé secrète forte :**
```bash
openssl rand -hex 32
```

### Configuration générale

| Paramètre | Description | Sensible | Exemple |
|-----------|-------------|----------|---------|
| `FRONTEND_URL` | URL du frontend (CORS) | ❌ | `https://yourdomain.com` |
| `PORT` | Port du serveur backend | ❌ | `5000` |
| `NODE_ENV` | Environnement | ❌ | `production` |

## 🖥️ Utiliser l'interface admin

### Afficher la configuration

1. Connectez-vous en tant qu'admin
2. Menu **"Administration"** → **"⚙️ Configuration"**
3. Les paramètres sont groupés par catégorie

### Modifier un paramètre

1. Cliquez sur **"Modifier"** à côté du paramètre
2. Entrez la nouvelle valeur
3. Cliquez sur **"Enregistrer"**

**Note :** Les valeurs sensibles sont masquées (`••••••••`). Vous devez entrer la nouvelle valeur complète.

### Recharger la configuration

Cliquez sur le bouton **"🔄 Recharger"** en haut à droite pour actualiser l'affichage.

## 🔐 Ordre de priorité

AutoPost charge la configuration dans cet ordre :

```
1. Variables d'environnement (.env)  ← PRIORITÉ MAXIMALE
2. Base de données (settings table)
3. Valeurs par défaut dans le code
```

### Exemple pratique

**Fichier `.env` :**
```env
ANTHROPIC_API_KEY=sk-ant-from-env
```

**Base de données :**
```
ANTHROPIC_API_KEY=sk-ant-from-db
```

**Résultat :** `sk-ant-from-env` sera utilisé (priorité au .env)

## ⚙️ Configuration hybride (Recommandé)

Stratégie recommandée pour la production :

### Données sensibles → `.env`
```env
# .env (serveur uniquement, jamais dans Git)
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=AIzaSy-xxx
LINKEDIN_CLIENT_SECRET=WPL_AP1-xxx
FACEBOOK_APP_SECRET=abc123-xxx
JWT_SECRET=super-secret-xxx
```

### Données non sensibles → Admin interface
Via l'interface admin :
- `LINKEDIN_CLIENT_ID`
- `FACEBOOK_APP_ID`
- `LINKEDIN_REDIRECT_URI`
- `FACEBOOK_REDIRECT_URI`
- `FRONTEND_URL`
- `JWT_EXPIRES_IN`
- `PORT`

### Avantages

✅ **Sécurité maximale** : Secrets dans `.env`, jamais exposés
✅ **Flexibilité** : Config non sensible modifiable sans SSH
✅ **Traçabilité** : Logs d'audit pour toute modification
✅ **Backup** : `.env` séparé de la base de données

## 🔄 Scénarios d'utilisation

### Développement local

```bash
# 1. Copier .env.example
cp .env.example .env

# 2. Éditer .env avec vos clés de test
nano .env

# 3. Initialiser la config
npm run init-settings

# 4. Démarrer
npm run dev
```

Modification rapide → Interface admin

### Serveur de staging

```bash
# 1. .env avec clés de test
ANTHROPIC_API_KEY=sk-ant-test-xxx

# 2. Config via admin
- URLs de staging
- Paramètres non sensibles

# 3. Tests
```

### Production

```bash
# 1. .env avec clés de production (permissions 600)
chmod 600 .env
nano .env

# 2. Config via admin si besoin
- Ajustements mineurs
- URLs de production

# 3. Backup régulier du .env
```

## 📊 Logs d'audit

Toutes les modifications via l'interface admin sont enregistrées :

- ✅ Qui a modifié
- ✅ Quel paramètre
- ✅ Quand
- ✅ Action (création, modification, rechargement)

Accès : **Administration** → **"📋 Logs d'audit"**

## 🛠️ Maintenance

### Réinitialiser la configuration

Pour réimporter depuis `.env` :

```bash
cd backend
node init-settings.js
```

Comportement :
- ✅ Préserve les valeurs existantes en BDD
- ✅ Met à jour uniquement les valeurs vides
- ✅ Importe les nouvelles variables .env

### Ajouter un nouveau paramètre

**Option 1 : Via SQL**
```sql
INSERT INTO settings (key, value, category, description, is_sensitive)
VALUES ('NEW_PARAM', 'value', 'Category', 'Description', 0);
```

**Option 2 : Modifier init-settings.js**
```javascript
const DEFAULT_SETTINGS = [
  // ... existants
  {
    key: 'NEW_PARAM',
    category: 'Ma Catégorie',
    description: 'Description du paramètre',
    is_sensitive: 0
  }
];
```

Puis ré-exécuter :
```bash
node init-settings.js
```

### Supprimer un paramètre

```sql
DELETE FROM settings WHERE key = 'PARAM_NAME';
```

## ⚠️ Sécurité

### Bonnes pratiques

✅ **À faire :**
- Utiliser `.env` pour les secrets en production
- Définir `chmod 600` sur le fichier `.env`
- Ne JAMAIS commit le `.env` dans Git
- Vérifier les logs d'audit régulièrement
- Backup du `.env` séparément de la BDD
- Changer les secrets régulièrement

❌ **À éviter :**
- Stocker les clés API en BDD en production
- Partager les clés via l'interface
- Laisser des clés de test en production
- Ignorer les logs d'audit

### En cas de compromission

1. **Immédiat** : Révoquer les clés compromises chez les fournisseurs
2. Générer de nouvelles clés
3. Mettre à jour `.env`
4. Redémarrer le serveur
5. Vérifier les logs d'audit
6. Changer `JWT_SECRET` (déconnecte tous les users)

## 📞 Troubleshooting

### Les modifications ne s'appliquent pas

**Cause :** Le cache n'est pas invalidé ou `.env` a la priorité

**Solution :**
```bash
# Vérifier .env
cat backend/.env | grep PARAM_NAME

# Redémarrer le serveur
pm2 restart autopost-backend
```

### Paramètres vides après init-settings

**Cause :** Variables pas définies dans `.env`

**Solution :**
```bash
# Vérifier .env
nano backend/.env

# Ajouter les variables manquantes
ANTHROPIC_API_KEY=sk-ant-xxx

# Ré-exécuter
npm run init-settings
```

### Erreur "Table settings not found"

**Cause :** Base de données pas initialisée

**Solution :**
```bash
# Démarrer le serveur une fois pour créer les tables
npm start

# Puis initialiser les settings
npm run init-settings
```

## 📚 Ressources

- [README.md](README.md) - Documentation générale
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Guide d'administration
- [PUBLICATION_AUTOMATIQUE.md](PUBLICATION_AUTOMATIQUE.md) - Configuration OAuth
- [.env.example](backend/.env.example) - Template de configuration

---

**Configuration centralisée, sécurité renforcée** ✨
