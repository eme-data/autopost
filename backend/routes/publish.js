const express = require('express');
const axios = require('axios');
const db = require('../config/database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// ============================================
// PUBLICATION LINKEDIN
// ============================================

async function publishToLinkedIn(userId, content) {
  try {
    // Récupérer le token d'accès
    const account = await db.get(
      `SELECT access_token, expires_at, platform_user_id
       FROM social_accounts
       WHERE user_id = ? AND platform = 'linkedin'`,
      [userId]
    );

    if (!account) {
      throw new Error('Compte LinkedIn non connecté');
    }

    // Vérifier si le token est encore valide
    if (new Date(account.expires_at) <= new Date()) {
      throw new Error('Token LinkedIn expiré. Veuillez reconnecter votre compte.');
    }

    // Créer le post LinkedIn
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:person:${account.platform_user_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return {
      success: true,
      postId: response.data.id,
      url: `https://www.linkedin.com/feed/update/${response.data.id}`
    };

  } catch (error) {
    console.error('Erreur publication LinkedIn:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Erreur lors de la publication sur LinkedIn'
    );
  }
}

// ============================================
// PUBLICATION FACEBOOK
// ============================================

async function publishToFacebook(userId, content) {
  try {
    // Récupérer le token d'accès
    const account = await db.get(
      `SELECT access_token, expires_at, platform_user_id
       FROM social_accounts
       WHERE user_id = ? AND platform = 'facebook'`,
      [userId]
    );

    if (!account) {
      throw new Error('Compte Facebook non connecté');
    }

    // Vérifier si le token est encore valide
    if (new Date(account.expires_at) <= new Date()) {
      throw new Error('Token Facebook expiré. Veuillez reconnecter votre compte.');
    }

    // Récupérer les pages gérées par l'utilisateur
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${account.platform_user_id}/accounts`,
      {
        params: {
          access_token: account.access_token
        }
      }
    );

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error('Aucune page Facebook trouvée. Vous devez gérer au moins une page pour publier.');
    }

    // Utiliser la première page
    const page = pagesResponse.data.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    // Publier sur la page
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        message: content,
        access_token: pageAccessToken
      }
    );

    return {
      success: true,
      postId: response.data.id,
      url: `https://www.facebook.com/${response.data.id.replace('_', '/posts/')}`
    };

  } catch (error) {
    console.error('Erreur publication Facebook:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message ||
      error.message ||
      'Erreur lors de la publication sur Facebook'
    );
  }
}

// ============================================
// PUBLICATION INSTAGRAM
// ============================================

async function publishToInstagram(userId, content, imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('Une image est requise pour publier sur Instagram');
    }

    // Récupérer le token d'accès
    const account = await db.get(
      `SELECT access_token, expires_at, platform_user_id
       FROM social_accounts
       WHERE user_id = ? AND platform = 'instagram'`,
      [userId]
    );

    if (!account) {
      throw new Error('Compte Instagram non connecté');
    }

    // Vérifier si le token est encore valide
    // Note: Les tokens longue durée FB/Insta sont validés par l'appel API, mais on peut vérifier la date
    if (new Date(account.expires_at) <= new Date()) {
      // On pourrait rafraichir ici, mais pour l'instant on demande reconnexion
      throw new Error('Token Instagram expiré. Veuillez reconnecter votre compte.');
    }

    const igUserId = account.platform_user_id;
    const accessToken = account.access_token;

    // 1. Créer le conteneur média
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        image_url: imageUrl,
        caption: content,
        access_token: accessToken
      }
    );

    const creationId = containerResponse.data.id;

    // 2. Publier le conteneur
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    );

    const postId = publishResponse.data.id;

    // Récupérer le permalink (optionnel, mais sympa pour l'UI)
    let permalink = `https://www.instagram.com/p/${postId}/`; // Fallback simple car l'ID n'est pas le shortcode
    try {
      const permalinkResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${postId}`, {
        params: {
          fields: 'permalink',
          access_token: accessToken
        }
      }
      );
      if (permalinkResponse.data.permalink) {
        permalink = permalinkResponse.data.permalink;
      }
    } catch (e) {
      // Ignorer erreur permalink
    }

    return {
      success: true,
      postId: postId,
      url: permalink
    };

  } catch (error) {
    console.error('Erreur publication Instagram:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message ||
      error.message ||
      'Erreur lors de la publication sur Instagram'
    );
  }
}

// ============================================
// ROUTES API
// ============================================

// Publier sur Instagram
router.post('/instagram', authenticateToken, async (req, res) => {
  try {
    const { content, imageUrl, postId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du post est requis'
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Une image est requise pour publier sur Instagram'
      });
    }

    const result = await publishToInstagram(req.user.id, content, imageUrl);

    // Mettre à jour le post dans la base de données si un ID est fourni
    if (postId) {
      await db.run(
        `UPDATE posts
         SET published_to_instagram = 1,
             instagram_post_url = ?,
             image_url = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [result.url, imageUrl, postId, req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Post publié sur Instagram avec succès',
      url: result.url
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Publier sur LinkedIn
router.post('/linkedin', authenticateToken, async (req, res) => {
  try {
    const { content, postId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du post est requis'
      });
    }

    const result = await publishToLinkedIn(req.user.id, content);

    // Mettre à jour le post dans la base de données si un ID est fourni
    if (postId) {
      await db.run(
        `UPDATE posts
         SET published_to_linkedin = 1,
             linkedin_post_url = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [result.url, postId, req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Post publié sur LinkedIn avec succès',
      url: result.url
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Publier sur Facebook
router.post('/facebook', authenticateToken, async (req, res) => {
  try {
    const { content, postId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du post est requis'
      });
    }

    const result = await publishToFacebook(req.user.id, content);

    // Mettre à jour le post dans la base de données si un ID est fourni
    if (postId) {
      await db.run(
        `UPDATE posts
         SET published_to_facebook = 1,
             facebook_post_url = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [result.url, postId, req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Post publié sur Facebook avec succès',
      url: result.url
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Publier sur les deux plateformes
router.post('/both', authenticateToken, async (req, res) => {
  try {
    const { content, postId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du post est requis'
      });
    }

    const results = {
      linkedin: null,
      facebook: null
    };

    const errors = [];

    // Tenter LinkedIn
    try {
      results.linkedin = await publishToLinkedIn(req.user.id, content);

      if (postId) {
        await db.run(
          `UPDATE posts
           SET published_to_linkedin = 1,
               linkedin_post_url = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [results.linkedin.url, postId, req.user.id]
        );
      }
    } catch (error) {
      errors.push(`LinkedIn: ${error.message}`);
    }

    // Tenter Facebook
    try {
      results.facebook = await publishToFacebook(req.user.id, content);

      if (postId) {
        await db.run(
          `UPDATE posts
           SET published_to_facebook = 1,
               facebook_post_url = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [results.facebook.url, postId, req.user.id]
        );
      }
    } catch (error) {
      errors.push(`Facebook: ${error.message}`);
    }

    // Si les deux ont échoué
    if (errors.length === 2) {
      return res.status(400).json({
        success: false,
        message: 'Échec de la publication sur les deux plateformes',
        errors
      });
    }

    // Si au moins une a réussi
    res.json({
      success: true,
      message: errors.length === 0
        ? 'Post publié sur les deux plateformes avec succès'
        : 'Post publié partiellement',
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la publication'
    });
  }
});

module.exports = router;
