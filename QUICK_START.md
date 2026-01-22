# Guide de Démarrage Rapide - AutoPost

Ce guide vous permet de démarrer rapidement avec AutoPost en 5 minutes.

## ⚡ Installation Express

### 1. Prérequis
- Node.js 18+ installé
- Clés API Claude et Gemini

### 2. Installation

```bash
# Cloner le projet
git clone <votre-repo>
cd autopost

# Déploiement automatique
chmod +x deploy.sh
./deploy.sh
```

### 3. Configuration

Éditez `backend/.env` avec vos clés API :

```bash
nano backend/.env
```

Configurez au minimum :
```env
JWT_SECRET=generer-une-cle-secrete-forte
ANTHROPIC_API_KEY=sk-ant-votre-cle
GEMINI_API_KEY=AIza-votre-cle
```

### 4. Démarrage

```bash
# Avec PM2 (production)
pm2 start ecosystem.config.js

# Ou sans PM2 (développement)
cd backend && npm start
```

### 5. Accès

Ouvrez votre navigateur sur :
- **Développement** : http://localhost:3000
- **Production** : http://votre-domaine.com

## 📝 Première Utilisation

1. Créez un compte sur la page d'inscription
2. Connectez-vous avec vos identifiants
3. Remplissez le formulaire de génération :
   - Sujet du post
   - Plateforme (LinkedIn/Facebook)
   - Modèle IA (Claude/Gemini)
   - Options de personnalisation
4. Cliquez sur "Générer le post"
5. Copiez le résultat !

## 🔑 Obtenir les Clés API

### Claude (Anthropic)
1. Allez sur https://console.anthropic.com/
2. Créez un compte
3. Allez dans "API Keys"
4. Créez une nouvelle clé
5. Copiez-la dans `ANTHROPIC_API_KEY`

### Gemini (Google)
1. Allez sur https://makersuite.google.com/app/apikey
2. Connectez-vous avec Google
3. Cliquez sur "Create API Key"
4. Copiez-la dans `GEMINI_API_KEY`

## 🚀 Déploiement Production

Pour un déploiement complet sur serveur Linux, consultez [INSTALLATION.md](INSTALLATION.md).

Configuration minimum requise :
- Nginx (reverse proxy)
- PM2 (gestionnaire de processus)
- SSL/HTTPS (Let's Encrypt)

## 🆘 Problèmes Courants

**Backend ne démarre pas :**
```bash
pm2 logs autopost-backend
```

**Port 5000 déjà utilisé :**
```bash
sudo lsof -i :5000
# Puis tuez le processus ou changez le port dans .env
```

**Erreur de clé API :**
- Vérifiez que les clés sont bien copiées dans `.env`
- Vérifiez qu'il n'y a pas d'espaces avant/après
- Redémarrez le backend : `pm2 restart autopost-backend`

## 📚 Documentation Complète

- [README.md](README.md) - Documentation complète
- [INSTALLATION.md](INSTALLATION.md) - Guide d'installation détaillé
- [test-installation.sh](test-installation.sh) - Script de test

## 💡 Commandes Utiles

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs

# Redémarrer
pm2 restart autopost-backend

# Arrêter
pm2 stop autopost-backend

# Test d'API
curl http://localhost:5000/api/health
```

---

**Prêt à générer vos premiers posts IA !** 🎉
