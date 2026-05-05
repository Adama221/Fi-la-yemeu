import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Copy, Link as LinkIcon, Users, CreditCard, ChevronRight } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AffiliateDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/affiliate/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  const applyForAffiliate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        await fetchDashboard();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la création du compte affilié');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!dashboardData?.affiliate?.code) return;
    
    // Construct the affiliate link
    const link = `${window.location.origin}/?ref=${dashboardData.affiliate.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess('Lien copié !');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  if (loading || isLoading) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dashboardData?.isAffiliate) {
    return (
      <div className="pt-32 pb-24 min-h-screen container mx-auto px-6">
        <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-primary/5 text-center">
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-secondary">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-serif font-black italic text-primary mb-4">Programme d'Affiliation</h1>
          <p className="text-sm font-sans font-light text-text-deep leading-relaxed mb-8">
            Rejoignez notre programme pour promouvoir les créations Sama Butik. Gagnez des commissions sur chaque vente réalisée grâce à votre lien unique.
          </p>
          <button 
            onClick={applyForAffiliate}
            className="w-full bg-secondary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-lg hover:shadow-xl"
          >
            Devenir Affilié
          </button>
        </div>
      </div>
    );
  }

  const { affiliate, commissions } = dashboardData;
  const affiliateLink = `${window.location.origin}/?ref=${affiliate.code}`;
  
  // Calculate stats
  const totalEarned = commissions?.filter((c: any) => c.status === 'approved').reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
  const pendingAmount = commissions?.filter((c: any) => c.status === 'pending').reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
  const conversions = commissions?.length || 0;

  return (
    <div className="pt-32 pb-24 min-h-screen bg-background-warm text-primary font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-accent-soft rounded-full -translate-y-1/2 translate-x-1/3 opacity-20 blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary mb-2">Espace Affilié</p>
              <h1 className="text-4xl lg:text-5xl font-serif font-black italic tracking-tighter">Votre Tableau de Bord</h1>
           </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Link Sharing Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-primary/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform group-hover:scale-150 duration-700"></div>
              
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60 mb-6 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Lien de Parrainage
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-grow w-full bg-background-warm border border-primary/10 rounded-2xl p-4 font-mono text-sm text-primary overflow-x-auto whitespace-nowrap hide-scrollbar">
                  {affiliateLink}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="w-full sm:w-auto flex-shrink-0 bg-secondary text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2"
                >
                  {copySuccess ? <span>{copySuccess}</span> : <><Copy className="w-3 h-3" /> Copier le lien</>}
                </button>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-primary/40 mt-4">Code: <span className="text-secondary">{affiliate.code}</span></p>
            </motion.div>

            {/* Commissions List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2.5rem] shadow-sm border border-primary/5 overflow-hidden"
            >
              <div className="p-8 border-b border-primary/5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60">Historique des Commissions</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                  <thead className="bg-background-warm text-[9px] uppercase tracking-widest text-primary/40">
                    <tr>
                      <th className="px-8 py-4 font-bold">Date</th>
                      <th className="px-8 py-4 font-bold">Statut</th>
                      <th className="px-8 py-4 font-bold text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {commissions && commissions.length > 0 ? (
                      commissions.map((comm: any) => (
                        <tr key={comm.id} className="hover:bg-primary/[0.02] transition-colors">
                          <td className="px-8 py-4 text-[11px] uppercase tracking-widest font-bold text-primary/60">
                            {new Date(comm.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${comm.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {comm.status === 'approved' ? 'Validé' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right font-serif italic font-bold text-lg text-primary">
                            {formatPrice(comm.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-8 py-8 text-center text-primary/40 text-[10px] font-bold uppercase tracking-widest">
                          Aucune commission pour le moment
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden"
             >
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Solde Disponible</p>
               <h3 className="text-5xl font-serif font-black italic mb-6 shadow-sm">{formatPrice(affiliate.balance || 0)}</h3>
               
               <button className="w-full bg-white text-primary py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 group">
                 <CreditCard className="w-4 h-4" /> Demander un paiement
               </button>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-primary/5 grid grid-cols-2 gap-6"
             >
               <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-2">Total Gagné</p>
                  <p className="text-xl font-serif font-bold italic text-secondary">{formatPrice(totalEarned)}</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-2">En Attente</p>
                  <p className="text-xl font-serif font-bold italic text-primary">{formatPrice(pendingAmount)}</p>
               </div>
               <div className="col-span-2 pt-4 border-t border-primary/5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-2">Conversions</p>
                  <p className="text-2xl font-serif font-bold text-primary">{conversions} <span className="text-sm font-sans font-light italic text-primary/40">ventes</span></p>
               </div>
             </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
