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

  const handleReload = () => {
    setSuccess('');
    setError('');
    loadSettings();
  };

  // Grouper les paramètres par catégorie
  const settingsByCategory = settings.reduce((acc, setting) => {
    const category = setting.category || 'Autres';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {});

  const categories = Object.keys(settingsByCategory).sort();

  if (loading) {
    return (
      <div className="card">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>
          Configuration de l'application
        </h2>
        <button onClick={handleReload} className="btn btn-secondary">
          🔄 Recharger
        </button>
      </div>

      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: '#e6fffa',
        borderRadius: '8px',
        borderLeft: '4px solid #38b2ac',
        fontSize: '14px',
        color: '#234e52'
      }}>
        💡 <strong>Astuce:</strong> Vous pouvez gérer toutes vos clés API et identifiants OAuth directement depuis cette interface. Les modifications sont immédiates (un redémarrage peut être nécessaire pour certains paramètres).
      </div>

      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: '#fff5f5',
        borderRadius: '8px',
        borderLeft: '4px solid #f56565',
        fontSize: '14px',
        color: '#c53030'
      }}>
        ⚠️ <strong>Sécurité:</strong> Les variables d'environnement (.env) ont toujours la priorité sur ces paramètres. En production, privilégiez le fichier .env pour les données sensibles.
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {settings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚙️</div>
          <h3 style={{ color: '#4a5568', marginBottom: '15px' }}>Aucun paramètre configuré</h3>
          <p style={{ color: '#718096', marginBottom: '20px' }}>
            Initialisez les paramètres de configuration en exécutant :
          </p>
          <div style={{
            fontFamily: 'monospace',
            background: '#2d3748',
            color: '#68d391',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            cd backend && node init-settings.js
          </div>
          <p style={{ fontSize: '14px', color: '#a0aec0' }}>
            Cette commande importera vos variables d'environnement actuelles dans la base de données.
          </p>
        </div>
      ) : (
        <div>
          {categories.map((categoryName) => (
            <div key={categoryName} style={{ marginBottom: '30px' }}>
              <h3 style={{
                color: '#4a5568',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '2px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}></span>
                {categoryName}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {settingsByCategory[categoryName].map((setting) => (
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
              </div>
            ))}
          </div>
        )}

      {settings.length > 0 && (
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
            <li>Les variables d'environnement .env ont toujours la priorité</li>
            <li>Les valeurs sensibles (API keys, secrets) sont masquées</li>
            <li>Un redémarrage du serveur peut être nécessaire pour appliquer certaines modifications</li>
            <li>Pour initialiser/réinitialiser : <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>node backend/init-settings.js</code></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
