import type { VercelRequest, VercelResponse } from '@vercel/node';
import appPromise from '../server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await appPromise;
    app(req as any, res as any);
  } catch (err: any) {
    console.error("Vercel Serverless Function Startup Error:", err);
    res.status(500).json({ 
      error: "Erreur critique du serveur backend. La base de données ou le service n'a pas pu démarrer.",
      details: err.message,
      hint: "Vercel ne supporte pas SQLite nativement pour le stockage persistant. Déployez sur un VPS (Hostinger), Render, ou utilisez une base de données cloud (Neon / Supabase)."
    });
  }
}
