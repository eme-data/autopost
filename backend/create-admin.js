require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const firstname = process.argv[4] || 'Admin';
  const lastname = process.argv[5] || 'User';

  if (!email || !password) {
    console.error('\n❌ Usage: node create-admin.js <email> <password> [firstname] [lastname]\n');
    console.error('Exemple: node create-admin.js admin@example.com SecurePass123 Admin Système\n');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\n❌ Le mot de passe doit contenir au moins 6 caractères\n');
    process.exit(1);
  }

  try {
    // Vérifier si l'email existe déjà
    const existing = await db.get('SELECT id, role FROM users WHERE email = ?', [email]);

    if (existing) {
      if (existing.role === 'admin') {
        console.log('\n⚠️  Cet utilisateur est déjà administrateur\n');
        process.exit(0);
      }

      console.log('📝 Utilisateur existant trouvé. Mise à jour en admin...');
      await db.run('UPDATE users SET role = ? WHERE email = ?', ['admin', email]);
      console.log('✅ Utilisateur mis à jour en admin avec succès!\n');
    } else {
      console.log('🔐 Création du nouveau compte administrateur...');
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.run(
        'INSERT INTO users (email, password, firstname, lastname, role) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, firstname, lastname, 'admin']
      );

      console.log('✅ Compte admin créé avec succès!\n');
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║     👑 COMPTE ADMINISTRATEUR           ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  Email: ${email.padEnd(30)} ║`);
    console.log(`║  Nom: ${(firstname + ' ' + lastname).padEnd(32)} ║`);
    console.log(`║  Rôle: Admin${' '.repeat(28)} ║`);
    console.log('╚════════════════════════════════════════╝\n');

    console.log('🌐 Vous pouvez maintenant vous connecter avec ces identifiants.');
    console.log('📍 URL: http://localhost:3000/login (ou votre domaine en production)\n');

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
