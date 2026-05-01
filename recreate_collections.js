import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:3000/api/pb');
async function run() {
  await pb.collection('_superusers').authWithPassword('admin@admin.com', 'password123');
  try {
    await pb.collections.create({
      name: 'products',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'price', type: 'number' },
        { name: 'description', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'image', type: 'text' },
        { name: 'image_file', type: 'file', maxSelect: 15 },
        { name: 'commission', type: 'number' }
      ]
    });
    console.log('Created products');
  } catch(e) { console.log(e.response); }
  
  try {
    await pb.collections.create({
      name: 'orders',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'total', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'method', type: 'text' },
        { name: 'user', type: 'relation', relationOptions: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'items', type: 'json' }
      ]
    });
    console.log('Created orders');
  } catch(e) { console.log(e.response); }

  try {
    await pb.collections.create({
      name: 'settings',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'type', type: 'text' },
        { name: 'primary_color', type: 'text' },
        { name: 'secondary_color', type: 'text' },
        { name: 'homepage_text', type: 'text' },
        { name: 'logo_file', type: 'file', maxSelect: 1 },
        { name: 'logo', type: 'text' },
        { name: 'wave_base_url', type: 'url' },
        { name: 'orange_api_url', type: 'url' },
        { name: 'orange_merchant_key', type: 'text' },
        { name: 'orange_token', type: 'text' }
      ]
    });
    console.log('Created settings');
  } catch(e) { console.log(e.response); }

  try {
    await pb.collections.create({
      name: 'affiliates',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'user', type: 'relation', relationOptions: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'balance', type: 'number' },
        { name: 'code', type: 'text' }
      ]
    });
    console.log('Created affiliates');
  } catch(e) { console.log(e.response); }
}
run();
