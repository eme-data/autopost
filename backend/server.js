require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const oauthRoutes = require('./routes/oauth');
const publishRoutes = require('./routes/publish');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par IP
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});

app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/admin', adminRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API AutoPost opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 AutoPost API Server             ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}       ║
║  Status: ✓ Running                     ║
╚════════════════════════════════════════╝
  `);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT reçu, arrêt gracieux du serveur...');
  process.exit(0);
});
