import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminUsers from '../components/admin/AdminUsers';
import AdminSettings from '../components/admin/AdminSettings';
import AdminLogs from '../components/admin/AdminLogs';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Vérifier les droits admin
  if (user?.role !== 'admin') {
    return (
      <div className="container" style={{ marginTop: '100px', textAlign: 'center' }}>
        <div className="card">
          <h1 style={{ color: '#c53030', marginBottom: '20px' }}>Accès refusé</h1>
          <p style={{ color: '#718096', marginBottom: '20px' }}>
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            AutoPost Admin
          </div>
          <div className="navbar-user">
            <span style={{ color: '#c53030', fontWeight: 'bold', marginRight: '10px' }}>
              👑 ADMIN
            </span>
            <span>
              {user?.firstname} {user?.lastname}
            </span>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Dashboard Utilisateur
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', marginBottom: '10px' }}>
            Panneau d'Administration
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Gestion complète de l'application AutoPost
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Statistiques
          </button>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Utilisateurs
          </button>
          <button
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Configuration
          </button>
          <button
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Logs d'audit
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'settings' && <AdminSettings />}
        {activeTab === 'logs' && <AdminLogs />}
      </div>
    </div>
  );
};

export default AdminPanel;
