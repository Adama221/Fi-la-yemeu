import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.VITE_POCKETBASE_URL;

// Point to the relative proxy path so it works everywhere
export const pb = new PocketBase(pbUrl || '/api/pb');
