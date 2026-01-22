import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getSettings();
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (err) {
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setEditingKey(setting.key);
    setEditingValue(setting.is_sensitive ? '' : setting.value || '');
    setSuccess('');
    setError('');
  };

  const handleSave = async (key) => {
    try {
      await adminAPI.updateSetting(key, editingValue);
      setSuccess('Configuration mise à jour avec succès');
      setEditingKey(null);
      loadSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  if (loading) {
    return (
      <div className="card">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        Configuration de l'application
      </h2>

      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: '#fff5f5',
        borderRadius: '8px',
        borderLeft: '4px solid #f56565',
        fontSize: '14px',
        color: '#c53030'
      }}>
        ⚠️ <strong>Attention:</strong> Les clés API sont stockées en base de données. Pour une sécurité maximale en production, utilisez des variables d'environnement (.env).
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {settings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          Aucune configuration trouvée. Les paramètres peuvent être ajoutés via la base de données.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {settings.map((setting) => (
            <div key={setting.id} style={{
              padding: '20px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              background: setting.is_sensitive ? '#fffaf0' : '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                    {setting.key}
                    {setting.is_sensitive && (
                      <span style={{ marginLeft: '10px', padding: '2px 8px', background: '#fed7d7', color: '#c53030', fontSize: '12px', borderRadius: '4px' }}>
                        Sensible
                      </span>
                    )}
                  </div>
                  {setting.description && (
                    <div style={{ fontSize: '14px', color: '#718096' }}>
                      {setting.description}
                    </div>
                  )}
                  {setting.category && (
                    <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                      Catégorie: {setting.category}
                    </div>
                  )}
                </div>
              </div>

              {editingKey === setting.key ? (
                <div>
                  <input
                    type={setting.is_sensitive ? 'password' : 'text'}
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    placeholder={setting.is_sensitive ? 'Entrez la nouvelle valeur...' : 'Valeur...'}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #667eea',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleSave(setting.key)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    fontFamily: 'monospace',
                    padding: '8px 12px',
                    background: '#f7fafc',
                    borderRadius: '4px',
                    color: '#4a5568',
                    flex: 1,
                    marginRight: '15px'
                  }}>
                    {setting.value || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>Non défini</span>}
                  </div>
                  <button
                    onClick={() => handleEdit(setting)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Modifier
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: '#edf2f7',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#4a5568'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>
          📌 Notes importantes :
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Les variables d'environnement dans .env ont la priorité sur ces paramètres</li>
          <li>Les valeurs sensibles (clés API) sont masquées par défaut</li>
          <li>Redémarrez le serveur après modification des clés API</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSettings;
