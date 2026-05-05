import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Success() {
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || '65000';
  const method = searchParams.get('method') || 'orange';

  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'Inconnu';

  return (
    <div className="py-24 bg-background-warm min-h-screen">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-20 rounded-[4rem] shadow-2xl border border-primary/5"
        >
          <div className="flex justify-center mb-16">
             <div className="bg-accent-soft p-8 rounded-full">
                <CheckCircle2 className="w-20 h-20 text-secondary" />
             </div>
          </div>

          <h1 className="text-6xl font-serif font-bold uppercase tracking-tight mb-4 text-primary italic">Merci {firstName}!</h1>
          <p className="text-secondary uppercase tracking-[0.4em] text-[10px] font-bold mb-16">Votre commande est confirmée</p>

          <div className="bg-accent-soft/20 p-10 rounded-[2.5rem] space-y-8 mb-16 text-left border border-secondary/10">
             <div className="flex justify-between items-center border-b border-secondary/10 pb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Total Payé</span>
                <span className="font-serif italic font-bold text-3xl text-secondary">{formatPrice(Number(amount))}</span>
             </div>
             <div className="flex justify-between items-center border-b border-secondary/10 pb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Méthode</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-serif italic">{method === 'orange' ? 'Orange Money' : 'Wave (En attente)'}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Status</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-secondary px-4 py-1.5 rounded-full">{method === 'orange' ? 'EFFECTUÉ' : 'VÉRIFICATION'}</span>
             </div>
          </div>

          <div className="flex flex-col gap-6">
             <Link to="/products" className="w-full bg-primary text-white py-6 rounded-full text-xs font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-secondary transition-all shadow-lg shadow-primary/20">
                Retour à la boutique <ArrowRight className="w-4 h-4" />
             </Link>
             <button className="w-full border border-primary/10 text-primary py-6 rounded-full text-xs font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-accent-soft transition-all">
                Télécharger Facture <Download className="w-4 h-4 text-secondary" />
             </button>
          </div>

          <div className="mt-20 flex items-center justify-center gap-6 text-primary/20">
             <Package className="w-6 h-6" />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Suivez votre colis sur WhatsApp</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
