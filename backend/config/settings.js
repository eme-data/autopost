const db = require('./database');

class SettingsManager {
  constructor() {
    this.cache = new Map();
    this.lastLoad = null;
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Récupère une valeur de configuration
   * Priorité : Base de données > Variables d'environnement > Valeur par défaut
   */
  async get(key, defaultValue = null) {
    try {
      // Vérifier le cache
      if (this.cache.has(key) && this.isCacheValid()) {
        return this.cache.get(key);
      }

      // Essayer de charger depuis la base de données
      const setting = await db.get('SELECT value FROM settings WHERE key = ?', [key]);

      if (setting && setting.value !== null && setting.value !== '') {
        this.cache.set(key, setting.value);
        return setting.value;
      }

      // Fallback sur les variables d'environnement
      const envValue = process.env[key];
      if (envValue !== undefined && envValue !== '') {
        return envValue;
      }

      // Retourner la valeur par défaut
      return defaultValue;
    } catch (error) {
      console.error(`Erreur lors de la récupération du paramètre ${key}:`, error);
      // En cas d'erreur, fallback sur .env
      return process.env[key] || defaultValue;
    }
  }

  /**
   * Récupère toutes les valeurs de configuration
   */
  async getAll() {
    try {
      const settings = await db.all('SELECT key, value FROM settings');
      const config = {};

      for (const setting of settings) {
        config[setting.key] = setting.value || process.env[setting.key] || '';
      }

      return config;
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      return {};
    }
  }

  /**
   * Définit une valeur de configuration
   */
  async set(key, value, updatedBy = null) {
    try {
      const existing = await db.get('SELECT id FROM settings WHERE key = ?', [key]);

      if (existing) {
        await db.run(
          'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE key = ?',
          [value, updatedBy, key]
        );
      } else {
        await db.run(
          'INSERT INTO settings (key, value, updated_by) VALUES (?, ?, ?)',
          [key, value, updatedBy]
        );
      }

      // Invalider le cache
      this.cache.delete(key);
      this.lastLoad = null;

      return true;
    } catch (error) {
      console.error(`Erreur lors de la définition du paramètre ${key}:`, error);
      return false;
    }
  }

  /**
   * Vérifier si le cache est valide
   */
  isCacheValid() {
    if (!this.lastLoad) return false;
    return (Date.now() - this.lastLoad) < this.CACHE_TTL;
  }

  /**
   * Invalider le cache
   */
  clearCache() {
    this.cache.clear();
    this.lastLoad = null;
  }

  /**
   * Recharger tous les paramètres
   */
  async reload() {
    this.clearCache();
    await this.getAll();
    this.lastLoad = Date.now();
  }
}

module.exports = new SettingsManager();
