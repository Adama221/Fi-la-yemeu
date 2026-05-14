import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

export async function initDb() {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } catch (err) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT', err);
      }
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT is not set. If you are not in a controlled environment, firebase operations will fail.');
      // Initialize with default credentials
      admin.initializeApp();
    }
  }

  const db = admin.firestore();

  // Create default admin users if they don't exist
  const adminPassword = process.env.ADMIN_PASSWORD || 'Pape221';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  
  const admins = [
    { email: process.env.ADMIN_EMAIL || 'papesamabutik@gmail.com', username: 'Pape' },
    { email: 'pape@samabutik.com', username: 'PapeAdmin' },
    { email: '78177233ds@gmail.com', username: '78177233ds' }
  ];
  
  for (const adminUser of admins) {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', adminUser.email).get();
    
    if (snapshot.empty) {
      await usersRef.add({
        username: adminUser.username,
        email: adminUser.email,
        password: hashedAdminPassword,
        role: 'admin',
        is_staff: true,
        is_superuser: true
      });
    }
  }

  // Init payment config
  const paymentConfigRef = db.collection('settings').doc('payment_configs');
  const paymentConfigSnap = await paymentConfigRef.get();
  if (!paymentConfigSnap.exists) {
    await paymentConfigRef.set({ wave_link: '', orange_link: '' });
  }

  // Init site settings
  const siteSettingsRef = db.collection('settings').doc('config');
  const siteSettingsSnap = await siteSettingsRef.get();
  if (!siteSettingsSnap.exists) {
    await siteSettingsRef.set({
      logo: '',
      cover: '',
      description: 'Bienvenue',
      primary_color: '#8B4513',
      font: 'Poppins',
      secondary_color: '#D4A373',
      homepage_text: 'Bienvenue'
    });
  }

  // Create initial products if products collection is empty
  const productsRef = db.collection('products');
  const prodSnapshot = await productsRef.limit(1).get();
  
  if (prodSnapshot.empty) {
    const initialProducts = [
      { name: 'Robe Éclat', price: 120000, description: 'Une robe élégante de soirée en soie', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80', category: 'Femme', commission: 10, stock: 15 },
      { name: 'Costume Minuit', price: 250000, description: 'Costume trois pièces sur-mesure', image: 'https://images.unsplash.com/photo-1593030761756-1d8dd2a7e8bf?auto=format&fit=crop&q=80', category: 'Homme', commission: 15, stock: 5 },
      { name: 'Sac Signature Noir', price: 85000, description: 'Sac à main en cuir véritable avec finitions dorées', image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80', category: 'Accessoires', commission: 10, stock: 8 },
      { name: "Veste d'Automne", price: 145000, description: 'Veste légère et résistante pour la saison', image: 'https://plus.unsplash.com/premium_photo-1673356301535-224a0efcbdfc?auto=format&fit=crop&q=80', category: 'Femme', commission: 12, stock: 10 }
    ];
    for (const p of initialProducts) {
      await productsRef.add(p);
    }
  }

  return db;
}
