# 🔄 Guide de Mise à Jour du Serveur

## Mise à jour avec Docker (Recommandé)

### Méthode Automatique - Script de Mise à Jour

Connectez-vous à votre serveur et exécutez :

```bash
cd /chemin/vers/autopost

# Récupérer les dernières modifications depuis GitHub
git pull

# Lancer le script de mise à jour
chmod +x docker-update.sh
./docker-update.sh
```

**Ce script fait automatiquement :**
1. ✅ Pull du code depuis Git
2. ✅ Reconstruction des images Docker (sans cache)
3. ✅ Redémarrage des conteneurs
4. ✅ Nettoyage des anciennes images
5. ✅ Vérification de l'état

### Méthode Manuelle

Si vous préférez faire étape par étape :

```bash
cd /chemin/vers/autopost

# 1. Récupérer le code
git pull

# 2. Reconstruire les images
docker compose build --no-cache
# ou
docker-compose build --no-cache

# 3. Redémarrer les services
docker compose up -d --force-recreate
# ou
docker-compose up -d --force-recreate

# 4. Vérifier l'état
docker compose ps
# ou
docker-compose ps
```

---

## Mise à Jour pour les Nouvelles Fonctionnalités

### ✨ Gestion des Utilisateurs Secondaires (Nouvelle)

Aucune action supplémentaire n'est requise ! Après la mise à jour :

1. Connectez-vous en tant qu'admin
2. Allez dans **Administration → Utilisateurs**
3. Vous verrez le nouveau bouton **"➕ Créer un utilisateur"**

**Nouvelles fonctionnalités disponibles :**
- Créer des utilisateurs sans auto-inscription
- Modifier email, prénom, nom des utilisateurs
- Réinitialiser les mots de passe depuis l'interface admin

Consultez [ADMIN_GUIDE.md](ADMIN_GUIDE.md#2-gestion-des-utilisateurs) pour plus de détails.

---

## Vérification Post-Mise à Jour

### 1. Vérifier que les conteneurs tournent

```bash
docker compose ps
```

Vous devriez voir :
- ✅ `autopost-backend` (healthy)
- ✅ `autopost-frontend` (healthy)

### 2. Vérifier les logs

```bash
# Logs en temps réel
docker compose logs -f

# Logs backend uniquement
docker compose logs backend

# Logs frontend uniquement
docker compose logs frontend
```

### 3. Tester l'application

1. Ouvrez votre navigateur : `http://votre-domaine.com`
2. Connectez-vous en tant qu'admin
3. Testez la nouvelle fonctionnalité :
   - Allez dans **Administration**
   - Cliquez sur l'onglet **👥 Utilisateurs**
   - Vérifiez que le bouton **"➕ Créer un utilisateur"** est présent

---

## Résolution de Problèmes

### Les conteneurs ne démarrent pas

```bash
# Voir les logs d'erreur
docker compose logs

# Redémarrer complètement
docker compose down
docker compose up -d
```

### Erreur de build

```bash
# Nettoyer complètement et reconstruire
docker compose down
docker system prune -a
./docker-deploy.sh
```

### Base de données corrompue

Si vous avez fait un backup (recommandé) :

```bash
# Restaurer la base de données
docker compose down
cp /chemin/vers/backup/database.sqlite /chemin/vers/volume/sqlite_data/
docker compose up -d
```

### Port déjà utilisé

```bash
# Modifier le port dans .env
nano .env
# Changez EXTERNAL_PORT=80 par EXTERNAL_PORT=8080 (par exemple)

# Redémarrer
docker compose down
docker compose up -d
```

---

## Sauvegarde Avant Mise à Jour (Recommandé)

**Toujours faire une sauvegarde avant mise à jour :**

```bash
# Créer un dossier de backup avec la date
mkdir -p backups/$(date +%Y%m%d)

# Copier la base de données
docker compose cp autopost-backend:/app/data/database.sqlite backups/$(date +%Y%m%d)/

# Ou utiliser le script de backup si disponible
./docker-backup.sh
```

---

## Mise à Jour depuis Windows (Développement Local)

Si vous testez en local sur Windows :

```powershell
cd C:\Users\MDO SERVICES\Documents\github\autopost\autopost

# Récupérer les modifications
git pull

# Reconstruire et redémarrer
docker compose build --no-cache
docker compose up -d --force-recreate

# Vérifier
docker compose ps
```

---

## Rollback (Retour Arrière)

Si quelque chose ne va pas après la mise à jour :

```bash
# 1. Revenir à la version précédente du code
git log --oneline  # Voir l'historique
git checkout HASH_DU_COMMIT_PRECEDENT

# 2. Reconstruire avec l'ancienne version
docker compose build --no-cache
docker compose up -d --force-recreate

# 3. Restaurer la base de données si nécessaire
docker compose cp /chemin/vers/backup/database.sqlite autopost-backend:/app/data/
```

---

## Fréquence de Mise à Jour Recommandée

- **Corrections de bugs** : Dès que disponibles
- **Nouvelles fonctionnalités** : Mensuellement
- **Mises à jour de sécurité** : Immédiatement

---

## Support

En cas de problème :

1. Vérifiez les logs : `docker compose logs`
2. Consultez [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
3. Consultez [DOCKER.md](DOCKER.md)
4. Ouvrez une issue sur GitHub

---

**🎉 Mise à jour terminée avec succès !**
