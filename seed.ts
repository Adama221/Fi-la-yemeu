import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');
async function run() {
  await pb.collection('_superusers').authWithPassword('admin@admin.com', 'password123');
  try {
    const products = await pb.collection('products').getFullList();
    if (products.length === 0) {
      await pb.collection('products').create({ name: 'Robe Sérère', price: 45000, description: 'Robe élégante aux motifs traditionnels, parfaite pour les grandes occasions.', category: 'Femme', image: 'https://images.unsplash.com/photo-1620755100705-d1297e685f0a?auto=format&fit=crop&q=80&w=800' });
      await pb.collection('products').create({ name: 'Ensemble Thioup', price: 65000, description: 'Ensemble pour homme en tissu thioup, broderie soignée.', category: 'Homme', image: 'https://images.unsplash.com/photo-1572804013307-f971ad9f7152?auto=format&fit=crop&q=80&w=800' });
      await pb.collection('products').create({ name: 'Boubou Lébou', price: 55000, description: 'Boubou traditionnel revisité avec une touche moderne.', category: 'Femme', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800' });
      await pb.collection('products').create({ name: 'Sac en Cuir Tressé', price: 25000, description: 'Accessoire indispensable pour sublimer votre tenue.', category: 'Accessoires', image: 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=800' });
      console.log('Seeded products');
    } else {
      console.log('Products already exist');
    }
  } catch(e) { console.log(e); }
}
run();
