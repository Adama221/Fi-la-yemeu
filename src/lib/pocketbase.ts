import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.VITE_POCKETBASE_URL;

if (!pbUrl) {
  console.warn('PocketBase URL missing. Please set VITE_POCKETBASE_URL in your environment variables.');
}

// Fallback to dummy string if missing
export const pb = new PocketBase(pbUrl || 'http://127.0.0.1:8090');
