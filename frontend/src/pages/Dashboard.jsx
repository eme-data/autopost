import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Generator from '../components/Generator';
import History from '../components/History';
import SocialAccountsManager from '../components/SocialAccountsManager';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generator');
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePostGenerated = () => {
    setRefreshHistory(prev => prev + 1);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">AutoPost AI</div>
          <div className="navbar-user">
            {user?.role === 'admin' && (
              <span style={{ color: '#c53030', fontWeight: 'bold', marginRight: '10px' }}>
                👑 ADMIN
              </span>
            )}
            <span>
              {user?.firstname} {user?.lastname}
            </span>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="btn btn-primary">
                Administration
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-secondary">
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ color: 'white', marginBottom: '10px' }}>
            Générateur de Posts IA
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Créez des posts engageants pour LinkedIn et Facebook avec Claude et Gemini
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
            className={`btn ${activeTab === 'generator' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('generator')}
          >
            Générateur
          </button>
          <button
            className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('accounts')}
          >
            Comptes sociaux
          </button>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            Historique
          </button>
        </div>

        {/* Content */}
        {activeTab === 'generator' && (
          <Generator onPostGenerated={handlePostGenerated} />
        )}

        {activeTab === 'accounts' && (
          <SocialAccountsManager />
        )}

        {activeTab === 'history' && (
          <History refresh={refreshHistory} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
