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

  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Données du formulaire de création
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    role: 'user'
  });

  // Utilisateur en cours d'édition
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await adminAPI.createUser(newUser);
      setSuccess('Utilisateur créé avec succès');
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', firstname: '', lastname: '', role: 'user' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await adminAPI.updateUser(editingUser.id, {
        email: editingUser.email,
        firstname: editingUser.firstname,
        lastname: editingUser.lastname
      });
      setSuccess('Utilisateur modifié avec succès');
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await adminAPI.resetPassword(editingUser.id, newPassword);
      setSuccess('Mot de passe réinitialisé avec succès');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const openEditModal = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        Gestion des utilisateurs
      </h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Barre d'action */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher par email ou nom..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          ➕ Créer un utilisateur
        </button>
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(user)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          ✏️ Éditer
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
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

      {/* Modal de création d'utilisateur */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Créer un nouvel utilisateur</h3>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="utilisateur@example.com"
                />
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Au moins 6 caractères"
                />
              </div>

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  required
                  value={newUser.firstname}
                  onChange={(e) => setNewUser({ ...newUser, firstname: e.target.value })}
                  placeholder="Jean"
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  required
                  value={newUser.lastname}
                  onChange={(e) => setNewUser({ ...newUser, lastname: e.target.value })}
                  placeholder="Dupont"
                />
              </div>

              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Créer l'utilisateur
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUser({ email: '', password: '', firstname: '', lastname: '', role: 'user' });
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition d'utilisateur */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Modifier l'utilisateur</h3>

            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  required
                  value={editingUser.firstname}
                  onChange={(e) => setEditingUser({ ...editingUser, firstname: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  required
                  value={editingUser.lastname}
                  onChange={(e) => setEditingUser({ ...editingUser, lastname: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordModal(true);
                  }}
                >
                  🔑 Réinitialiser mot de passe
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de réinitialisation de mot de passe */}
      {showPasswordModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Réinitialiser le mot de passe</h3>
            <p style={{ color: '#718096', marginBottom: '20px' }}>
              Utilisateur: <strong>{editingUser.firstname} {editingUser.lastname}</strong>
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Réinitialiser
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
