# Guide du Panneau d'Administration

Ce guide explique comment accéder et utiliser le panneau d'administration d'AutoPost.

## 🔑 Accès au Panneau d'Administration

### Créer le Premier Administrateur

Par défaut, tous les nouveaux comptes créés ont le rôle "user". Pour créer le premier administrateur, vous devez modifier manuellement la base de données.

#### Méthode 1 : Lors de l'inscription

1. Créez un compte normalement via l'interface d'inscription
2. Connectez-vous à votre serveur et accédez à la base de données SQLite :

```bash
cd /chemin/vers/autopost/backend
sqlite3 database.sqlite
```

3. Trouvez votre ID utilisateur :

```sql
SELECT id, email FROM users WHERE email = 'votre@email.com';
```

4. Donnez-vous les droits admin :

```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

5. Quittez SQLite :

```sql
.quit
```

6. Reconnectez-vous à l'interface pour voir apparaître l'accès admin

#### Méthode 2 : Via un script

Créez un fichier `create-admin.js` dans le dossier `backend` :

```javascript
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const firstname = process.argv[4] || 'Admin';
  const lastname = process.argv[5] || 'User';

  if (!email || !password) {
    console.error('Usage: node create-admin.js <email> <password> [firstname] [lastname]');
    process.exit(1);
  }

  try {
    // Vérifier si l'email existe déjà
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);

    if (existing) {
      console.log('Utilisateur existant trouvé. Mise à jour en admin...');
      await db.run('UPDATE users SET role = ? WHERE email = ?', ['admin', email]);
      console.log('✓ Utilisateur mis à jour en admin');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run(
        'INSERT INTO users (email, password, firstname, lastname, role) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, firstname, lastname, 'admin']
      );
      console.log('✓ Compte admin créé avec succès');
    }

    console.log(`Email: ${email}`);
    console.log('Vous pouvez maintenant vous connecter avec ces identifiants.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

createAdmin();
```

Puis exécutez :

```bash
node create-admin.js admin@example.com motdepasse Admin Système
```

## 📊 Fonctionnalités du Panneau d'Administration

### 1. Tableau de Bord (Statistiques)

Accédez à une vue d'ensemble complète de l'application :

- **Nombre total d'utilisateurs**
- **Nombre total de posts générés**
- **Répartition par plateforme** (LinkedIn, Facebook)
- **Répartition par modèle IA** (Claude, Gemini)
- **Statistiques de publication** (publiés vs brouillons)
- **Comptes sociaux connectés**
- **Utilisateurs les plus actifs**
- **Activité récente** (7 derniers jours)

### 2. Gestion des Utilisateurs

Gérez tous les utilisateurs de la plateforme :

#### Fonctionnalités :
- **➕ Créer un utilisateur** : Ajoutez directement des comptes sans auto-inscription
- **Liste complète** des utilisateurs avec recherche
- **Pagination** pour les grandes listes
- **✏️ Modifier un utilisateur** : Email, prénom, nom
- **🔑 Réinitialiser le mot de passe** : Définir un nouveau mot de passe
- **Modification du rôle** (user ↔ admin)
- **Activation/Désactivation** de comptes
- **🗑️ Suppression** d'utilisateurs (avec confirmation)
- **Statistiques par utilisateur** (nombre de posts)

#### Créer un utilisateur secondaire :

**Étape 1 : Accéder au panneau**
1. Connectez-vous en tant qu'admin
2. Cliquez sur "Administration" dans la navbar
3. Allez dans l'onglet "👥 Utilisateurs"

**Étape 2 : Créer le compte**
1. Cliquez sur le bouton "➕ Créer un utilisateur"
2. Remplissez le formulaire :
   - **Email** : Adresse email de l'utilisateur (sera son identifiant)
   - **Mot de passe** : Au moins 6 caractères (à communiquer à l'utilisateur)
   - **Prénom** : Prénom de l'utilisateur
   - **Nom** : Nom de famille
   - **Rôle** : Choisir "User" pour un accès standard ou "Admin" pour un administrateur
3. Cliquez sur "Créer l'utilisateur"

**Étape 3 : Communiquer les identifiants**
- Communiquez l'email et le mot de passe à l'utilisateur de manière sécurisée
- Recommandez-lui de changer son mot de passe après la première connexion

💡 **Astuce** : L'utilisateur peut modifier son mot de passe depuis son profil utilisateur.

#### Modifier un utilisateur :

1. Dans la liste des utilisateurs, cliquez sur "✏️ Éditer"
2. Modifiez les informations nécessaires :
   - Email
   - Prénom
   - Nom
3. Cliquez sur "Enregistrer"

#### Réinitialiser un mot de passe :

1. Dans la modal d'édition de l'utilisateur
2. Cliquez sur "🔑 Réinitialiser mot de passe"
3. Saisissez le nouveau mot de passe (au moins 6 caractères)
4. Cliquez sur "Réinitialiser"
5. Communiquez le nouveau mot de passe à l'utilisateur

⚠️ **Important** : Toutes ces actions sont enregistrées dans les logs d'audit.

#### Actions disponibles :

**Changer le rôle :**
- Sélectionnez "Admin" ou "User" dans le menu déroulant
- La modification est immédiate

**Activer/Désactiver :**
- Utilisateurs désactivés ne peuvent plus se connecter
- Leurs données restent conservées

**Supprimer :**
- ⚠️ Action irréversible
- Supprime également tous les posts et comptes sociaux de l'utilisateur

### 3. Configuration

Gérez les paramètres de l'application :

#### Paramètres gérables :
- Clés API (Anthropic, Gemini, LinkedIn, Facebook)
- Configuration générale de l'application
- Paramètres personnalisés

#### Sécurité :
- Les valeurs sensibles sont **masquées** par défaut
- Modification sécurisée avec confirmation
- Logs d'audit pour toutes les modifications

⚠️ **Important :** Les variables d'environnement dans `.env` ont toujours la priorité sur les paramètres en base de données.

### 4. Logs d'Audit

Consultez l'historique de toutes les actions administratives :

#### Informations trackées :
- **Action effectuée** (création, modification, suppression)
- **Utilisateur** ayant effectué l'action
- **Ressource modifiée**
- **Détails** de la modification
- **Date et heure**
- **Adresse IP** (si disponible)

#### Types d'actions :
- Modifications de rôles
- Activation/Désactivation d'utilisateurs
- Suppressions
- Modifications de configuration
- Autres actions administratives

## 🔒 Sécurité et Bonnes Pratiques

### Protection du Panneau

1. **Authentification requise**
   - Seuls les utilisateurs connectés peuvent accéder
   - Vérification du rôle à chaque requête

2. **Restrictions**
   - Impossible de se retirer ses propres droits admin
   - Impossible de se désactiver soi-même
   - Impossible de se supprimer soi-même

3. **Logs d'audit**
   - Toutes les actions sont enregistrées
   - Traçabilité complète

### Recommandations

✅ **À faire :**
- Créer au moins 2 comptes admin (redondance)
- Vérifier régulièrement les logs d'audit
- Utiliser des mots de passe forts pour les admins
- Limiter le nombre d'administrateurs
- Sauvegarder la base de données régulièrement

❌ **À éviter :**
- Ne jamais partager les identifiants admin
- Ne pas stocker les clés API sensibles en BDD en production (utiliser .env)
- Ne pas donner les droits admin sans raison valable
- Ne pas supprimer le dernier compte admin

## 📱 Accès au Panneau

### URL d'accès

Une fois connecté en tant qu'admin :

1. **Depuis le Dashboard** : Cliquez sur le bouton "Administration" dans la barre de navigation
2. **URL directe** : `https://votre-domaine.com/admin`

### Indicateurs visuels

Les administrateurs voient :
- 👑 Badge "ADMIN" dans la navbar
- Bouton "Administration" dans le menu
- Accès à toutes les fonctionnalités utilisateur standard

## 🔄 Workflow Typique

### Gestion quotidienne

1. **Matin** : Consulter les statistiques du dashboard
2. **Régulier** : Vérifier les nouveaux utilisateurs
3. **Hebdomadaire** : Consulter les logs d'audit
4. **Mensuel** : Vérifier les comptes inactifs

### Gestion d'un nouvel utilisateur

1. L'utilisateur s'inscrit normalement
2. Admin reçoit notification (à implémenter si besoin)
3. Admin vérifie le compte dans "Utilisateurs"
4. Si nécessaire, ajuste le rôle ou le statut

### Résolution de problème

1. Utilisateur signale un problème
2. Admin consulte l'historique dans "Utilisateurs"
3. Admin vérifie les logs d'audit si nécessaire
4. Admin prend l'action appropriée

## 🛠️ Maintenance

### Tâches régulières

**Quotidien :**
- Vérifier que l'application fonctionne (statistiques)
- Surveiller les logs pour détecter des anomalies

**Hebdomadaire :**
- Analyser l'utilisation (posts générés, plateformes)
- Vérifier les comptes sociaux connectés

**Mensuel :**
- Nettoyer les comptes inactifs si nécessaire
- Vérifier et mettre à jour les clés API si besoin
- Sauvegarder la base de données

### Backup

Sauvegardez régulièrement :

```bash
# Base de données
cp backend/database.sqlite backup/database_$(date +%Y%m%d).sqlite

# Configuration
cp backend/.env backup/.env_$(date +%Y%m%d)
```

## 🚨 En cas de Problème

### Perte d'accès admin

Si vous perdez l'accès admin :

1. Connectez-vous au serveur
2. Accédez à la base de données SQLite
3. Rétablissez vos droits :

```bash
sqlite3 backend/database.sqlite
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
.quit
```

### Compte admin compromis

1. Désactivez le compte immédiatement
2. Vérifiez les logs d'audit
3. Changez toutes les clés API
4. Créez un nouveau compte admin
5. Supprimez le compte compromis

### Base de données corrompue

1. Arrêtez l'application
2. Restaurez depuis un backup
3. Vérifiez l'intégrité
4. Redémarrez

## 📞 Support

Pour toute question ou problème :

1. Consultez la documentation complète (README.md)
2. Vérifiez les logs serveur : `pm2 logs`
3. Consultez les logs d'audit dans le panneau admin
4. Ouvrez une issue sur GitHub si nécessaire

---

**Note :** Ce panneau d'administration est conçu pour une utilisation en environnement de confiance. En production, considérez l'ajout de couches de sécurité supplémentaires (2FA, IP whitelisting, etc.).
