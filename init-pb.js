import PocketBase from 'pocketbase';
(async () => {
  const pb = new PocketBase('http://127.0.0.1:8090');
  
  try {
    await pb.collection('_superusers').authWithPassword('admin@admin.com', 'password123');
  } catch(e) {
    console.log("Auth failed", e);
    return;
  }

  // Update Users collection
  try {
    const users = await pb.collections.getOne('users');
    let hasRole = false;
    for (const f of users.fields) {
      if (f.name === 'role') hasRole = true;
    }
    if (!hasRole) {
      users.fields.push({
        system: false,
        name: 'role',
        type: 'select',
        required: false,
        maxSelect: 1,
        values: ['client', 'affiliate', 'admin']
      });
      await pb.collections.update('users', users);
      console.log("Added role field to users");
    }
  } catch (e) {
    console.log("Updating fields users", e);
  }

  // Create Settings Collection
  try {
    await pb.collections.create({
       name: 'settings',
       type: 'base',
       listRule: '""',
       viewRule: '""',
       createRule: null, // superuser only
       updateRule: null, // superuser only
       deleteRule: null, // superuser only
       fields: [
         { name: 'type', type: 'text', required: true },
         { name: 'logo', type: 'url' },
         { name: 'logo_file', type: 'file', maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'] },
         { name: 'primary_color', type: 'text' },
         { name: 'secondary_color', type: 'text' },
         { name: 'homepage_text', type: 'text' },
         { name: 'wave_base_url', type: 'url' },
         { name: 'orange_api_url', type: 'url' },
         { name: 'orange_merchant_key', type: 'text' },
         { name: 'orange_token', type: 'text' }
       ]
    });
    console.log("Settings created");
  } catch(e) {
    // console.log("Settings probably exists", e);
    try {
      const c = await pb.collections.getOne('settings');
      if (!c.fields.find((f) => f.name === 'logo_file')) {
        c.fields.push({ name: 'logo_file', type: 'file', maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png'] });
        await pb.collections.update('settings', c);
      }
    } catch(err) {}
  }

  // Create Products Collection
  try {
    await pb.collections.create({
       name: 'products',
       type: 'base',
       listRule: '""',
       viewRule: '""',
       createRule: null, 
       updateRule: null, 
       deleteRule: null,
       fields: [
         { name: 'name', type: 'text', required: true },
         { name: 'price', type: 'number', required: true },
         { name: 'description', type: 'text' },
         { name: 'image', type: 'url' }, // can be file, but we will use url for simplicity or file? wait file is better
         { name: 'category', type: 'text' }
       ]
    });
    console.log("Products created");
    
    // Add file field
    const c = await pb.collections.getOne('products');
    c.fields.push({ name: 'image_file', type: 'file', maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png'] });
    await pb.collections.update('products', c);
  } catch(e) {}

  // Create Affiliates Collection
  try {
     await pb.collections.create({
       name: 'affiliates',
       type: 'base',
       listRule: '""',
       viewRule: '""',
       createRule: '""', 
       updateRule: null, 
       deleteRule: null,
       fields: [
         { name: 'user', type: 'relation', collectionId: 'users', maxSelect: 1 },
         { name: 'code', type: 'text', required: true },
         { name: 'balance', type: 'number' },
         { name: 'status', type: 'text' }
       ]
    });
  } catch(e) {}

  // Create Orders Collection
  try {
     await pb.collections.create({
       name: 'orders',
       type: 'base',
       listRule: '""',
       viewRule: '""',
       createRule: '""', 
       updateRule: null, 
       deleteRule: null,
       fields: [
         { name: 'customer_name', type: 'text' },
         { name: 'customer_address', type: 'text' },
         { name: 'customer_phone', type: 'text' },
         { name: 'items', type: 'json' },
         { name: 'total', type: 'number' },
         { name: 'status', type: 'text' }, // pending, delivered
         { name: 'method', type: 'text' } // wave, orange
       ]
    });
  } catch(e) {}

  // Set default settings
  try {
     await pb.collection('settings').create({
       type: 'branding',
       primary_color: '#314227',
       secondary_color: '#D4A373',
       homepage_text: 'Bienvenue sur Sama Butik'
     });
     
     await pb.collection('settings').create({
       type: 'payment',
       wave_base_url: '',
       orange_api_url: ''
     });
  } catch(e){}

})();
