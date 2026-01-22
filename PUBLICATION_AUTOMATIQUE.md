# Guide de Configuration - Publication Automatique

Ce guide vous explique comment configurer la publication automatique sur LinkedIn et Facebook.

## 📋 Vue d'ensemble

AutoPost permet de publier directement vos posts générés sur LinkedIn et Facebook via leurs APIs officielles. Pour cela, vous devez :

1. Créer des applications développeur sur LinkedIn et Facebook
2. Configurer les URLs de redirection OAuth
3. Obtenir les identifiants OAuth (Client ID/Secret)
4. Connecter vos comptes dans l'interface AutoPost

## 🔵 Configuration LinkedIn

### Étape 1 : Créer une application LinkedIn

1. Allez sur [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Cliquez sur "Create app"
3. Remplissez les informations :
   - **App name** : AutoPost
   - **LinkedIn Page** : Sélectionnez votre page d'entreprise (ou créez-en une)
   - **App logo** : Uploadez un logo
   - Acceptez les termes

### Étape 2 : Configurer les produits

1. Dans l'onglet "Products", ajoutez :
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn** (demande de vérification nécessaire)

2. **Important** : Pour "Share on LinkedIn", vous devrez peut-être demander l'accès. LinkedIn examine généralement les demandes sous 2-3 jours ouvrables.

### Étape 3 : Configuration OAuth

1. Allez dans l'onglet "Auth"
2. Notez :
   - **Client ID**
   - **Client Secret**

3. Ajoutez les URLs de redirection :
   - Développement : `http://localhost:5000/api/oauth/linkedin/callback`
   - Production : `https://votre-domaine.com/api/oauth/linkedin/callback`

### Étape 4 : Configuration dans AutoPost

Éditez votre fichier `backend/.env` :

```env
LINKEDIN_CLIENT_ID=votre_client_id_linkedin
LINKEDIN_CLIENT_SECRET=votre_client_secret_linkedin
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/oauth/linkedin/callback
# En production: https://votre-domaine.com/api/oauth/linkedin/callback
```

## 🔷 Configuration Facebook

### Étape 1 : Créer une application Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Cliquez sur "Create App"
3. Sélectionnez le type :
   - Choisissez "Business" si vous avez une entreprise
   - Sinon, choisissez "Consumer"
4. Remplissez les informations :
   - **App name** : AutoPost
   - **App contact email** : votre email

### Étape 2 : Ajouter les produits

1. Dans le dashboard de l'app, ajoutez :
   - **Facebook Login** (pour l'authentification)

2. Dans "Facebook Login" > "Settings" :
   - Ajoutez les URLs de redirection OAuth :
     - Développement : `http://localhost:5000/api/oauth/facebook/callback`
     - Production : `https://votre-domaine.com/api/oauth/facebook/callback`

### Étape 3 : Permissions

1. Dans "App Review" > "Permissions and Features"
2. Demandez les permissions suivantes :
   - `pages_manage_posts` (pour publier sur les pages)
   - `pages_read_engagement` (pour lire les infos des pages)
   - `public_profile` (permission de base)

**Note** : Ces permissions nécessitent une révision par Facebook. Soumettez votre demande avec :
- Une explication de votre cas d'usage
- Une vidéo de démonstration (optionnel mais recommandé)

### Étape 4 : Configuration dans AutoPost

Éditez votre fichier `backend/.env` :

```env
FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/oauth/facebook/callback
# En production: https://votre-domaine.com/api/oauth/facebook/callback
```

### Étape 5 : Créer une Page Facebook

**Important** : Pour publier sur Facebook via l'API, vous devez avoir une Page Facebook (pas un profil personnel).

1. Allez sur [Création de page Facebook](https://www.facebook.com/pages/create)
2. Créez une page (Business, Communauté, etc.)
3. Lors de la connexion dans AutoPost, vous pourrez publier sur cette page

## 🚀 Utilisation dans AutoPost

### 1. Connecter vos comptes

1. Connectez-vous à AutoPost
2. Allez dans l'onglet **"Comptes sociaux"**
3. Cliquez sur "Connecter LinkedIn" ou "Connecter Facebook"
4. Autorisez l'application dans la fenêtre popup
5. Vous serez redirigé vers AutoPost avec le compte connecté

### 2. Générer et publier un post

1. Allez dans l'onglet **"Générateur"**
2. Remplissez le formulaire et générez votre post
3. Une fois le post généré, vous verrez les boutons :
   - **Publier sur LinkedIn** (si compte connecté)
   - **Publier sur Facebook** (si compte connecté)
   - **Publier sur les deux** (si les deux comptes sont connectés)
4. Cliquez sur le bouton de publication souhaité
5. Le post sera publié automatiquement !

### 3. Vérifier la publication

- Pour LinkedIn : Le post apparaît sur votre profil LinkedIn
- Pour Facebook : Le post apparaît sur votre Page Facebook
- Un lien vers le post publié sera affiché dans l'interface

## ⚠️ Points importants

### LinkedIn

- **Vérification requise** : L'accès à "Share on LinkedIn" nécessite une vérification par LinkedIn
- **Limites** : LinkedIn impose des limites de taux (rate limits) sur les publications
- **Expiration** : Les tokens expirent et devront être renouvelés
- **Profil requis** : Vous devez publier depuis un profil LinkedIn (personnel ou page d'entreprise)

### Facebook

- **Page requise** : Vous devez avoir une Page Facebook (pas juste un profil)
- **Permissions** : Certaines permissions nécessitent une révision par Facebook
- **Mode développement** : En mode développement, seuls les testeurs de l'app peuvent se connecter
- **Mode production** : Vous devez soumettre l'app pour révision avant un usage public
- **Tokens longue durée** : AutoPost utilise des tokens longue durée (60 jours), mais ils expirent quand même

### Sécurité

- **Tokens stockés** : Les tokens OAuth sont stockés chiffrés dans la base de données
- **HTTPS requis** : En production, utilisez toujours HTTPS pour les callbacks OAuth
- **Secrets** : Ne partagez jamais vos Client Secrets
- **Expiration** : Reconnectez vos comptes quand les tokens expirent

## 🔧 Dépannage

### Erreur : "Token expiré"

**Solution** : Déconnectez et reconnectez votre compte dans l'onglet "Comptes sociaux"

### Erreur LinkedIn : "Share on LinkedIn not approved"

**Solution** : Votre application LinkedIn doit être approuvée pour "Share on LinkedIn"
- Soumettez une demande de vérification dans le Developer Portal
- Attendez l'approbation (2-3 jours ouvrables généralement)

### Erreur Facebook : "Pages scope not granted"

**Solution** :
1. Vérifiez que vous avez demandé les permissions `pages_manage_posts`
2. Soumettez votre app pour révision si nécessaire
3. En développement, ajoutez-vous comme testeur de l'app

### Erreur Facebook : "No pages found"

**Solution** : Créez une Page Facebook (pas un profil)
- L'API Facebook ne permet de publier que sur des Pages, pas sur des profils personnels

### Erreur : "Redirect URI mismatch"

**Solution** : Vérifiez que les URLs de redirection correspondent exactement :
- Dans `.env` : `LINKEDIN_REDIRECT_URI` ou `FACEBOOK_REDIRECT_URI`
- Dans la console développeur LinkedIn/Facebook
- Format exact : `http://localhost:5000/api/oauth/linkedin/callback` (pas de slash final)

## 📚 Ressources

### LinkedIn
- [Documentation API LinkedIn](https://docs.microsoft.com/en-us/linkedin/)
- [Guide Share on LinkedIn](https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)
- [LinkedIn Developer Portal](https://www.linkedin.com/developers/)

### Facebook
- [Documentation API Facebook](https://developers.facebook.com/docs/)
- [Guide Pages API](https://developers.facebook.com/docs/pages/)
- [Facebook App Review](https://developers.facebook.com/docs/app-review)
- [Facebook Developers Console](https://developers.facebook.com/apps/)

## 💡 Conseils

1. **Commencez en mode développement** : Testez d'abord avec vos comptes de test avant de passer en production

2. **Planifiez les révisions** :
   - LinkedIn : Quelques jours pour "Share on LinkedIn"
   - Facebook : 1-2 semaines pour les permissions avancées

3. **Préparez la documentation** :
   - Pour les révisions, préparez des captures d'écran et vidéos
   - Expliquez clairement votre cas d'usage

4. **Monitoring** :
   - Surveillez les logs pour détecter les erreurs de publication
   - Vérifiez régulièrement l'expiration des tokens

5. **Limites de taux** :
   - Ne publiez pas trop de posts en peu de temps
   - Respectez les limites des APIs (généralement raisonnables pour un usage normal)

---

**Besoin d'aide ?** Consultez les documentations officielles ou ouvrez une issue sur GitHub.
