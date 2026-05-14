import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pour-samabutik';

export const authRequired = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Accès refusé, veuillez vous connecter." });
  }

  const token = authHeader.split(' ')[1];
  let user: any = null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    user = decoded;
  } catch(e: any) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expiré. Veuillez vous reconnecter." });
    }
    return res.status(401).json({ error: "Token invalide." });
  }

  if (!user) {
    return res.status(401).json({ error: "Utilisateur non trouvé." });
  }

  (req as any).user = user;
  next();
};

export const adminRequired = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Accès refusé, veuillez vous connecter." });
  }

  const token = authHeader.split(' ')[1];
  let user: any = null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    user = decoded;
  } catch(e: any) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expiré. Veuillez vous reconnecter." });
    }
    return res.status(401).json({ error: "Token invalide." });
  }

  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Accès interdit : privilèges administrateur requis." });
  }

  (req as any).user = user;
  next();
};
