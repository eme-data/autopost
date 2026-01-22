import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verify: () => api.get('/auth/verify')
};

export const postsAPI = {
  generate: (data) => api.post('/posts/generate', data),
  getHistory: (params) => api.get('/posts/history', { params }),
  deletePost: (id) => api.delete(`/posts/${id}`)
};

export const oauthAPI = {
  getLinkedInAuthUrl: () => api.get('/oauth/linkedin/auth-url'),
  getFacebookAuthUrl: () => api.get('/oauth/facebook/auth-url'),
  getConnectedAccounts: () => api.get('/oauth/connected-accounts'),
  disconnectAccount: (platform) => api.delete(`/oauth/disconnect/${platform}`)
};

export const publishAPI = {
  publishToLinkedIn: (data) => api.post('/publish/linkedin', data),
  publishToFacebook: (data) => api.post('/publish/facebook', data),
  publishToBoth: (data) => api.post('/publish/both', data)
};

export default api;
