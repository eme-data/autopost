require('dotenv').config();
const db = require('./config/database');

const DEFAULT_SETTINGS = [
  // Clés API IA
  {
    key: 'ANTHROPIC_API_KEY',
    category: 'API - Intelligence Artificielle',
    description: 'Clé API Claude (Anthropic) pour la génération de posts',
    is_sensitive: 1
  },
  {
    key: 'GEMINI_API_KEY',
    category: 'API - Intelligence Artificielle',
    description: 'Clé API Gemini (Google) pour la génération de posts',
    is_sensitive: 1
  },

  // LinkedIn OAuth
  {
    key: 'LINKEDIN_CLIENT_ID',
    category: 'OAuth - LinkedIn',
    description: 'Client ID de l\'application LinkedIn',
    is_sensitive: 0
  },
  {
    key: 'LINKEDIN_CLIENT_SECRET',
    category: 'OAuth - LinkedIn',
    description: 'Client Secret de l\'application LinkedIn',
    is_sensitive: 1
  },
  {
    key: 'LINKEDIN_REDIRECT_URI',
    category: 'OAuth - LinkedIn',
    description: 'URL de redirection OAuth LinkedIn (ex: https://domain.com/api/oauth/linkedin/callback)',
    is_sensitive: 0
  },

  // Facebook OAuth
  {
    key: 'FACEBOOK_APP_ID',
    category: 'OAuth - Facebook',
    description: 'App ID de l\'application Facebook',
    is_sensitive: 0
  },
  {
    key: 'FACEBOOK_APP_SECRET',
    category: 'OAuth - Facebook',
    description: 'App Secret de l\'application Facebook',
    is_sensitive: 1
  },
  {
    key: 'FACEBOOK_REDIRECT_URI',
    category: 'OAuth - Facebook',
    description: 'URL de redirection OAuth Facebook (ex: https://domain.com/api/oauth/facebook/callback)',
    is_sensitive: 0
  },

  // Configuration générale
  {
    key: 'JWT_SECRET',
    category: 'Sécurité',
    description: 'Clé secrète pour signer les tokens JWT',
    is_sensitive: 1
  },
  {
    key: 'JWT_EXPIRES_IN',
    category: 'Sécurité',
    description: 'Durée de validité des tokens JWT (ex: 7d pour 7 jours)',
    is_sensitive: 0
  },
  {
    key: 'FRONTEND_URL',
    category: 'Configuration',
    description: 'URL du frontend (pour CORS et redirections)',
    is_sensitive: 0
  },
  {
    key: 'PORT',
    category: 'Configuration',
    description: 'Port du serveur backend',
    is_sensitive: 0
  },
  {
    key: 'NODE_ENV',
    category: 'Configuration',
    description: 'Environnement (development, production)',
    is_sensitive: 0
  }
];

async function initSettings() {
  console.log('🔧 Initialisation des paramètres de configuration...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const setting of DEFAULT_SETTINGS) {
    try {
      const existing = await db.get('SELECT id, value FROM settings WHERE key = ?', [setting.key]);

      // Valeur par défaut depuis .env
      const envValue = process.env[setting.key] || '';

      if (existing) {
        // Si le paramètre existe déjà
        if (!existing.value || existing.value === '') {
          // Si la valeur est vide, on met à jour avec la valeur .env
          await db.run(
            `UPDATE settings
             SET category = ?, description = ?, is_sensitive = ?, value = ?, updated_at = CURRENT_TIMESTAMP
             WHERE key = ?`,
            [setting.category, setting.description, setting.is_sensitive, envValue, setting.key]
          );
          console.log(`✓ Mis à jour: ${setting.key}`);
          updated++;
        } else {
          // Sinon on garde la valeur existante et on met juste à jour les métadonnées
          await db.run(
            `UPDATE settings
             SET category = ?, description = ?, is_sensitive = ?
             WHERE key = ?`,
            [setting.category, setting.description, setting.is_sensitive, setting.key]
          );
          console.log(`→ Conservé: ${setting.key} (valeur existante préservée)`);
          skipped++;
        }
      } else {
        // Créer le nouveau paramètre
        await db.run(
          `INSERT INTO settings (key, value, category, description, is_sensitive)
           VALUES (?, ?, ?, ?, ?)`,
          [setting.key, envValue, setting.category, setting.description, setting.is_sensitive]
        );
        console.log(`+ Créé: ${setting.key}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${setting.key}:`, error.message);
    }
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     ✅ INITIALISATION TERMINÉE         ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Créés: ${String(created).padEnd(29)} ║`);
  console.log(`║  Mis à jour: ${String(updated).padEnd(24)} ║`);
  console.log(`║  Conservés: ${String(skipped).padEnd(25)} ║`);
  console.log('╚════════════════════════════════════════╝\n');

  console.log('📝 Notes:');
  console.log('- Les valeurs du fichier .env ont été importées');
  console.log('- Les valeurs existantes en BDD ont été préservées');
  console.log('- Vous pouvez maintenant gérer la configuration via l\'interface admin');
  console.log('- Les variables .env ont toujours la priorité si définies\n');

  console.log('🌐 Accès admin: http://localhost:3000/admin (en développement)\n');

  await db.close();
  process.exit(0);
}

// Vérifier que la base de données existe
setTimeout(() => {
  initSettings().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}, 1000); // Attendre que la DB soit initialisée
