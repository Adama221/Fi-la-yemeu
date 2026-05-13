import { Router } from 'express';
import { authRequired } from './middleware';
import admin from 'firebase-admin';

export function affiliateRoutes(db: FirebaseFirestore.Firestore) {
  const router = Router();

  router.get('/dashboard', authRequired, async (req, res) => {
    const user = (req as any).user;
    const snap = await db.collection('affiliates').where('user_id', '==', user.id).get();
    if (snap.empty) return res.json({ isAffiliate: false });
    
    const doc = snap.docs[0];
    const aff: any = { id: doc.id, ...doc.data() };
    
    const commSnap = await db.collection('commissions').where('affiliate_id', '==', aff.id).get();
    // In memory sort since we might not have a composite index
    const comms = commSnap.docs.map(c => ({ id: c.id, ...c.data() }))
      .sort((a: any, b: any) => {
        const at = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
        const bt = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
        return bt - at;
      });
      
    res.json({ isAffiliate: true, affiliate: aff, commissions: comms });
  });

  router.post('/apply', authRequired, async (req, res) => {
    const user = (req as any).user;
    const snap = await db.collection('affiliates').where('user_id', '==', user.id).get();
    if (!snap.empty) return res.status(400).json({ error: "Déjà affilié" });
    const code = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.collection('affiliates').add({ user_id: user.id, code, balance: 0, created_at: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true });
  });

  return router;
}
