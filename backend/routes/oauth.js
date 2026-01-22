const express = require('express');
const axios = require('axios');
const db = require('../config/database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Configuration OAuth LinkedIn
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

// Configuration OAuth Facebook
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

// ============================================
// LINKEDIN OAUTH
// ============================================

// Générer l'URL d'authentification LinkedIn
router.get('/linkedin/auth-url', authenticateToken, (req, res) => {
  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code` +
    `&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
    `&state=${state}` +
    `&scope=openid profile email w_member_social`;

  res.json({ success: true, authUrl });
});

// Callback OAuth LinkedIn
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=missing_params`);
    }

    // Décoder le state pour récupérer userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Échanger le code contre un access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in } = tokenResponse.data;

    // Récupérer les informations du profil LinkedIn
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const linkedinUserId = profileResponse.data.sub;
    const linkedinName = profileResponse.data.name;

    // Calculer la date d'expiration
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Sauvegarder ou mettre à jour le token
    await db.run(`
      INSERT INTO social_accounts (user_id, platform, platform_user_id, platform_username, access_token, expires_at)
      VALUES (?, 'linkedin', ?, ?, ?, ?)
      ON CONFLICT(user_id, platform)
      DO UPDATE SET
        platform_user_id = excluded.platform_user_id,
        platform_username = excluded.platform_username,
        access_token = excluded.access_token,
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, linkedinUserId, linkedinName, access_token, expiresAt]);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin_connected=true`);

  } catch (error) {
    console.error('Erreur lors du callback LinkedIn:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=linkedin_auth_failed`);
  }
});

// ============================================
// FACEBOOK OAUTH
// ============================================

// Générer l'URL d'authentification Facebook
router.get('/facebook/auth-url', authenticateToken, (req, res) => {
  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
    `&state=${state}` +
    `&scope=pages_manage_posts,pages_read_engagement,public_profile`;

  res.json({ success: true, authUrl });
});

// Callback OAuth Facebook
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=missing_params`);
    }

    // Décoder le state pour récupérer userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Échanger le code contre un access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: FACEBOOK_REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenResponse.data;

    // Récupérer les informations du profil
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name',
        access_token
      }
    });

    const facebookUserId = profileResponse.data.id;
    const facebookName = profileResponse.data.name;

    // Pour Facebook, obtenir un token longue durée
    const longLivedTokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        fb_exchange_token: access_token
      }
    });

    const longLivedToken = longLivedTokenResponse.data.access_token;
    const expiresIn = longLivedTokenResponse.data.expires_in || 5184000; // 60 jours par défaut

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Sauvegarder ou mettre à jour le token
    await db.run(`
      INSERT INTO social_accounts (user_id, platform, platform_user_id, platform_username, access_token, expires_at)
      VALUES (?, 'facebook', ?, ?, ?, ?)
      ON CONFLICT(user_id, platform)
      DO UPDATE SET
        platform_user_id = excluded.platform_user_id,
        platform_username = excluded.platform_username,
        access_token = excluded.access_token,
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, facebookUserId, facebookName, longLivedToken, expiresAt]);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?facebook_connected=true`);

  } catch (error) {
    console.error('Erreur lors du callback Facebook:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=facebook_auth_failed`);
  }
});

// ============================================
// VÉRIFICATION DES CONNEXIONS
// ============================================

// Vérifier les comptes connectés
router.get('/connected-accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await db.all(
      `SELECT platform, platform_username, expires_at,
              CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END as is_valid
       FROM social_accounts
       WHERE user_id = ?`,
      [req.user.id]
    );

    const connectedAccounts = {
      linkedin: null,
      facebook: null
    };

    accounts.forEach(account => {
      connectedAccounts[account.platform] = {
        username: account.platform_username,
        expiresAt: account.expires_at,
        isValid: account.is_valid === 1
      };
    });

    res.json({
      success: true,
      accounts: connectedAccounts
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Déconnecter un compte
router.delete('/disconnect/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;

    if (!['linkedin', 'facebook'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Plateforme invalide'
      });
    }

    await db.run(
      'DELETE FROM social_accounts WHERE user_id = ? AND platform = ?',
      [req.user.id, platform]
    );

    res.json({
      success: true,
      message: `Compte ${platform} déconnecté`
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
