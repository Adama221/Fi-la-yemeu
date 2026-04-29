import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, BadgePercent, LogOut, ChevronRight, TrendingUp, DollarSign, PackageCheck, AlertCircle, Plus, Search, Filter, MoreVertical, X, Palette, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploader from '../components/ImageUploader';
import { pb } from '../lib/pocketbase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [branding, setBranding] = useState({ logo: '', color: '#DAA520' });
  const [paymentSettings, setPaymentSettings] = useState({
    wave_base_url: '',
    orange_api_url: '',
    orange_merchant_key: '',
    orange_token: ''
  });
  const navigate = useNavigate();
  const { profile, isAdmin, logout: handleAuthLogout, loading, user } = useAuth();
  
  // Product Form state
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Femme');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState('https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=800');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Fetch settings & products on load
  useEffect(() => {
    const fetchData = async () => {
      if (isAdmin) {
        // Fetch Settings (Fallback to API or handle missing PB collection config by trying to get list)
        try {
          const generalSettings = await pb.collection('settings').getFirstListItem('type="general"');
          if (generalSettings) {
            setBranding({
              logo: generalSettings.logo || '',
              color: generalSettings.primary_color || '#DAA520'
            });
          }
        } catch(e) {}

        try {
          const paySettings = await pb.collection('settings').getFirstListItem('type="payment"');
          if (paySettings) {
            setPaymentSettings({
              wave_base_url: paySettings.wave_base_url || '',
              orange_api_url: paySettings.orange_api_url || '',
              orange_merchant_key: paySettings.orange_merchant_key || '',
              orange_token: paySettings.orange_token || ''
            });
          }
        } catch(e) {}
      }

      // Fetch Products
      try {
        const prods = await pb.collection('products').getFullList({ sort: '-created' });
        setProducts(prods || []);
      } catch(e) {}

      // Fetch Orders
      try {
        const ords = await pb.collection('orders').getFullList({ sort: '-created' });
        setOrders(ords || []);
      } catch(e) {}
    };

    fetchData();

    // Realtime listeners
    pb.collection('products').subscribe('*', fetchData).catch(console.warn);
    pb.collection('orders').subscribe('*', fetchData).catch(console.warn);

    return () => {
      pb.collection('products').unsubscribe('*').catch(console.warn);
      pb.collection('orders').unsubscribe('*').catch(console.warn);
    };
  }, [isAdmin]);

  const handleUpdateDesign = async () => {
    try {
      let record;
      try {
         record = await pb.collection('settings').getFirstListItem('type="general"');
      } catch(e) {}

      if (record) {
        await pb.collection('settings').update(record.id, {
          logo: branding.logo,
          primary_color: branding.color,
        });
      } else {
        await pb.collection('settings').create({
          type: 'general',
          logo: branding.logo,
          primary_color: branding.color,
        });
      }
      
      alert('Design modifié avec succès');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleUpdatePayment = async () => {
    try {
      let record;
      try {
         record = await pb.collection('settings').getFirstListItem('type="payment"');
      } catch(e) {}

      if (record) {
        await pb.collection('settings').update(record.id, {
          ...paymentSettings,
        });
      } else {
        await pb.collection('settings').create({
          type: 'payment',
          ...paymentSettings,
        });
      }

      alert('Paramètres de paiement mis à jour');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la mise à jour des paiements');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pb.collection('products').create({
        name: productName,
        price: Number(productPrice),
        category: productCategory,
        description: productDescription,
        image: productImage
      });

      setIsAddProductOpen(false);
      alert('Produit ajouté avec succès!');
      setProductName('');
      setProductPrice('');
      setProductDescription('');
    } catch (error) {
      console.error(error);
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  const handleLogout = async () => {
    await handleAuthLogout();
    navigate('/login');
  };

  const handleExport = () => {
    alert('Préparation de l\'exportation CSV... Le téléchargement commencera sous peu.');
  };

  const stats = [
    { title: 'Ventes Totales', value: '450,000 FCFA', icon: <DollarSign className="w-5 h-5 text-green-500" />, trend: '+12.5%' },
    { title: 'Commandes', value: '24', icon: <ShoppingCart className="w-5 h-5 text-blue-500" />, trend: '+3 initial' },
    { title: 'Affiliés Actifs', value: '12', icon: <Users className="w-5 h-5 text-purple-500" />, trend: 'Stable' },
    { title: 'Produits', value: products.length.toString(), icon: <Package className="w-5 h-5 text-orange-500" />, trend: '+2 cette semaine' },
  ];

  return (
    <div className="min-h-screen bg-background-warm flex font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-primary text-background-warm flex flex-col pt-12 shadow-2xl z-10">
        <div className="px-10 mb-16">
           <h2 className="text-3xl font-serif font-bold tracking-tight text-white mb-1">Console</h2>
           <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold">SAMA BUTIK ADMIN</p>
        </div>

        <nav className="flex-grow px-6 space-y-3">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-4"><LayoutDashboard className="w-4 h-4" /> Dashboard</div>
             <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'dashboard' ? 'rotate-90' : 'opacity-20'}`} />
          </button>
          
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-4"><Package className="w-4 h-4" /> Produits</div>
             <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'products' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-4"><ShoppingCart className="w-4 h-4" /> Commandes</div>
             <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'orders' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            onClick={() => setActiveTab('affiliates')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'affiliates' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-4"><Users className="w-4 h-4" /> Affiliés</div>
             <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'affiliates' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            onClick={() => setActiveTab('commissions')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'commissions' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-4"><BadgePercent className="w-4 h-4" /> Commissions</div>
             <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'commissions' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            onClick={() => setActiveTab('branding')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'branding' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-4"><Palette className="w-4 h-4" /> Design</div>
             <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'branding' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-4"><CreditCard className="w-4 h-4" /> Paiements</div>
             <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'payments' ? 'rotate-90' : 'opacity-20'}`} />
          </button>
        </nav>

        <div className="p-8 mt-auto border-t border-white/5">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-4 px-6 py-4 text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
           >
             <LogOut className="w-4 h-4" /> Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-16 overflow-y-auto">
        <header className="flex justify-between items-end mb-16">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white text-md font-bold font-serif italic">P</div>
                 <p className="text-[10px] text-primary font-bold uppercase tracking-[0.4em]">Bienvenue, Pape</p>
              </div>
              <h1 className="text-6xl font-serif font-bold uppercase tracking-tight text-primary italic">
                {activeTab === 'dashboard' ? 'Vue d\'ensemble' : activeTab === 'payments' ? 'Paiements' : activeTab === 'branding' ? 'Design' : activeTab}
              </h1>
           </div>
           <div className="flex gap-6">
              <button 
                onClick={handleExport}
                className="bg-white border border-primary/10 px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all shadow-sm"
              >
                Exporter Rapports
              </button>
              <button 
                onClick={() => setIsAddProductOpen(true)}
                className="bg-primary text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all shadow-lg"
              >
                + Nouveau Produit
              </button>
           </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-16">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {stats.map((stat, i) => (
                 <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-primary/5 group hover:scale-105 transition-transform duration-500"
                 >
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-12 h-12 bg-accent-soft rounded-2xl flex items-center justify-center group-hover:bg-secondary transition-colors group-hover:text-white">{stat.icon}</div>
                       <span className={`text-[10px] font-bold px-3 py-1 bg-accent-soft/50 rounded-full ${stat.trend.startsWith('+') ? 'text-secondary' : 'text-primary/40'}`}>
                         {stat.trend}
                       </span>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary/40 mb-2">{stat.title}</p>
                    <h3 className="text-3xl font-serif font-bold text-primary italic">{stat.value}</h3>
                 </motion.div>
               ))}
            </div>

            {/* Tables / Detailed View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl border border-primary/5 overflow-hidden">
                  <div className="p-10 border-b border-primary/5 flex justify-between items-center bg-accent-soft/20">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Dernières Commandes</h4>
                    <Link to="#" className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline italic font-serif">Voir tout</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                         <tr className="text-[10px] font-bold uppercase tracking-widest text-primary/40 border-b border-primary/5">
                           <th className="px-10 py-6">Client</th>
                           <th className="px-10 py-6">Status</th>
                           <th className="px-10 py-6">Montant</th>
                           <th className="px-10 py-6">Canal</th>
                           <th className="px-10 py-6 text-right">Action</th>
                         </tr>
                       </thead>
                       <tbody className="text-xs">
                         {orders.slice(0, 5).map((order) => (
                           <tr key={order.id} className="border-b border-primary/5 hover:bg-accent-soft/10 transition-colors">
                             <td className="px-10 py-6">
                                <p className="font-bold text-primary font-serif italic text-base">{order.customer?.prenom} {order.customer?.nom}</p>
                                <p className="text-[10px] text-primary/40 font-bold tracking-widest uppercase">{order.customer?.adresse}</p>
                             </td>
                             <td className="px-10 py-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${order.status === 'VÉRIFICATION' ? 'bg-secondary/10 text-secondary' : 'bg-green-100 text-green-600'}`}>
                                  {order.status}
                                </span>
                             </td>
                             <td className="px-10 py-6 font-serif italic text-lg text-primary font-bold">{formatPrice(order.total || 0)}</td>
                             <td className="px-10 py-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${order.method === 'wave' ? 'bg-blue-400' : 'bg-orange-400'}`} />
                                    <span className="uppercase text-[9px] font-bold tracking-widest text-primary/60">{order.method}</span>
                                </div>
                             </td>
                             <td className="px-10 py-6 text-right">
                                <button className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors italic font-serif">Détails →</button>
                             </td>
                           </tr>
                         ))}
                         {orders.length === 0 && (
                           <tr>
                             <td colSpan={5} className="px-10 py-6 text-center text-primary/40 italic font-serif">Aucune commande récente.</td>
                           </tr>
                         )}
                       </tbody>
                    </table>
                  </div>
               </div>

               <div className="space-y-12">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <AlertCircle className="w-24 h-24 text-secondary" />
                    </div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-10 text-primary border-b border-primary/5 pb-4">Alertes Wave</h4>
                    <div className="space-y-6">
                       {[1, 2].map((alert) => (
                         <div key={alert} className="relative z-10 p-6 bg-secondary/5 rounded-2xl border border-secondary/10 hover:shadow-lg transition-shadow">
                            <div>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3" /> Transaction à valider
                               </p>
                               <p className="text-[9px] text-primary/60 leading-relaxed font-medium">
                                  ID: #WV-928{alert} • Un client attend sa confirmation de livraison.
                               </p>
                               <button className="mt-4 text-[9px] font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors border-b border-primary/20">Vérifier</button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="bg-primary p-12 rounded-[3.5rem] text-background-warm relative overflow-hidden shadow-2xl">
                    <TrendingUp className="absolute top-[-40px] right-[-40px] w-64 h-64 text-white/5 rotate-12" />
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.6em] mb-6 text-secondary font-serif italic">Objectif Mensuel</h4>
                    <p className="text-4xl font-serif font-bold italic tracking-tight mb-6">2,500,000 F</p>
                    <div className="w-full bg-white/10 h-2 rounded-full mb-4 overflow-hidden border border-white/5">
                       <div className="bg-secondary h-full w-[42%]" />
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">42% Progressé</p>
                        <p className="text-[10px] text-secondary uppercase font-bold tracking-widest italic font-serif">Presque la moitié</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-primary/5 overflow-hidden">
            <div className="p-10 border-b border-primary/5 flex justify-between items-center bg-accent-soft/20">
              <div className="flex items-center gap-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Gestion de l'Inventaire</h4>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-primary/5 shadow-inner">
                  <Search className="w-3 h-3 text-primary/40" />
                  <input type="text" placeholder="Rechercher..." className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-40" />
                </div>
              </div>
              <div className="flex gap-4">
                <button className="p-3 bg-white border border-primary/5 rounded-full hover:bg-secondary hover:text-white transition-all shadow-sm">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-primary/40 border-b border-primary/5">
                    <th className="px-10 py-6">Produit</th>
                    <th className="px-10 py-6">Catégorie</th>
                    <th className="px-10 py-6">Stock</th>
                    <th className="px-10 py-6">Prix</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-6 text-center text-primary/40 italic">Aucun produit trouvé</td>
                    </tr>
                  ) : products.map((item, i) => (
                    <tr key={item.id} className="border-b border-primary/5 hover:bg-accent-soft/10 transition-colors">
                      <td className="px-10 py-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-soft rounded-xl overflow-hidden shadow-sm">
                          <img src={item.image || `https://images.unsplash.com/photo-${1549439602 + i}?auto=format&fit=crop&q=80&w=100`} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="font-bold text-primary font-serif italic text-base">{item.name}</p>
                          <p className="text-[10px] text-primary/40 font-bold tracking-widest uppercase">ID: #{item.id.slice(0,8)}</p>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="uppercase text-[9px] font-bold tracking-widest text-primary/60">{item.category}</span>
                      </td>
                      <td className="px-10 py-6 font-bold text-primary">En stock</td>
                      <td className="px-10 py-6 font-serif italic text-lg text-secondary font-bold">{formatPrice(item.price)}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-accent-soft rounded-full transition-colors text-primary/40"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-primary/5 overflow-hidden">
            <div className="p-10 border-b border-primary/5 flex justify-between items-center bg-accent-soft/20">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Historique des Commandes</h4>
              <button className="bg-white px-6 py-2 rounded-full border border-primary/5 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all shadow-sm">Tout Actualiser</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-primary/40 border-b border-primary/5">
                    <th className="px-10 py-6">Commande</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6">Client</th>
                    <th className="px-10 py-6">Total</th>
                    <th className="px-10 py-6 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-primary/5 hover:bg-accent-soft/10 transition-colors">
                      <td className="px-10 py-6">
                        <p className="font-bold text-primary font-serif italic text-base">#CMD-{2841 + i}</p>
                        <p className="text-[10px] text-primary/40 font-bold tracking-widest uppercase">Il y a {i + 1} heures</p>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${i === 0 ? 'bg-secondary/10 text-secondary' : 'bg-green-100 text-green-600'}`}>
                          {i === 0 ? 'Traitement' : 'Livré'}
                        </span>
                      </td>
                      <td className="px-10 py-6 font-bold text-primary/70 italic font-serif">Client Anonyme #{i + 10}</td>
                      <td className="px-10 py-6 font-serif italic text-lg text-primary font-bold">{formatPrice(45000 + i * 2000)}</td>
                      <td className="px-10 py-6 text-right">
                        <button className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors italic font-serif">Voir Bon →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-primary/5 overflow-hidden">
            <div className="p-10 border-b border-primary/5 flex justify-between items-center bg-accent-soft/20">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Toutes les Commandes</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                   <tr className="text-[10px] font-bold uppercase tracking-widest text-primary/40 border-b border-primary/5">
                     <th className="px-10 py-6">Client</th>
                     <th className="px-10 py-6">Produits</th>
                     <th className="px-10 py-6">Status</th>
                     <th className="px-10 py-6">Montant</th>
                     <th className="px-10 py-6">Date</th>
                   </tr>
                 </thead>
                 <tbody className="text-xs">
                   {orders.map((order) => (
                     <tr key={order.id} className="border-b border-primary/5 hover:bg-accent-soft/10 transition-colors">
                       <td className="px-10 py-6">
                          <p className="font-bold text-primary font-serif italic text-base">{order.customer?.prenom} {order.customer?.nom}</p>
                          <p className="text-[10px] text-primary/40 font-bold tracking-widest uppercase">{order.customer?.adresse} - {order.customer?.telephone}</p>
                       </td>
                       <td className="px-10 py-6">
                          {order.items?.map((i: any) => (
                            <p key={i.id} className="text-[10px] uppercase font-bold tracking-widest text-primary/60">{i.quantity}x {i.name}</p>
                          ))}
                       </td>
                       <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${order.status === 'VÉRIFICATION' ? 'bg-secondary/10 text-secondary' : 'bg-green-100 text-green-600'}`}>
                            {order.status}
                          </span>
                       </td>
                       <td className="px-10 py-6 font-serif italic text-lg text-primary font-bold">{formatPrice(order.total || 0)}</td>
                       <td className="px-10 py-6 text-[10px] text-primary/60 uppercase font-bold tracking-widest">
                          {new Date(order.created_at).toLocaleDateString()}
                       </td>
                     </tr>
                   ))}
                   {orders.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-10 py-6 text-center text-primary/40 italic font-serif">Aucune commande.</td>
                     </tr>
                   )}
                 </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'affiliates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[1, 2, 3, 4].map((aff) => (
              <div key={aff} className="bg-white p-10 rounded-[3rem] shadow-xl border border-primary/5 flex items-center gap-8 group hover:scale-[1.02] transition-all">
                <div className="w-24 h-24 bg-accent-soft rounded-[2rem] flex items-center justify-center text-3xl font-serif font-bold text-secondary italic shadow-inner">
                  {aff === 1 ? 'A' : aff === 2 ? 'F' : aff === 3 ? 'S' : 'M'}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-serif font-bold text-primary italic">Affilié #{aff * 7}</h4>
                    <span className="text-[10px] font-bold bg-green-100 text-green-600 px-3 py-1 rounded-full uppercase tracking-widest">Actif</span>
                  </div>
                  <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest mb-6">Code: SAMA-{aff}2026</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent-soft/30 p-4 rounded-2xl">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-primary/40 mb-1">Ventes</p>
                      <p className="text-lg font-serif font-bold text-primary italic">{aff * 3 + 2}</p>
                    </div>
                    <div className="bg-accent-soft/30 p-4 rounded-2xl">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-primary/40 mb-1">Gain Total</p>
                      <p className="text-lg font-serif font-bold text-secondary italic">{formatPrice(aff * 12500)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="bg-primary p-16 rounded-[4rem] text-background-warm shadow-2xl relative overflow-hidden">
             <BadgePercent className="absolute top-[-50px] left-[-50px] w-96 h-96 text-white/5 -rotate-12" />
             <div className="relative z-10">
                <h3 className="text-5xl font-serif font-bold italic mb-8 tracking-tight">Récapitulatif des Commissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   <div className="space-y-4">
                      <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-secondary">À Payer</p>
                      <h4 className="text-4xl font-serif font-bold">{formatPrice(124500)}</h4>
                      <button className="w-full bg-secondary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all">Générer Paiements Wave</button>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Total Payé (2026)</p>
                      <h4 className="text-4xl font-serif font-bold">{formatPrice(845000)}</h4>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Affilié du Mois</p>
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                         <div className="w-10 h-10 bg-secondary rounded-full" />
                         <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest">Abdou Karim</p>
                            <p className="text-[9px] text-white/40 italic">+12 ventes</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="max-w-2xl bg-white p-16 rounded-[4rem] shadow-2xl border border-primary/5">
            <h3 className="text-4xl font-serif font-bold italic mb-12 tracking-tight text-primary">Identité Visuelle</h3>
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Logo URL</label>
                <input 
                  type="text" 
                  value={branding.logo}
                  onChange={e => setBranding({...branding, logo: e.target.value})}
                  className="w-full bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Couleur Primaire</label>
                <div className="flex gap-6 items-center">
                  <input 
                    type="color" 
                    value={branding.color}
                    onChange={e => setBranding({...branding, color: e.target.value})}
                    className="w-20 h-20 rounded-2xl border-none outline-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={branding.color}
                    onChange={e => setBranding({...branding, color: e.target.value})}
                    className="flex-grow bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl uppercase"
                  />
                </div>
              </div>
              <button 
                onClick={handleUpdateDesign}
                className="w-full bg-primary text-white py-6 rounded-full text-xs font-bold uppercase tracking-[0.4em] hover:bg-secondary transition-all shadow-xl"
              >
                Appliquer les Modifications
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="max-w-2xl bg-white p-16 rounded-[4rem] shadow-2xl border border-primary/5">
            <h3 className="text-4xl font-serif font-bold italic mb-12 tracking-tight text-primary">Service de Paiement</h3>
            
            <div className="space-y-12">
               <div className="space-y-6">
                  <h4 className="text-[10px] uppercase font-bold tracking-[0.6em] text-secondary border-b border-primary/5 pb-2">Wave Senegal</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Base URL API</label>
                    <input 
                      type="url" 
                      value={paymentSettings.wave_base_url}
                      onChange={e => setPaymentSettings({...paymentSettings, wave_base_url: e.target.value})}
                      className="w-full bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                      placeholder="https://api.wave.com/v1"
                    />
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-[10px] uppercase font-bold tracking-[0.6em] text-secondary border-b border-primary/5 pb-2">Orange Money</h4>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">API Endpoint</label>
                    <input 
                      type="url" 
                      value={paymentSettings.orange_api_url}
                      onChange={e => setPaymentSettings({...paymentSettings, orange_api_url: e.target.value})}
                      className="w-full bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                      placeholder="https://api.orange.com/money/v1"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Merchant Key</label>
                    <input 
                      type="text" 
                      value={paymentSettings.orange_merchant_key}
                      onChange={e => setPaymentSettings({...paymentSettings, orange_merchant_key: e.target.value})}
                      className="w-full bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                      placeholder="votre_cle_marchand"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Access Token / Secret</label>
                    <textarea 
                      rows={3}
                      value={paymentSettings.orange_token}
                      onChange={e => setPaymentSettings({...paymentSettings, orange_token: e.target.value})}
                      className="w-full bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                      placeholder="votre_token_confidentiel"
                    />
                  </div>
               </div>

               <button 
                onClick={handleUpdatePayment}
                className="w-full bg-primary text-white py-6 rounded-full text-xs font-bold uppercase tracking-[0.4em] hover:bg-secondary transition-all shadow-xl"
              >
                Sauvegarder les API Keys
              </button>
            </div>
          </div>
        )}

        {['dashboard', 'products', 'orders', 'affiliates', 'commissions', 'branding', 'payments'].indexOf(activeTab) === -1 && (
          <div className="h-96 flex flex-col items-center justify-center border-4 border-dashed border-primary/5 rounded-[4rem] bg-white shadow-inner">
             <div className="w-20 h-20 bg-accent-soft rounded-full flex items-center justify-center mb-6">
                <PackageCheck className="w-8 h-8 text-secondary animate-pulse" />
             </div>
             <h3 className="text-3xl font-serif font-bold text-primary italic mb-2 tracking-tight">Espace {activeTab}</h3>
             <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-secondary">Synchronisation des données en cours</p>
          </div>
        )}
      </main>

      {/* Add Product Drawer */}
      <AnimatePresence>
        {isAddProductOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductOpen(false)}
              className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-background-warm shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-12">
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-4xl font-serif font-bold text-primary italic">Nouveau Produit</h2>
                  <button onClick={() => setIsAddProductOpen(false)} className="p-3 hover:bg-accent-soft rounded-full transition-colors text-primary">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form className="space-y-8" onSubmit={handleAddProduct}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Nom du produit</label>
                    <input type="text" className="w-full bg-white border border-primary/10 p-5 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-serif text-lg text-primary italic" placeholder="ex: Boubou Prestige Indigo" required value={productName} onChange={e => setProductName(e.target.value)}/>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Prix (FCFA)</label>
                      <input type="number" className="w-full bg-white border border-primary/10 p-5 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans font-bold text-primary" placeholder="65000" required value={productPrice} onChange={e => setProductPrice(e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Catégorie</label>
                      <select className="w-full bg-white border border-primary/10 p-5 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans font-bold text-primary appearance-none" value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                        <option>Femme</option>
                        <option>Homme</option>
                        <option>Accessoires</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Description</label>
                    <textarea rows={4} className="w-full bg-white border border-primary/10 p-5 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans text-sm text-primary/80" placeholder="Décrivez votre création..." required value={productDescription} onChange={e => setProductDescription(e.target.value)} />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">URL du Visuel</label>
                    <input type="url" className="w-full bg-white border border-primary/10 p-5 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans text-sm text-primary/80" placeholder="https://..." value={productImage} onChange={e => setProductImage(e.target.value)} />
                  </div>

                  <div className="flex gap-4 pt-8 text-[10px] font-bold uppercase tracking-widest">
                    <button type="button" onClick={() => setIsAddProductOpen(false)} className="flex-grow py-5 border border-primary/10 rounded-full hover:bg-white transition-all text-primary/40">Annuler</button>
                    <button type="submit" className="flex-grow py-5 bg-secondary text-white rounded-full hover:bg-primary transition-all shadow-lg shadow-secondary/20">Enregistrer</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
