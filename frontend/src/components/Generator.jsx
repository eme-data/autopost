import React, { useState, useEffect } from 'react';
import { postsAPI, oauthAPI, publishAPI } from '../services/api';

const Generator = ({ onPostGenerated }) => {
  const [formData, setFormData] = useState({
    topic: '',
    platform: 'linkedin',
    aiModel: 'gemini',
    tone: 'professional',
    length: 'medium',
    includeHashtags: true,
    includeEmojis: false
  });

  const [generatedPost, setGeneratedPost] = useState('');
  const [generatedPostId, setGeneratedPostId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState('');
  const [connectedAccounts, setConnectedAccounts] = useState({
    linkedin: null,
    facebook: null
  });

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const response = await oauthAPI.getConnectedAccounts();
      if (response.data.success) {
        setConnectedAccounts(response.data.accounts);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des comptes:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setPublishSuccess('');
    setLoading(true);
    setGeneratedPost('');
    setGeneratedPostId(null);

    try {
      const response = await postsAPI.generate(formData);

      if (response.data.success) {
        setGeneratedPost(response.data.post.content);
        setGeneratedPostId(response.data.post.id);
        if (onPostGenerated) {
          onPostGenerated();
        }
      } else {
        setError(response.data.message || 'Erreur lors de la génération');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la génération du post');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    alert('Post copié dans le presse-papier !');
  };

  const handleReset = () => {
    setGeneratedPost('');
    setGeneratedPostId(null);
    setPublishSuccess('');
    setFormData({
      topic: '',
      platform: 'linkedin',
      aiModel: 'gemini',
      tone: 'professional',
      length: 'medium',
      includeHashtags: true,
      includeEmojis: false
    });
  };

  const handlePublishLinkedIn = async () => {
    if (!connectedAccounts.linkedin?.isValid) {
      setError('Compte LinkedIn non connecté ou expiré. Connectez votre compte dans la section "Comptes de réseaux sociaux".');
      return;
    }

    setPublishing(true);
    setError('');
    setPublishSuccess('');

    try {
      const response = await publishAPI.publishToLinkedIn({
        content: generatedPost,
        postId: generatedPostId
      });

      if (response.data.success) {
        setPublishSuccess(`Post publié sur LinkedIn avec succès ! Voir: ${response.data.url}`);
        if (onPostGenerated) {
          onPostGenerated();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la publication sur LinkedIn');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishFacebook = async () => {
    if (!connectedAccounts.facebook?.isValid) {
      setError('Compte Facebook non connecté ou expiré. Connectez votre compte dans la section "Comptes de réseaux sociaux".');
      return;
    }

    setPublishing(true);
    setError('');
    setPublishSuccess('');

    try {
      const response = await publishAPI.publishToFacebook({
        content: generatedPost,
        postId: generatedPostId
      });

      if (response.data.success) {
        setPublishSuccess(`Post publié sur Facebook avec succès ! Voir: ${response.data.url}`);
        if (onPostGenerated) {
          onPostGenerated();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la publication sur Facebook');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishBoth = async () => {
    const hasLinkedIn = connectedAccounts.linkedin?.isValid;
    const hasFacebook = connectedAccounts.facebook?.isValid;

    if (!hasLinkedIn && !hasFacebook) {
      setError('Aucun compte connecté. Connectez vos comptes dans la section "Comptes de réseaux sociaux".');
      return;
    }

    setPublishing(true);
    setError('');
    setPublishSuccess('');

    try {
      const response = await publishAPI.publishToBoth({
        content: generatedPost,
        postId: generatedPostId
      });

      if (response.data.success) {
        let message = response.data.message;
        if (response.data.errors && response.data.errors.length > 0) {
          message += '\nErreurs: ' + response.data.errors.join(', ');
        }
        setPublishSuccess(message);
        if (onPostGenerated) {
          onPostGenerated();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '25px', color: '#333' }}>
        Nouveau Post
      </h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleGenerate}>
        <div className="form-group">
          <label htmlFor="topic">Sujet du post *</label>
          <textarea
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
            placeholder="Décrivez le sujet de votre post..."
            rows="3"
          />
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label htmlFor="platform">Plateforme</label>
            <select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleChange}
            >
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="aiModel">Modèle IA</label>
            <select
              id="aiModel"
              name="aiModel"
              value={formData.aiModel}
              onChange={handleChange}
            >
              <option value="gemini">Gemini (Google) - Gratuit</option>
              <option value="groq">Groq (Llama 3.3) - Ultra-rapide</option>
            </select>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label htmlFor="tone">Ton</label>
            <select
              id="tone"
              name="tone"
              value={formData.tone}
              onChange={handleChange}
            >
              <option value="professional">Professionnel</option>
              <option value="casual">Décontracté</option>
              <option value="enthusiastic">Enthousiaste</option>
              <option value="informative">Informatif</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="length">Longueur</label>
            <select
              id="length"
              name="length"
              value={formData.length}
              onChange={handleChange}
            >
              <option value="short">Court (100-150 mots)</option>
              <option value="medium">Moyen (150-250 mots)</option>
              <option value="long">Long (250-400 mots)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="includeHashtags"
              name="includeHashtags"
              checked={formData.includeHashtags}
              onChange={handleChange}
            />
            <label htmlFor="includeHashtags">Inclure des hashtags</label>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="includeEmojis"
              name="includeEmojis"
              checked={formData.includeEmojis}
              onChange={handleChange}
            />
            <label htmlFor="includeEmojis">Inclure des emojis</label>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          {loading ? 'Génération en cours...' : 'Générer le post'}
        </button>
      </form>

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#718096', marginTop: '10px' }}>
            Génération en cours avec {formData.aiModel === 'gemini' ? 'Gemini' : 'Groq'}...
          </p>
        </div>
      )}

      {generatedPost && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>
            Post généré
          </h3>
          <div className="post-preview">
            {generatedPost}
          </div>

          {publishSuccess && (
            <div className="success-message" style={{ marginTop: '15px' }}>
              {publishSuccess}
            </div>
          )}

          <div className="post-actions" style={{ marginTop: '15px' }}>
            <button onClick={copyToClipboard} className="btn btn-secondary">
              Copier
            </button>

            <button
              onClick={handlePublishLinkedIn}
              className="btn btn-primary"
              disabled={publishing || !connectedAccounts.linkedin?.isValid}
              title={!connectedAccounts.linkedin?.isValid ? 'Connectez votre compte LinkedIn' : 'Publier sur LinkedIn'}
            >
              {publishing ? 'Publication...' : 'Publier sur LinkedIn'}
            </button>

            <button
              onClick={handlePublishFacebook}
              className="btn btn-primary"
              disabled={publishing || !connectedAccounts.facebook?.isValid}
              title={!connectedAccounts.facebook?.isValid ? 'Connectez votre compte Facebook' : 'Publier sur Facebook'}
            >
              {publishing ? 'Publication...' : 'Publier sur Facebook'}
            </button>

            <button
              onClick={handlePublishBoth}
              className="btn btn-primary"
              disabled={publishing || (!connectedAccounts.linkedin?.isValid && !connectedAccounts.facebook?.isValid)}
              title={(!connectedAccounts.linkedin?.isValid && !connectedAccounts.facebook?.isValid) ? 'Connectez au moins un compte' : 'Publier sur les deux'}
              style={{ background: 'linear-gradient(135deg, #0077b5 0%, #1877f2 100%)' }}
            >
              {publishing ? 'Publication...' : 'Publier sur les deux'}
            </button>

            <button onClick={handleReset} className="btn btn-secondary">
              Nouveau post
            </button>
          </div>

          {(!connectedAccounts.linkedin?.isValid && !connectedAccounts.facebook?.isValid) && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#fff5f5',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#c53030',
              borderLeft: '4px solid #f56565'
            }}>
              ⚠️ Connectez vos comptes LinkedIn et/ou Facebook dans la section "Comptes de réseaux sociaux" pour publier automatiquement.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Generator;
