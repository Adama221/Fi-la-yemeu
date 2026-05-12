import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, BadgePercent, LogOut, ChevronRight, TrendingUp, DollarSign, PackageCheck, AlertCircle, Plus, Search, Filter, MoreVertical, X, Palette, Pen, CreditCard, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploader from '../ImageUploader';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [branding, setBranding] = useState({ logo: '', primary_color: '#314227', secondary_color: '#D4A373', text: 'Bienvenue' });
  const [brandingFile, setBrandingFile] = useState<File | null>(null);
  const [paymentSettings, setPaymentSettings] = useState({
    wave_base_url: '',
    orange_api_url: '',
    orange_merchant_key: '',
    orange_token: ''
  });
  const navigate = useNavigate();
  const { profile, isAdmin, logout: handleAuthLogout, loading, user } = useAuth();
   const { updateSettings } = useSettings();
  
  // Product Form state
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Femme');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState('https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=800');
  const [productStock, setProductStock] = useState('0');
  const [productLowStock, setProductLowStock] = useState('5');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{message: string, isError: boolean} | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const showNotification = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 3500);
  };

  const [statsData, setStatsData] = useState({ products: 0, orders: 0, revenue: 0, commissions: 0 });

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    setError(null);

    if (isAdmin) {
      try {
        // Fetch Dashboard Stats
        const dRes = await fetch('/api/admin/dashboard', { headers });
        const dContentType = dRes.headers.get('content-type');
        
        if (!dRes.ok) {
           if (dContentType && dContentType.includes('application/json')) {
              const err = await dRes.json();
              throw new Error(err.error || `Erreur ${dRes.status}`);
           }
           throw new Error(`Stats indisponibles (Erreur ${dRes.status}).`);
        }
        
        if (dContentType && dContentType.includes('application/json')) {
           const dData = await dRes.json();
           setStatsData(dData);
        }

        // Fetch Settings Branding & Payment
        const res = await fetch('/api/settings');
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          const s = data.settings || data;
          setBranding({
             logo: s.logo || '',
             primary_color: s.primary_color || '#314227',
             secondary_color: s.secondary_color || '#D4A373',
             text: s.homepage_text || 'Bienvenue'
          });
        }
        
        const paysRes = await fetch('/api/admin/payment-links', { headers });
        if (paysRes.ok && paysRes.headers.get('content-type')?.includes('application/json')) {
           const paysData = await paysRes.json();
           setPaymentSettings(prev => ({
             ...prev,
             wave_base_url: paysData.wave_link || '',
             orange_api_url: paysData.orange_link || ''
           }));
        }

        // Fetch Orders
        const ordRes = await fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` }});
        if (ordRes.ok && ordRes.headers.get('content-type')?.includes('application/json')) {
          const data = await ordRes.json();
          setOrders(data.orders || []);
        }

        // Fetch Affiliates
        const affRes = await fetch('/api/admin/affiliates', { headers: { 'Authorization': `Bearer ${token}` }});
        if (affRes.ok && affRes.headers.get('content-type')?.includes('application/json')) {
          const data = await affRes.json();
          setAffiliates(data.affiliates || []);
        }

      } catch(e: any) {
        console.warn('Dashboard admin fetch error:', e);
        const msg = (e.message === 'Failed to fetch' || e.name === 'AbortError')
          ? "Connexion perdue avec le serveur. Vérifiez votre accès internet ou patientez un instant."
          : e.message;
        setError("Erreur admin : " + msg);
      }
    }

    // Fetch Products (Public)
    try {
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || data.items || []);
      }
    } catch(e: any) {
      console.warn('Dashboard product fetch error:', e);
      if (!error) {
        const msg = (e.message === 'Failed to fetch' || e.name === 'AbortError')
          ? "Impossible de charger les produits (Erreur Réseau)."
          : e.message;
        setError(msg);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleDeleteProduct = (id: string | number) => {
    setProductToDelete(id);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const res = await fetch(`/api/admin/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });

      if (!res.ok) {
         const text = await res.text();
         throw new Error(`Erreur de suppression: ${res.status} ${text}`);
      }

      showNotification('Produit supprimé !');
      await fetchData();
    } catch (error: any) {
      showNotification("Erreur: " + error.message, true);
      console.error("Erreur: " + error.message);
    } finally {
      setProductToDelete(null);
    }
  };

  const handleUpdateDesign = async () => {
    try {
      const formData = new FormData();
      formData.append('primary_color', branding.primary_color);
      formData.append('secondary_color', branding.secondary_color);
      formData.append('text', branding.text);
      if (brandingFile) {
        formData.append('logo', brandingFile);
      } else {
        formData.append('logo_url', branding.logo);
      }

      const res = await fetch('/api/admin/design', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData
      });
      if (!res.ok) throw new Error("Erreur serveur");
      
      updateSettings({
        primaryColor: branding.primary_color,
        secondaryColor: branding.secondary_color,
        homepageText: branding.text
      });
      
      showNotification('Design modifié avec succès');
    } catch (e: any) {
      console.error(e);
      showNotification('Erreur: ' + e.message, true);
    }
  };

  const handleUpdatePayment = async () => {
    try {
      const data = {
         wave: paymentSettings.wave_base_url,
         orange: paymentSettings.orange_api_url
      };

      const res = await fetch('/api/admin/payment-links', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error("Erreur serveur");

      showNotification('Paramètres de paiement mis à jour');
    } catch (e) {
      console.error(e);
      showNotification('Erreur lors de la mise à jour des paiements', true);
    }
  };

  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [productCommission, setProductCommission] = useState('');

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingProduct) return;
    setIsAddingProduct(true);
    try {
      const formData = new FormData();
      formData.append('name', productName);
      formData.append('price', String(productPrice));
      formData.append('description', productDescription);
      formData.append('category', productCategory);
      formData.append('stock', String(productStock));
      formData.append('low_stock_threshold', String(productLowStock));
      if (productCommission) {
        formData.append('commission', String(productCommission));
      }
      
      if (productImageFiles.length > 0) {
        // Backend only supports upload.single('image') because schema has a single image field
        formData.append('image', productImageFiles[0]);
      } else if (productImage) {
        formData.append('image_url', productImage);
      }

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}/update` : '/api/admin/products';
      const method = 'POST'; // Update also uses POST with /update suffix in server.ts

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData
      });
      if (!res.ok) throw new Error("Erreur");

      setIsAddProductOpen(false);
      setEditingProduct(null);
      showNotification(editingProduct ? 'Produit modifié!' : 'Produit ajouté!');
      setProductName('');
      setProductPrice('');
      setProductDescription('');
      setProductCategory('');
      setProductCommission('');
      setProductImage('');
      setProductImageFiles([]);
      setProductStock('0');
      setProductLowStock('5');
      fetchData();
    } catch (error: any) {
      console.error(error);
      const details = error.response ? JSON.stringify(error.response) : error.message;
      showNotification("Erreur: " + details, true);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setProductName(product.name || '');
    setProductPrice(product.price || '');
    setProductDescription(product.description || '');
    setProductCategory(product.category || '');
    setProductCommission(product.commission || '');
    setProductImage(product.image || '');
    setProductStock(product.stock !== undefined ? String(product.stock) : '0');
    setProductLowStock(product.low_stock_threshold !== undefined ? String(product.low_stock_threshold) : '5');
    setIsAddProductOpen(true);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await handleAuthLogout();
    navigate('/login');
  };

  const handleExport = () => {
    showNotification('Préparation de l\'exportation CSV... Le téléchargement commencera sous peu.');
  };

  const stats = [
    { title: 'Ventes Totales', value: formatPrice(statsData.revenue), icon: <DollarSign className="w-5 h-5 text-green-500" />, trend: 'Global', tab: 'dashboard' },
    { title: 'Commandes', value: statsData.orders.toString(), icon: <ShoppingCart className="w-5 h-5 text-blue-500" />, trend: 'Enregistré', tab: 'orders' },
    { title: 'Affiliés', value: affiliates.length.toString(), icon: <Users className="w-5 h-5 text-purple-500" />, trend: 'Inscrits', tab: 'affiliates' },
    { title: 'Produits', value: statsData.products.toString(), icon: <Package className="w-5 h-5 text-orange-500" />, trend: 'Katalog', tab: 'products' },
  ];

  return (
    <div className="min-h-screen bg-background-warm flex flex-col md:flex-row font-sans w-full overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-primary text-background-warm flex flex-col pt-8 md:pt-12 md:shadow-2xl z-10 flex-shrink-0">
        <div className="px-6 md:px-10 mb-8 md:mb-16">
           <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white mb-1">Console</h2>
           <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold">SAMA BUTIK ADMIN</p>
        </div>

        <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible px-4 md:px-6 md:space-y-3 pb-4 md:pb-0 gap-2 md:gap-0 no-scrollbar">
          <button 
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex-shrink-0 w-auto md:w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-2 md:gap-4"><LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span></div>
             <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${activeTab === 'dashboard' ? 'rotate-90' : 'opacity-20'}`} />
          </button>
          
          <button 
            id="tab-products"
            onClick={() => setActiveTab('products')}
            className={`flex-shrink-0 w-auto md:w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-2 md:gap-4"><Package className="w-4 h-4" /> <span className="hidden sm:inline">Produits</span></div>
             <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${activeTab === 'products' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            id="tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`flex-shrink-0 w-auto md:w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-2 md:gap-4"><ShoppingCart className="w-4 h-4" /> <span className="hidden sm:inline">Commandes</span></div>
             <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${activeTab === 'orders' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            id="tab-affiliates"
            onClick={() => setActiveTab('affiliates')}
            className={`flex-shrink-0 w-auto md:w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'affiliates' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-2 md:gap-4"><Users className="w-4 h-4" /> <span className="hidden sm:inline">Affiliés</span></div>
             <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${activeTab === 'affiliates' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            id="tab-commissions"
            onClick={() => setActiveTab('commissions')}
            className={`flex-shrink-0 w-auto md:w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'commissions' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-2 md:gap-4"><BadgePercent className="w-4 h-4" /> <span className="hidden sm:inline">Commissions</span></div>
             <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${activeTab === 'commissions' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            id="tab-branding"
            onClick={() => setActiveTab('branding')}
            className={`flex-shrink-0 w-auto md:w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'branding' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-2 md:gap-4"><Palette className="w-4 h-4" /> <span className="hidden sm:inline">Design</span></div>
             <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${activeTab === 'branding' ? 'rotate-90' : 'opacity-20'}`} />
          </button>

          <button 
            id="tab-payments"
            onClick={() => setActiveTab('payments')}
            className={`flex-shrink-0 w-auto md:w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
             <div className="flex items-center gap-2 md:gap-4"><CreditCard className="w-4 h-4" /> <span className="hidden sm:inline">Paiements</span></div>
             <ChevronRight className={`hidden md:block w-4 h-4 transition-transform ${activeTab === 'payments' ? 'rotate-90' : 'opacity-20'}`} />
          </button>
        </nav>

        <div className="hidden md:block p-8 mt-auto border-t border-white/5">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-4 px-6 py-4 text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
           >
             <LogOut className="w-4 h-4" /> Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-16 overflow-y-auto w-full">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 md:mb-16 gap-6">
           <div className="space-y-2 md:space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-secondary rounded-full flex items-center justify-center text-white text-md font-bold font-serif italic">{profile?.full_name?.[0] || 'U'}</div>
                 <p className="text-[10px] text-primary font-bold uppercase tracking-[0.4em]">Bienvenue, {profile?.full_name || 'Utilisateur'}</p>
                 <button onClick={handleLogout} className="md:hidden ml-auto text-primary/40"><LogOut className="w-4 h-4"/></button>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight text-primary italic break-words">
                {activeTab === 'dashboard' ? 'Vue d\'ensemble' : activeTab === 'payments' ? 'Paiements' : activeTab === 'branding' ? 'Design' : activeTab}
              </h1>
           </div>
           <div className="flex flex-wrap gap-4 w-full xl:w-auto">
              {error && (
                <button 
                  onClick={fetchData}
                  className="bg-red-50 text-red-500 border border-red-200 px-6 py-3 md:px-8 md:py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
                >
                  <AlertCircle className="w-4 h-4" /> Réessayer
                </button>
              )}
              <button 
                onClick={handleExport}
                className="bg-white border border-primary/10 px-6 py-3 md:px-8 md:py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all shadow-sm flex-grow sm:flex-grow-0 text-center"
              >
                Exporter
              </button>
              <button 
                onClick={() => setIsAddProductOpen(true)}
                className="bg-primary text-white px-6 py-3 md:px-8 md:py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all shadow-lg flex-grow sm:flex-grow-0 text-center whitespace-nowrap"
              >
                + Nouveau Produit
              </button>
           </div>
        </header>

        {products.filter(p => p.stock !== undefined && p.stock <= (p.low_stock_threshold || 5)).length > 0 && (
          <div className="mb-12 bg-red-50 border border-red-100 p-8 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 bg-red-100 rounded-full flex flex-shrink-0 items-center justify-center text-red-500">
                  <AlertCircle className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-xl font-serif text-red-800 font-bold mb-1">Alerte Stock Faible</h4>
                  <p className="text-sm font-sans text-red-600/80">
                    Vous avez {products.filter(p => p.stock !== undefined && p.stock <= (p.low_stock_threshold || 5)).length} produit(s) en rupture ou proche de la rupture de stock.
                  </p>
               </div>
            </div>
            <button 
              onClick={() => setActiveTab('products')}
              className="bg-red-500 text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
            >
              Voir le stock
            </button>
          </div>
        )}

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
                    onClick={() => setActiveTab(stat.tab)}
                    className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-primary/5 group hover:scale-105 transition-all duration-500 flex flex-col justify-between min-h-[180px] cursor-pointer"
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-12 h-12 bg-accent-soft rounded-2xl flex items-center justify-center group-hover:bg-secondary transition-colors duration-500 group-hover:text-white shadow-sm shrink-0">{stat.icon}</div>
                       <span className={`text-[9px] font-bold px-3 py-1.5 bg-accent-soft/30 rounded-full text-secondary tracking-widest uppercase`}>
                         {stat.trend}
                       </span>
                    </div>
                    <div className="mt-auto">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-primary/40 mb-1">{stat.title}</p>
                      <h3 className="text-3xl sm:text-4xl font-serif font-bold text-primary italic truncate">{stat.value}</h3>
                    </div>
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
                    <th className="px-10 py-6 text-center">Commission</th>
                    <th className="px-10 py-6 text-center">Stock</th>
                    <th className="px-10 py-6">Prix</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-10 py-6 text-center text-primary/40 italic">Aucun produit trouvé</td>
                    </tr>
                  ) : products.map((item, i) => (
                    <tr key={item.id} className="border-b border-primary/5 hover:bg-accent-soft/10 transition-colors">
                      <td className="px-10 py-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-soft rounded-xl overflow-hidden shadow-sm">
                          <img src={item.image || `https://images.unsplash.com/photo-${1549439602 + i}?auto=format&fit=crop&q=80&w=100`} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="font-bold text-primary font-serif italic text-base">{item.name}</p>
                          <p className="text-[10px] text-primary/40 font-bold tracking-widest uppercase">ID: #{String(item.id).slice(0,8)}</p>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="uppercase text-[9px] font-bold tracking-widest text-primary/60">{item.category}</span>
                      </td>
                      <td className="px-10 py-6 text-center font-bold text-primary">
                        {item.commission ? <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full">{item.commission}%</span> : <span className="text-primary/40">-</span>}
                      </td>
                      <td className="px-10 py-6 text-center">
                        <div className="flex flex-col items-center">
                           <span className={`text-base font-bold ${item.stock <= (item.low_stock_threshold || 5) ? 'text-red-500' : 'text-primary'}`}>
                             {item.stock || 0}
                           </span>
                           {item.stock <= (item.low_stock_threshold || 5) && (
                             <span className="text-[8px] uppercase tracking-widest text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                               <AlertCircle className="w-2 h-2" /> Faible
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-10 py-6 font-serif italic text-lg text-secondary font-bold">{formatPrice(item.price)}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-3 bg-white border border-primary/5 hover:bg-secondary hover:text-white rounded-2xl transition-all duration-300 shadow-sm text-primary/60 group"
                            title="Modifier"
                          >
                             <Pen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(item.id)}
                            className="p-3 bg-white border border-primary/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-300 shadow-sm text-red-400 group"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
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
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Gestion des Commandes</h4>
              <button 
                onClick={fetchData}
                className="bg-white px-6 py-2 rounded-full border border-primary/5 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-white transition-all shadow-sm"
              >
                Actualiser
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                   <tr className="text-[10px] font-bold uppercase tracking-widest text-primary/40 border-b border-primary/5">
                     <th className="px-10 py-6">Client</th>
                     <th className="px-10 py-6">Produits</th>
                     <th className="px-10 py-6">Status</th>
                     <th className="px-10 py-6">Montant</th>
                     <th className="px-10 py-6">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="text-xs">
                   {orders.map((order) => (
                     <tr key={order.id} className="border-b border-primary/5 hover:bg-accent-soft/10 transition-colors">
                       <td className="px-10 py-6">
                          <p className="font-bold text-primary font-serif italic text-base">{order.customer?.prenom} {order.customer?.nom}</p>
                          <p className="text-[10px] text-primary/40 font-bold tracking-widest uppercase">{order.customer?.adresse}</p>
                          <p className="text-[9px] text-secondary font-bold">{order.customer?.telephone}</p>
                       </td>
                       <td className="px-10 py-6">
                          {order.items?.map((i: any) => (
                            <p key={i.id} className="text-[10px] uppercase font-bold tracking-widest text-primary/60">{i.quantity}x {i.name}</p>
                          ))}
                       </td>
                       <td className="px-10 py-6">
                          <select 
                            value={order.status}
                            onChange={async (e) => {
                               const newStatus = e.target.value;
                               try {
                                 await fetch('/api/admin/orders/delivery', {
                                   method: 'POST',
                                   headers: { 
                                     'Content-Type': 'application/json',
                                     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                                   },
                                   body: JSON.stringify({ order_id: order.id, status: newStatus })
                                 });
                                 fetchData();
                               } catch(err) { alert('Erreur'); }
                            }}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest outline-none border-none bg-accent-soft/30 cursor-pointer ${order.status === 'VÉRIFICATION' ? 'text-secondary' : order.status === 'Livré' ? 'text-green-600' : 'text-primary'}`}
                          >
                            <option value="VÉRIFICATION">VÉRIFICATION</option>
                            <option value="Payé">Payé</option>
                            <option value="Livré">Livré</option>
                            <option value="Annulé">Annulé</option>
                          </select>
                       </td>
                       <td className="px-10 py-6 font-serif italic text-lg text-primary font-bold">{formatPrice(order.total || 0)}</td>
                       <td className="px-10 py-6 text-right">
                          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">
                            {new Date(order.created_at || Date.now()).toLocaleDateString()}
                          </p>
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
                    {affiliates.length > 0 ? affiliates.map((aff) => (
              <div key={aff.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-primary/5 flex items-center gap-8 group hover:scale-[1.02] transition-all">
                <div className="w-24 h-24 bg-accent-soft rounded-[2rem] flex items-center justify-center text-3xl font-serif font-bold text-secondary italic shadow-inner">
                  {aff?.email ? aff.email[0].toUpperCase() : 'A'}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-serif font-bold text-primary italic">Affilié: {aff?.email || String(aff.id).slice(0,6)}</h4>
                    <span className={`text-[10px] font-bold ${aff.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} px-3 py-1 rounded-full uppercase tracking-widest`}>{aff.status || 'Actif'}</span>
                  </div>
                  <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest mb-6">Code: {aff.code}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent-soft/30 p-4 rounded-2xl">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-primary/40 mb-1">Ventes</p>
                      <p className="text-lg font-serif font-bold text-primary italic">{aff.sales_count || 0}</p>
                    </div>
                    <div className="bg-accent-soft/30 p-4 rounded-2xl">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-primary/40 mb-1">Gain Total</p>
                      <p className="text-lg font-serif font-bold text-secondary italic">{formatPrice(aff.balance || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
               <div className="col-span-1 md:col-span-2 text-center text-primary/40 padding-10 italic">Aucun affilié.</div>
            )}
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
                      <h4 className="text-4xl font-serif font-bold">{formatPrice(affiliates.reduce((sum, a) => sum + (a.balance || 0), 0))}</h4>
                      <button className="w-full bg-secondary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all">Générer Paiements Wave</button>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Total Payé (Général)</p>
                      <h4 className="text-4xl font-serif font-bold">{formatPrice(0)}</h4>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Affilié du Mois</p>
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                         <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-sm font-bold uppercase">{affiliates[0]?.email?.[0] || '?'}</div>
                         <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[100px]">{affiliates[0]?.email || 'Aucun'}</p>
                            <p className="text-[9px] text-white/40 italic">Balance: {formatPrice(affiliates[0]?.balance || 0)}</p>
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
                <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Logo (Image)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                       setBrandingFile(e.target.files[0]);
                    }
                  }}
                  className="w-full bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Couleur Primaire</label>
                <div className="flex gap-6 items-center">
                  <input 
                    type="color" 
                    value={branding.primary_color}
                    onChange={e => {
                       const val = e.target.value;
                       setBranding({...branding, primary_color: val});
                       updateSettings({ primaryColor: val });
                    }}
                    className="w-20 h-20 rounded-2xl border-none outline-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={branding.primary_color}
                    onChange={e => {
                       const val = e.target.value;
                       setBranding({...branding, primary_color: val});
                       if (val.length === 7 && val.startsWith('#')) {
                         updateSettings({ primaryColor: val });
                       }
                    }}
                    className="flex-grow bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Couleur Secondaire</label>
                <div className="flex gap-6 items-center">
                  <input 
                    type="color" 
                    value={branding.secondary_color}
                    onChange={e => {
                       const val = e.target.value;
                       setBranding({...branding, secondary_color: val});
                       updateSettings({ secondaryColor: val });
                    }}
                    className="w-20 h-20 rounded-2xl border-none outline-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={branding.secondary_color}
                    onChange={e => {
                       const val = e.target.value;
                       setBranding({...branding, secondary_color: val});
                       if (val.length === 7 && val.startsWith('#')) {
                         updateSettings({ secondaryColor: val });
                       }
                    }}
                    className="flex-grow bg-accent-soft/30 border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-all rounded-2xl"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary/40">Texte Page d'Accueil</label>
                <textarea 
                  value={branding.text}
                  onChange={e => {
                    const val = e.target.value;
                    setBranding({...branding, text: val});
                    updateSettings({ homepageText: val });
                  }}
                  className="w-full h-32 bg-accent-soft/30 border border-primary/10 p-5 text-sm font-sans outline-none focus:border-secondary transition-all rounded-2xl"
                  placeholder="Texte de la page d'accueil..."
                />
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
              <div className="p-6 sm:p-10 md:p-12">
                <div className="flex justify-between items-center mb-8 md:mb-12">
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary italic">{editingProduct ? 'Modifier Produit' : 'Nouveau Produit'}</h2>
                  <button onClick={() => { setIsAddProductOpen(false); setEditingProduct(null); }} className="p-2 md:p-3 hover:bg-accent-soft rounded-full transition-colors text-primary">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form className="space-y-8" onSubmit={handleAddProduct}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Nom du produit</label>
                    <input type="text" className="w-full bg-white border border-primary/10 p-5 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-serif text-lg text-primary italic" placeholder="ex: Boubou Prestige Indigo" required value={productName} onChange={e => setProductName(e.target.value)}/>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Prix (FCFA)</label>
                      <input type="number" className="w-full bg-white border border-primary/10 p-4 font-sans font-bold text-primary" placeholder="65000" required value={productPrice} onChange={e => setProductPrice(e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Commission Affilié (%)</label>
                      <input type="number" className="w-full bg-white border border-primary/10 p-4 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans font-bold text-primary" placeholder="10" value={productCommission} onChange={e => setProductCommission(e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Stock Disponible</label>
                      <input type="number" className="w-full bg-white border border-primary/10 p-4 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans font-bold text-primary" placeholder="0" required value={productStock} onChange={e => setProductStock(e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Seuil Alerte (Low Stock)</label>
                      <input type="number" className="w-full bg-white border border-primary/10 p-4 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans font-bold text-primary" placeholder="5" required value={productLowStock} onChange={e => setProductLowStock(e.target.value)}/>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
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
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Visuel Produit</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="w-full bg-white border border-primary/10 p-5 rounded-2xl focus:ring-2 focus:ring-secondary/20 outline-none font-sans text-sm text-primary/80" 
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                           setProductImageFiles([e.target.files[0]]);
                        } else {
                           setProductImageFiles([]);
                        }
                      }} 
                    />
                    {productImageFiles.length > 0 && (
                      <p className="text-xs text-primary/60">Image sélectionnée</p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-8 text-[10px] font-bold uppercase tracking-widest">
                    <button type="button" onClick={() => setIsAddProductOpen(false)} className="flex-grow py-5 border border-primary/10 rounded-full hover:bg-white transition-all text-primary/40">Annuler</button>
                    <button type="submit" disabled={isAddingProduct} className="flex-grow py-5 bg-secondary text-white rounded-full hover:bg-primary transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isAddingProduct ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <>
            <div 
              className="fixed inset-0 bg-background-warm/80 backdrop-blur-sm z-[60]"
              onClick={() => setProductToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 z-[70] text-center"
            >
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-6 opacity-80" />
              <h3 className="text-xl font-serif italic text-primary/80 mb-2">Confirmation de suppression</h3>
              <p className="text-sm text-primary/60 mb-8">Êtes-vous sûr de vouloir supprimer ce produit définitivement ?</p>
              <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-4 bg-background-warm border-primary/5 rounded-2xl text-primary/60 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDeleteProduct}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <div 
              className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[80]"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 z-[90] text-center"
            >
              <LogOut className="w-12 h-12 text-secondary mx-auto mb-6 opacity-80" />
              <h3 className="text-xl font-serif italic text-primary/80 mb-2">Se déconnecter ?</h3>
              <p className="text-sm text-primary/60 mb-8">Êtes-vous sûr de vouloir quitter votre session administrateur ?</p>
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

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full shadow-2xl z-[100] text-sm font-bold tracking-wide flex items-center gap-3 ${
              notification.isError ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-primary text-secondary shadow-primary/30'
            }`}
          >
            {notification.isError ? <AlertCircle className="w-5 h-5" /> : <PackageCheck className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
