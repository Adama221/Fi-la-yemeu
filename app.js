process.env.NODE_ENV = 'production';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(serverPath)) {
  import('./dist/server.cjs').catch(err => {
    console.error('Failed to load server.cjs:', err);
  });
} else {
  console.error('Production server.cjs not found at:', serverPath);
}
