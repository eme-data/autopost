const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

// Toutes les routes nécessitent l'authentification ET le rôle admin
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// STATISTIQUES
// ============================================

router.get('/stats', async (req, res) => {
  try {
    // Nombre total d'utilisateurs
    const usersCount = await db.get('SELECT COUNT(*) as count FROM users');

    // Nombre total de posts
    const postsCount = await db.get('SELECT COUNT(*) as count FROM posts');

    // Posts par plateforme
    const postsByPlatform = await db.all(`
      SELECT platform, COUNT(*) as count
      FROM posts
      GROUP BY platform
    `);

    // Posts par modèle IA
    const postsByAI = await db.all(`
      SELECT ai_model, COUNT(*) as count
      FROM posts
      GROUP BY ai_model
    `);

    // Posts publiés vs non publiés
    const publishedStats = await db.get(`
      SELECT
        SUM(CASE WHEN published_to_linkedin = 1 OR published_to_facebook = 1 THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN published_to_linkedin = 0 AND published_to_facebook = 0 THEN 1 ELSE 0 END) as not_published
      FROM posts
    `);

    // Comptes sociaux connectés
    const socialAccounts = await db.all(`
      SELECT platform, COUNT(*) as count
      FROM social_accounts
      GROUP BY platform
    `);

    // Posts créés au cours des 7 derniers jours
    const recentPosts = await db.all(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM posts
      WHERE created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Utilisateurs les plus actifs
    const topUsers = await db.all(`
      SELECT
        u.id,
        u.email,
        u.firstname,
        u.lastname,
        COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY post_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        users: {
          total: usersCount.count,
          topUsers
        },
        posts: {
          total: postsCount.count,
          byPlatform: postsByPlatform,
          byAI: postsByAI,
          published: publishedStats.published || 0,
          notPublished: publishedStats.not_published || 0,
          recent: recentPosts
        },
        socialAccounts
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================
// GESTION DES UTILISATEURS
// ============================================

// Créer un nouvel utilisateur
router.post('/users', async (req, res) => {
  try {
    const { email, password, firstname, lastname, role = 'user' } = req.body;

    // Validation
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis (email, password, firstname, lastname)'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await db.run(
      'INSERT INTO users (email, password, firstname, lastname, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, firstname, lastname, role]
    );

    // Log d'audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_USER', 'user', result.id, JSON.stringify({ email, role })]
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: result.id,
        email,
        firstname,
        lastname,
        role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Liste de tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        u.id,
        u.email,
        u.firstname,
        u.lastname,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login,
        COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
    `;

    const params = [];

    if (search) {
      query += ` WHERE u.email LIKE ? OR u.firstname LIKE ? OR u.lastname LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const users = await db.all(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    if (search) {
      countQuery += ` WHERE email LIKE ? OR firstname LIKE ? OR lastname LIKE ?`;
    }

    const totalCount = await db.get(
      countQuery,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Détails d'un utilisateur
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.get(`
      SELECT
        id, email, firstname, lastname, role, is_active, created_at, last_login
      FROM users
      WHERE id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Posts de l'utilisateur
    const posts = await db.all(`
      SELECT id, platform, ai_model, topic, created_at, published_to_linkedin, published_to_facebook
      FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    // Comptes sociaux connectés
    const socialAccounts = await db.all(`
      SELECT platform, platform_username, expires_at
      FROM social_accounts
      WHERE user_id = ?
    `, [id]);

    res.json({
      success: true,
      user: {
        ...user,
        recentPosts: posts,
        socialAccounts
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Modifier un utilisateur
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstname, lastname } = req.body;

    // Validation
    if (!email || !firstname || !lastname) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis (email, firstname, lastname)'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé par un autre utilisateur'
      });
    }

    // Mettre à jour l'utilisateur
    await db.run(
      'UPDATE users SET email = ?, firstname = ?, lastname = ? WHERE id = ?',
      [email, firstname, lastname, id]
    );

    // Log d'audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_USER', 'user', id, JSON.stringify({ email, firstname, lastname })]
    );

    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Modifier le rôle d'un utilisateur
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Ne pas se désactiver soi-même
    if (parseInt(id) === req.user.id && role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas retirer vos propres droits admin'
      });
    }

    await db.run(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    // Log d'audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_ROLE', 'user', id, JSON.stringify({ newRole: role })]
    );

    res.json({
      success: true,
      message: `Rôle modifié en ${role}`
    });

  } catch (error) {
    console.error('Erreur lors de la modification du rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Réinitialiser le mot de passe d'un utilisateur
router.put('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe est requis'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe
    await db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    // Log d'audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource, resource_id) VALUES (?, ?, ?, ?)',
      [req.user.id, 'RESET_PASSWORD', 'user', id]
    );

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Activer/désactiver un utilisateur
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Ne pas se désactiver soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    await db.run(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    // Log d'audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'user', id, null]
    );

    res.json({
      success: true,
      message: `Utilisateur ${is_active ? 'activé' : 'désactivé'}`
    });

  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Ne pas se supprimer soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Supprimer les données associées
    await db.run('DELETE FROM posts WHERE user_id = ?', [id]);
    await db.run('DELETE FROM social_accounts WHERE user_id = ?', [id]);
    await db.run('DELETE FROM users WHERE id = ?', [id]);

    // Log d'audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource, resource_id) VALUES (?, ?, ?, ?)',
      [req.user.id, 'DELETE_USER', 'user', id]
    );

    res.json({
      success: true,
      message: 'Utilisateur supprimé'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================
// CONFIGURATION
// ============================================

// Récupérer toutes les configurations
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.all(
      'SELECT id, key, value, category, description, is_sensitive FROM settings ORDER BY category, key'
    );

    // Masquer les valeurs sensibles
    const safeSettings = settings.map(setting => ({
      ...setting,
      value: setting.is_sensitive ? '••••••••' : setting.value
    }));

    res.json({
      success: true,
      settings: safeSettings
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Mettre à jour une configuration
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Vérifier si la configuration existe
    const existing = await db.get('SELECT id FROM settings WHERE key = ?', [key]);

    if (existing) {
      await db.run(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE key = ?',
        [value, req.user.id, key]
      );
    } else {
      await db.run(
        'INSERT INTO settings (key, value, updated_by) VALUES (?, ?, ?)',
        [key, value, req.user.id]
      );
    }

    // Log d'audit (sans la valeur si sensible)
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'UPDATE_SETTING', 'settings', JSON.stringify({ key })]
    );

    res.json({
      success: true,
      message: 'Configuration mise à jour'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du paramètre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================
// LOGS D'AUDIT
// ============================================

router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await db.all(`
      SELECT
        al.id,
        al.action,
        al.resource,
        al.resource_id,
        al.details,
        al.ip_address,
        al.created_at,
        u.email as user_email,
        u.firstname,
        u.lastname
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    const totalCount = await db.get('SELECT COUNT(*) as count FROM audit_logs');

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================
// GESTION DE LA CONFIGURATION
// ============================================

// Recharger la configuration (invalider le cache)
router.post('/settings/reload', async (req, res) => {
  try {
    // Si le module settings existe, recharger le cache
    const settingsManager = require('../config/settings');
    if (settingsManager && settingsManager.clearCache) {
      settingsManager.clearCache();
    }

    // Log d'audit
    await db.run(
      'INSERT INTO audit_logs (user_id, action, resource) VALUES (?, ?, ?)',
      [req.user.id, 'RELOAD_SETTINGS', 'settings']
    );

    res.json({
      success: true,
      message: 'Configuration rechargée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du rechargement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
