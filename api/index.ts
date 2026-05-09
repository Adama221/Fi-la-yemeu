import type { VercelRequest, VercelResponse } from '@vercel/node';
import { startServer } from '../server.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!cachedApp) {
      cachedApp = await startServer();
    }
    cachedApp(req as any, res as any);
  } catch (err: any) {
    console.error("Vercel Serverless Function Startup Error:", err);
    res.status(500).json({ 
      error: "Erreur critique du serveur backend. La base de données ou le service n'a pas pu démarrer.",
      details: err.message || String(err),
      hint: "Consultez les journaux (logs) Vercel pour plus d'informations. SQLite n'est pas nativement supporté.",
      stack: err.stack
    });
  }
}
