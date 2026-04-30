const { execSync } = require('child_process');
execSync('./pocketbase superuser upsert admin@admin.com password123');
console.log('done');
