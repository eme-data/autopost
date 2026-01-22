import React, { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';

const History = ({ refresh }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, [refresh]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await postsAPI.getHistory({ limit: 50 });
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      return;
    }

    try {
      await postsAPI.deletePost(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    alert('Post copié dans le presse-papier !');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="spinner"></div>
        <p style={{ textAlign: 'center', color: '#718096' }}>
          Chargement de l'historique...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
          Aucun post généré pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '25px', color: '#333' }}>
        Historique des posts ({posts.length})
      </h2>

      <div>
        {posts.map((post) => (
          <div key={post.id} className="history-item">
            <div className="history-header">
              <div>
                <strong style={{ color: '#333' }}>{post.topic}</strong>
                <div className="history-meta">
                  {post.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} • {' '}
                  {post.aiModel === 'claude' ? 'Claude' : 'Gemini'} • {' '}
                  {formatDate(post.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => copyToClipboard(post.content)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Copier
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="history-content">
              {post.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
