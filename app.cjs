process.env.NODE_ENV = 'production';
const path = require('path');
const fs = require('fs');

const serverPath = path.resolve(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(serverPath)) {
  require('./dist/server.cjs');
} else {
  console.error('Production server.cjs not found at:', serverPath);
}
