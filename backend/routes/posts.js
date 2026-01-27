const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/genai');
const Groq = require('groq-sdk');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Initialiser les clients AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Validation des paramètres de génération
const generateValidation = [
  body('topic').trim().notEmpty().withMessage('Le sujet est requis'),
  body('platform').isIn(['linkedin', 'facebook']).withMessage('Plateforme invalide'),
  body('aiModel').isIn(['gemini', 'groq']).withMessage('Modèle IA invalide'),
  body('tone').optional().isIn(['professional', 'casual', 'enthusiastic', 'informative']),
  body('length').optional().isIn(['short', 'medium', 'long']),
  body('includeHashtags').optional().isBoolean(),
  body('includeEmojis').optional().isBoolean()
];

// Fonction pour générer un prompt selon la plateforme
function buildPrompt(params) {
  const { topic, platform, tone = 'professional', length = 'medium', includeHashtags = true, includeEmojis = false } = params;

  const lengthGuide = {
    short: '100-150 mots',
    medium: '150-250 mots',
    long: '250-400 mots'
  };

  const toneGuide = {
    professional: 'un ton professionnel et formel',
    casual: 'un ton décontracté et amical',
    enthusiastic: 'un ton enthousiaste et énergique',
    informative: 'un ton informatif et éducatif'
  };

  const platformGuide = {
    linkedin: 'LinkedIn (réseau professionnel)',
    facebook: 'Facebook (réseau social grand public)'
  };

  let prompt = `Génère un post engageant pour ${platformGuide[platform]} sur le sujet suivant : "${topic}".\n\n`;
  prompt += `Instructions :\n`;
  prompt += `- Utilise ${toneGuide[tone]}\n`;
  prompt += `- Longueur cible : ${lengthGuide[length]}\n`;
  prompt += `- ${includeHashtags ? 'Inclus des hashtags pertinents à la fin' : 'N\'inclus pas de hashtags'}\n`;
  prompt += `- ${includeEmojis ? 'Utilise quelques emojis appropriés' : 'N\'utilise pas d\'emojis'}\n`;

  if (platform === 'linkedin') {
    prompt += `- Adopte un style adapté au monde professionnel\n`;
    prompt += `- Mets en avant la valeur ajoutée et les insights\n`;
  } else {
    prompt += `- Adopte un style convivial et accessible\n`;
    prompt += `- Favorise l'engagement et les interactions\n`;
  }

  prompt += `\nGénère uniquement le contenu du post, sans introduction ni métadonnées.`;

  return prompt;
}

// Fonction pour générer avec Gemini
async function generateWithGemini(prompt) {
  try {
    // Utiliser gemini-2.5-flash - modèle 2026 rapide et performant
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erreur Gemini:', error);
    throw new Error('Erreur lors de la génération avec Gemini');
  }
}

// Fonction pour générer avec Groq
async function generateWithGroq(prompt) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Erreur Groq:', error);
    throw new Error('Erreur lors de la génération avec Groq');
  }
}

// Route de génération de post
router.post('/generate', authMiddleware, generateValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { topic, platform, aiModel, tone, length, includeHashtags, includeEmojis } = req.body;

    // Construire le prompt
    const prompt = buildPrompt({
      topic,
      platform,
      tone,
      length,
      includeHashtags,
      includeEmojis
    });

    // Générer le contenu selon le modèle choisi
    let content;
    if (aiModel === 'gemini') {
      content = await generateWithGemini(prompt);
    } else if (aiModel === 'groq') {
      content = await generateWithGroq(prompt);
    } else {
      throw new Error('Modèle IA non supporté');
    }

    // Sauvegarder le post dans la base de données
    const result = await db.run(
      `INSERT INTO posts (user_id, platform, ai_model, topic, content, tone, length, include_hashtags, include_emojis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        platform,
        aiModel,
        topic,
        content,
        tone || 'professional',
        length || 'medium',
        includeHashtags ? 1 : 0,
        includeEmojis ? 1 : 0
      ]
    );

    res.json({
      success: true,
      post: {
        id: result.id,
        content,
        platform,
        aiModel,
        topic
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la génération du post'
    });
  }
});

// Route pour récupérer l'historique des posts de l'utilisateur
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const posts = await db.all(
      `SELECT id, platform, ai_model as aiModel, topic, content,
              tone, length, include_hashtags as includeHashtags,
              include_emojis as includeEmojis, created_at as createdAt
       FROM posts
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const total = await db.get(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      posts,
      pagination: {
        total: total.count,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// Route pour supprimer un post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;

    // Vérifier que le post appartient à l'utilisateur
    const post = await db.get(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?',
      [postId, req.user.id]
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Supprimer le post
    await db.run('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({
      success: true,
      message: 'Post supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du post'
    });
  }
});

module.exports = router;
