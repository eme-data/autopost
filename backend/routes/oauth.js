const express = require('express');
const axios = require('axios');
const db = require('../config/database');
const settings = require('../config/settings');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// ============================================
// LINKEDIN OAUTH
// ============================================

// Générer l'URL d'authentification LinkedIn
router.get('/linkedin/auth-url', authenticateToken, async (req, res) => {
  try {
    const clientId = await settings.get('LINKEDIN_CLIENT_ID');
    const redirectUri = await settings.get('LINKEDIN_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return res.status(500).json({ success: false, message: 'Configuration LinkedIn incomplète' });
    }

    const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=openid profile email w_member_social`;

    res.json({ success: true, authUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Callback OAuth LinkedIn
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    const frontendUrl = await settings.get('FRONTEND_URL', 'http://localhost:3000');

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/dashboard?error=missing_params`);
    }

    const clientId = await settings.get('LINKEDIN_CLIENT_ID');
    const clientSecret = await settings.get('LINKEDIN_CLIENT_SECRET');
    const redirectUri = await settings.get('LINKEDIN_REDIRECT_URI');

    // Décoder le state pour récupérer userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Échanger le code contre un access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
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

    res.redirect(`${frontendUrl}/dashboard?linkedin_connected=true`);

  } catch (error) {
    console.error('Erreur lors du callback LinkedIn:', error.response?.data || error.message);
    const frontendUrl = await settings.get('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(`${frontendUrl}/dashboard?error=linkedin_auth_failed`);
  }
});

// ============================================
// FACEBOOK OAUTH
// ============================================

// Générer l'URL d'authentification Facebook
router.get('/facebook/auth-url', authenticateToken, async (req, res) => {
  try {
    const appId = await settings.get('FACEBOOK_APP_ID');
    const redirectUri = await settings.get('FACEBOOK_REDIRECT_URI');

    if (!appId || !redirectUri) {
      return res.status(500).json({ success: false, message: 'Configuration Facebook incomplète' });
    }

    const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=pages_manage_posts,pages_read_engagement,public_profile`;

    res.json({ success: true, authUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Callback OAuth Facebook
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const frontendUrl = await settings.get('FRONTEND_URL', 'http://localhost:3000');

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/dashboard?error=missing_params`);
    }

    const appId = await settings.get('FACEBOOK_APP_ID');
    const appSecret = await settings.get('FACEBOOK_APP_SECRET');
    const redirectUri = await settings.get('FACEBOOK_REDIRECT_URI');

    // Décoder le state pour récupérer userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Échanger le code contre un access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
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
        client_id: appId,
        client_secret: appSecret,
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

    res.redirect(`${frontendUrl}/dashboard?facebook_connected=true`);

  } catch (error) {
    console.error('Erreur lors du callback Facebook:', error.response?.data || error.message);
    const frontendUrl = await settings.get('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(`${frontendUrl}/dashboard?error=facebook_auth_failed`);
  }
});

// ============================================
// INSTAGRAM OAUTH
// ============================================

// Générer l'URL d'authentification Instagram (via Facebook Login)
router.get('/instagram/auth-url', authenticateToken, async (req, res) => {
  try {
    // Si Instagram ID/Secret non définis, fallback sur Facebook
    const fbAppId = await settings.get('FACEBOOK_APP_ID');
    const clientId = await settings.get('INSTAGRAM_CLIENT_ID', fbAppId);
    const redirectUri = await settings.get('INSTAGRAM_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return res.status(500).json({ success: false, message: 'Configuration Instagram incomplète' });
    }

    const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,public_profile`;

    res.json({ success: true, authUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Callback OAuth Instagram
router.get('/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=missing_params`);
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Échanger le code contre un access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenResponse.data;

    // Obtenir le token longue durée
    const longLivedTokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        fb_exchange_token: access_token
      }
    });

    const longLivedToken = longLivedTokenResponse.data.access_token;
    const expiresIn = longLivedTokenResponse.data.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Trouver le compte Instagram Business lié
    const accountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: longLivedToken,
        fields: 'id,name,instagram_business_account'
      }
    });

    let instagramAccount = null;
    let pageAccessToken = longLivedToken; // Fallback

    if (accountsResponse.data.data) {
      // Chercher la première page qui a un compte Instagram Business connecté
      for (const page of accountsResponse.data.data) {
        if (page.instagram_business_account) {
          instagramAccount = page.instagram_business_account;
          // Note : Pour publier, on utilise souvent le token de l'utilisateur avec les permissions de page,
          // mais le token de page est plus spécifique. Ici on garde le User Token longue durée pour simplifier
          // la gestion car il couvre toutes les pages, mais pour la production on pourrait stocker le Page Token.
          break;
        }
      }
    }

    if (!instagramAccount) {
      console.error('Aucun compte Instagram Business trouvé lié aux pages Facebook');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=no_instagram_business_account`);
    }

    // Récupérer les infos du compte Instagram
    const igInfoResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccount.id}`, {
      params: {
        access_token: longLivedToken, // Le token utilisateur suffit si on a les bons scopes
        fields: 'id,username,name'
      }
    });

    const igUser = igInfoResponse.data;

    // Sauvegarder
    await db.run(`
      INSERT INTO social_accounts (user_id, platform, platform_user_id, platform_username, access_token, expires_at)
      VALUES (?, 'instagram', ?, ?, ?, ?)
      ON CONFLICT(user_id, platform)
      DO UPDATE SET
        platform_user_id = excluded.platform_user_id,
        platform_username = excluded.platform_username,
        access_token = excluded.access_token,
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, igUser.id, igUser.username || igUser.name, longLivedToken, expiresAt]);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram_connected=true`);

  } catch (error) {
    console.error('Erreur lors du callback Instagram:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_auth_failed`);
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
      facebook: null,
      instagram: null
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

    if (!['linkedin', 'facebook', 'instagram'].includes(platform)) {
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
