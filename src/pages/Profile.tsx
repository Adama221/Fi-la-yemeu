import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, User, LogOut, ChevronRight, ShoppingBag, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { formatPrice } from '../lib/utils';

export default function Profile() {
  const { user, profile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const contentType = res.headers.get('content-type');
      if (res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else {
          throw new Error("Réponse API invalide : Reçu du HTML au lieu de JSON. Le serveur n'est pas bien configuré.");
        }
      } else {
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          throw new Error(errData.error || `Erreur ${res.status}`);
        } else {
           throw new Error(`Le serveur API n'a pas répondu correctement (Status: ${res.status}).`);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading || isLoading) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex justify-center items-center bg-background-warm">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-background-warm text-primary font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[60vw] h-[60vw] bg-secondary/5 rounded-full -translate-y-1/2 -translate-x-1/2 opacity-50 blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary mb-2">Mon Compte</p>
            <h1 className="text-5xl lg:text-7xl font-serif font-black italic tracking-tighter leading-none mb-4 uppercase">Espace Client</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-4 bg-white border border-primary/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Profile Basic Info */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-10 rounded-[3rem] shadow-xl border border-primary/5"
            >
              <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-primary text-secondary rounded-[2rem] flex items-center justify-center text-4xl font-serif font-black italic mb-6 shadow-2xl rotate-3">
                   {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                 </div>
                 <h2 className="text-3xl font-serif font-bold text-primary mb-1 italic">{profile?.full_name || 'Utilisateur'}</h2>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-8">{user?.email}</p>
                 
                 <div className="w-full space-y-4 pt-8 border-t border-primary/5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest px-4 py-2 border-b border-primary/5">
                       <span className="text-primary/40">Role</span>
                       <span className="text-secondary">{profile?.role || 'Client'}</span>
                    </div>
                    {profile?.role === 'admin' && (
                      <Link to="/admin" className="block w-full text-center py-4 rounded-2xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all">Accès Administration</Link>
                    )}
                    <Link to="/affiliate" className="block w-full text-center py-4 rounded-2xl bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all">Espace Affilié</Link>
                 </div>
              </div>
            </motion.div>

            <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <ShoppingBag className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 -rotate-12" />
               <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary mb-6 relative z-10">Résumé</h3>
               <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end">
                     <p className="text-base font-serif italic text-white/60">Total Commandes</p>
                     <p className="text-5xl font-serif font-black italic">{orders.length}</p>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-40 font-bold uppercase tracking-widest">Merci de votre fidélité chez Sama Butik.</p>
               </div>
            </div>
          </div>

          {/* Orders History */}
          <div className="lg:col-span-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/40 mb-8 border-b border-primary/10 pb-4 flex items-center gap-4">
              <Clock className="w-4 h-4" /> Historique de Commandes
            </h3>
            
            <div className="space-y-8">
               {error && (
                 <div className="bg-red-50 text-red-500 p-6 rounded-3xl border border-red-100 text-sm font-bold uppercase tracking-widest">
                   {error}
                 </div>
               )}

               {orders.length === 0 && !isLoading && !error && (
                 <div className="bg-white p-16 rounded-[4rem] text-center border border-primary/5 shadow-sm">
                    <p className="text-xl font-serif italic text-primary/40 mb-8">Vous n'avez pas encore passé de commande.</p>
                    <Link to="/products" className="inline-block bg-primary text-white px-10 py-5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all">Parcourir la Boutique</Link>
                 </div>
               )}

               <div className="grid grid-cols-1 gap-6">
                 {orders.map((order, i) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     key={order.id} 
                     className="bg-white rounded-[3rem] p-4 pr-10 shadow-sm border border-primary/5 flex flex-col md:flex-row items-center gap-8 group hover:shadow-xl transition-all duration-500"
                   >
                     <div className="w-full md:w-40 aspect-square bg-accent-soft rounded-[2.5rem] overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-95 transition-transform duration-700">
                        <img 
                          src={order.items?.[0]?.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=400'} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                     </div>
                     
                     <div className="flex-grow py-4 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-1">Commande #{String(order.id).slice(0,8)}</p>
                              <h4 className="text-2xl font-serif font-black italic text-primary">
                                 {order.items?.length || 0} Article{(order.items?.length || 0) > 1 ? 's' : ''}
                              </h4>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest ${order.status === 'Livré' ? 'bg-green-100 text-green-600' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>
                                 {order.status}
                              </span>
                           </div>
                        </div>

                        <div className="flex items-center gap-10">
                           <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-1">Date</p>
                              <p className="text-[11px] font-bold text-primary">{new Date(order.created_at).toLocaleDateString()}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-1">Total</p>
                              <p className="text-xl font-serif font-bold italic text-secondary">{formatPrice(order.total)}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-1">Paiement</p>
                              <p className="text-[11px] font-bold text-primary uppercase tracking-tighter">{order.method}</p>
                           </div>
                        </div>
                     </div>
                     
                     <Link to="#" className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm border border-primary/5">
                        <ChevronRight className="w-6 h-6" />
                     </Link>
                   </motion.div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 z-[110] text-center"
            >
              <LogOut className="w-12 h-12 text-secondary mx-auto mb-6 opacity-80" />
              <h3 className="text-xl font-serif italic text-primary/80 mb-2">Se déconnecter ?</h3>
              <p className="text-sm text-primary/60 mb-8">Êtes-vous sûr de vouloir quitter votre session ?</p>
              <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-4 bg-background-warm border-primary/5 rounded-2xl text-primary/60 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmLogout}
                  className="flex-1 py-4 bg-primary text-white rounded-full hover:bg-secondary transition-colors shadow-lg shadow-primary/20"
                >
                  Quitter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
