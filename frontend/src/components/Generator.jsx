import React, { useState } from 'react';
import { postsAPI } from '../services/api';

const Generator = ({ onPostGenerated }) => {
  const [formData, setFormData] = useState({
    topic: '',
    platform: 'linkedin',
    aiModel: 'claude',
    tone: 'professional',
    length: 'medium',
    includeHashtags: true,
    includeEmojis: false
  });

  const [generatedPost, setGeneratedPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    setGeneratedPost('');

    try {
      const response = await postsAPI.generate(formData);

      if (response.data.success) {
        setGeneratedPost(response.data.post.content);
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
    setFormData({
      topic: '',
      platform: 'linkedin',
      aiModel: 'claude',
      tone: 'professional',
      length: 'medium',
      includeHashtags: true,
      includeEmojis: false
    });
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
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google)</option>
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
            Génération en cours avec {formData.aiModel === 'claude' ? 'Claude' : 'Gemini'}...
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
          <div className="post-actions">
            <button onClick={copyToClipboard} className="btn btn-primary">
              Copier
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Nouveau post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generator;
