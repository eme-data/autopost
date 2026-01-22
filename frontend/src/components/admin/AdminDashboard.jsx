import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="spinner"></div>
        <p style={{ textAlign: 'center', color: '#718096' }}>
          Chargement des statistiques...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-message">{error}</div>
        <button onClick={loadStats} className="btn btn-primary">
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      {/* Cartes de statistiques principales */}
      <div className="grid grid-2" style={{ marginBottom: '30px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Utilisateurs</h3>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.users.total}</div>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Total des comptes</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Posts générés</h3>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.posts.total}</div>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
            {stats.posts.published} publiés • {stats.posts.notPublished} brouillons
          </p>
        </div>
      </div>

      {/* Posts par plateforme */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          Posts par plateforme
        </h2>
        <div className="grid grid-2">
          {stats.posts.byPlatform.map((item) => (
            <div key={item.platform} style={{
              padding: '15px',
              background: '#f7fafc',
              borderRadius: '8px',
              borderLeft: '4px solid #667eea'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                {item.count}
              </div>
              <div style={{ color: '#718096', marginTop: '5px' }}>
                {item.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts par modèle IA */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          Posts par modèle IA
        </h2>
        <div className="grid grid-2">
          {stats.posts.byAI.map((item) => (
            <div key={item.ai_model} style={{
              padding: '15px',
              background: '#f7fafc',
              borderRadius: '8px',
              borderLeft: '4px solid #764ba2'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                {item.count}
              </div>
              <div style={{ color: '#718096', marginTop: '5px' }}>
                {item.ai_model === 'claude' ? 'Claude (Anthropic)' : 'Gemini (Google)'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comptes sociaux */}
      {stats.socialAccounts.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>
            Comptes sociaux connectés
          </h2>
          <div className="grid grid-2">
            {stats.socialAccounts.map((item) => (
              <div key={item.platform} style={{
                padding: '15px',
                background: '#f7fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #48bb78'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                  {item.count}
                </div>
                <div style={{ color: '#718096', marginTop: '5px' }}>
                  {item.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilisateurs les plus actifs */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          Utilisateurs les plus actifs
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Utilisateur</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Posts</th>
              </tr>
            </thead>
            <tbody>
              {stats.users.topUsers.slice(0, 5).map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>
                    {user.firstname} {user.lastname}
                  </td>
                  <td style={{ padding: '12px', color: '#718096' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#667eea' }}>
                    {user.post_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activité récente */}
      {stats.posts.recent.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>
            Posts créés (7 derniers jours)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.posts.recent.map((item) => (
              <div key={item.date} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 15px',
                background: '#f7fafc',
                borderRadius: '6px'
              }}>
                <span style={{ color: '#4a5568' }}>
                  {new Date(item.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                  {item.count} posts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
