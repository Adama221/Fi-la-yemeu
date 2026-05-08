import type { VercelRequest, VercelResponse } from '@vercel/node';
import appPromise from '../server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await appPromise;
  app(req as any, res as any);
}
