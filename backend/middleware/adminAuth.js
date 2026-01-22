const jwt = require('jsonwebtoken');
const db = require('../config/database');

const requireAdmin = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié (via le middleware auth)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier le rôle de l'utilisateur dans la base de données
    const user = await db.get(
      'SELECT id, email, role, is_active FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Droits administrateur requis.'
      });
    }

    // Ajouter les infos complètes de l'utilisateur à la requête
    req.user.role = user.role;
    req.user.is_active = user.is_active;

    next();
  } catch (error) {
    console.error('Erreur dans le middleware admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = requireAdmin;
