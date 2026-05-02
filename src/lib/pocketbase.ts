import PocketBase from 'pocketbase';

// You can change this to your hosted PocketBase URL
// If running locally with the proxy, use '/api/pb'
const url = '/api/pb';
export const pb = new PocketBase(url);

// Helper to check if pb is available
export const isPbAvailable = async () => {
  try {
    const health = await pb.health.check();
    return health.code === 200;
  } catch (e) {
    return false;
  }
};
