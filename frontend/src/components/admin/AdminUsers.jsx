import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.getUsers({ page, search });
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Voulez-vous vraiment changer le rôle de cet utilisateur en ${newRole} ?`)) {
      return;
    }

    try {
      await adminAPI.updateUserRole(userId, newRole);
      setSuccess('Rôle modifié avec succès');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du rôle');
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      await adminAPI.updateUserStatus(userId, isActive);
      setSuccess(`Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du statut');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      setSuccess('Utilisateur supprimé avec succès');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        Gestion des utilisateurs
      </h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Recherche */}
      <div className="form-group">
        <input
          type="text"
          placeholder="Rechercher par email ou nom..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Utilisateur</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Rôle</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Posts</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {user.firstname} {user.lastname}
                      </div>
                      <div style={{ fontSize: '14px', color: '#718096' }}>
                        {user.email}
                      </div>
                      <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                        Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '2px solid #e2e8f0',
                          background: user.role === 'admin' ? '#fed7d7' : '#e6fffa',
                          color: user.role === 'admin' ? '#c53030' : '#00796b',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#667eea' }}>
                      {user.post_count}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleStatusChange(user.id, !user.is_active)}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '14px',
                          background: user.is_active ? '#48bb78' : '#fc8181',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default AdminUsers;
