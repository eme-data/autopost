import React, { useState, useEffect } from 'react';
import { oauthAPI } from '../services/api';

const SocialAccountsManager = () => {
  const [accounts, setAccounts] = useState({
    linkedin: null,
    facebook: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConnectedAccounts();

    // Vérifier les paramètres d'URL pour les messages de succès/erreur
    const params = new URLSearchParams(window.location.search);

    if (params.get('linkedin_connected') === 'true') {
      setSuccess('Compte LinkedIn connecté avec succès !');
      window.history.replaceState({}, '', '/dashboard');
      loadConnectedAccounts();
    }

    if (params.get('facebook_connected') === 'true') {
      setSuccess('Compte Facebook connecté avec succès !');
      window.history.replaceState({}, '', '/dashboard');
      loadConnectedAccounts();
    }

    if (params.get('error')) {
      setError('Erreur lors de la connexion. Veuillez réessayer.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const loadConnectedAccounts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await oauthAPI.getConnectedAccounts();
      if (response.data.success) {
        setAccounts(response.data.accounts);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des comptes:', err);
      setError('Erreur lors du chargement des comptes connectés');
    } finally {
      setLoading(false);
    }
  };

  const connectLinkedIn = async () => {
    try {
      const response = await oauthAPI.getLinkedInAuthUrl();
      if (response.data.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      setError('Erreur lors de la connexion à LinkedIn');
    }
  };

  const connectFacebook = async () => {
    try {
      const response = await oauthAPI.getFacebookAuthUrl();
      if (response.data.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      setError('Erreur lors de la connexion à Facebook');
    }
  };

  const disconnectAccount = async (platform) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter votre compte ${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} ?`)) {
      return;
    }

    try {
      await oauthAPI.disconnectAccount(platform);
      setSuccess(`Compte ${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} déconnecté`);
      loadConnectedAccounts();
    } catch (err) {
      setError('Erreur lors de la déconnexion');
    }
  };

  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="spinner"></div>
        <p style={{ textAlign: 'center', color: '#718096' }}>
          Chargement des comptes...
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>
        Comptes de réseaux sociaux
      </h2>

      <p style={{ color: '#718096', marginBottom: '25px' }}>
        Connectez vos comptes pour publier automatiquement vos posts générés.
      </p>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginBottom: '20px' }}>
          {success}
        </div>
      )}

      <div className="grid grid-2" style={{ gap: '20px' }}>
        {/* LinkedIn */}
        <div style={{
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: accounts.linkedin ? '#f0fff4' : '#f7fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#0077b5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '15px',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              in
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#333' }}>LinkedIn</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#718096' }}>
                {accounts.linkedin ? 'Connecté' : 'Non connecté'}
              </p>
            </div>
          </div>

          {accounts.linkedin ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ fontSize: '14px', color: '#4a5568', margin: '5px 0' }}>
                  <strong>Compte :</strong> {accounts.linkedin.username}
                </p>
                <p style={{ fontSize: '14px', color: '#4a5568', margin: '5px 0' }}>
                  <strong>Expire le :</strong> {formatExpiryDate(accounts.linkedin.expiresAt)}
                </p>
                {!accounts.linkedin.isValid && (
                  <p style={{ fontSize: '14px', color: '#c53030', margin: '5px 0' }}>
                    ⚠️ Token expiré - Reconnectez-vous
                  </p>
                )}
              </div>

              <button
                onClick={() => disconnectAccount('linkedin')}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                Déconnecter
              </button>
            </>
          ) : (
            <button
              onClick={connectLinkedIn}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Connecter LinkedIn
            </button>
          )}
        </div>

        {/* Facebook */}
        <div style={{
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: accounts.facebook ? '#f0fff4' : '#f7fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#1877f2',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '15px',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              f
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#333' }}>Facebook</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#718096' }}>
                {accounts.facebook ? 'Connecté' : 'Non connecté'}
              </p>
            </div>
          </div>

          {accounts.facebook ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ fontSize: '14px', color: '#4a5568', margin: '5px 0' }}>
                  <strong>Compte :</strong> {accounts.facebook.username}
                </p>
                <p style={{ fontSize: '14px', color: '#4a5568', margin: '5px 0' }}>
                  <strong>Expire le :</strong> {formatExpiryDate(accounts.facebook.expiresAt)}
                </p>
                {!accounts.facebook.isValid && (
                  <p style={{ fontSize: '14px', color: '#c53030', margin: '5px 0' }}>
                    ⚠️ Token expiré - Reconnectez-vous
                  </p>
                )}
              </div>

              <button
                onClick={() => disconnectAccount('facebook')}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                Déconnecter
              </button>
            </>
          ) : (
            <button
              onClick={connectFacebook}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Connecter Facebook
            </button>
          )}
        </div>
      </div>

      <div style={{
        marginTop: '25px',
        padding: '15px',
        backgroundColor: '#edf2f7',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#4a5568'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>
          📌 Informations importantes :
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Les tokens d'accès expirent après une certaine période</li>
          <li>Vous devrez reconnecter vos comptes quand ils expirent</li>
          <li>Pour Facebook, vous devez gérer au moins une page pour publier</li>
          <li>Vos tokens sont stockés de manière sécurisée</li>
        </ul>
      </div>
    </div>
  );
};

export default SocialAccountsManager;
