import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getAuditLogs({ page });
      if (response.data.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return '#c53030';
    if (action.includes('UPDATE')) return '#d69e2e';
    if (action.includes('CREATE') || action.includes('ACTIVATE')) return '#38a169';
    return '#4299e1';
  };

  const formatAction = (action) => {
    const actions = {
      'UPDATE_ROLE': 'Modification de rôle',
      'ACTIVATE_USER': 'Activation utilisateur',
      'DEACTIVATE_USER': 'Désactivation utilisateur',
      'DELETE_USER': 'Suppression utilisateur',
      'UPDATE_SETTING': 'Modification paramètre',
      'CREATE_POST': 'Création post',
      'DELETE_POST': 'Suppression post'
    };
    return actions[action] || action;
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
        Logs d'audit
      </h2>

      <p style={{ color: '#718096', marginBottom: '20px' }}>
        Historique des actions administratives effectuées sur la plateforme.
      </p>

      {error && <div className="error-message">{error}</div>}

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          Aucun log d'audit disponible
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map((log) => (
              <div key={log.id} style={{
                padding: '15px',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${getActionColor(log.action)}`,
                borderRadius: '6px',
                background: '#f7fafc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{
                      padding: '4px 8px',
                      background: getActionColor(log.action),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {formatAction(log.action)}
                    </span>
                    <span style={{ marginLeft: '10px', fontSize: '14px', color: '#718096' }}>
                      par {log.user_email ? `${log.firstname} ${log.lastname}` : 'Système'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>

                {log.resource && (
                  <div style={{ fontSize: '14px', color: '#4a5568', marginBottom: '4px' }}>
                    <strong>Ressource:</strong> {log.resource}
                    {log.resource_id && ` #${log.resource_id}`}
                  </div>
                )}

                {log.details && (
                  <div style={{ fontSize: '13px', color: '#718096', fontFamily: 'monospace', marginTop: '8px', padding: '8px', background: '#ffffff', borderRadius: '4px' }}>
                    {log.details}
                  </div>
                )}

                {log.ip_address && (
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                    IP: {log.ip_address}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Précédent
              </button>
              <span style={{ padding: '10px', color: '#4a5568' }}>
                Page {page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="btn btn-secondary"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLogs;
