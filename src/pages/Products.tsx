import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const { addToCart } = useCart();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        let errMsg = `Server status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error + (errData.hint ? " - " + errData.hint : "");
        } catch(e) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      setProducts(data.products || data.items || []);
    } catch (err: any) {
      console.warn("Failed to fetch products", err);
      const msg = (err.message === 'Failed to fetch' || err.name === 'AbortError')
        ? "Impossible de charger la collection. Le service est momentanément indisponible."
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    // Default undefined to active if we don't know the stock, assuming new system transition
    if (product.stock !== undefined && product.stock <= 0) {
       alert("Ce produit est actuellement en rupture de stock.");
       return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: product.image || '',
      size: 'Unique'
    });
    alert('Produit ajouté au panier !');
  }

  return (
    <div className="pt-24 pb-24 bg-background-warm min-h-screen">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Page Header */}
        <div className="mb-16 mt-8 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-primary/10 pb-8 hover:border-primary/30 transition-colors duration-500">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-medium text-secondary mb-3">
               Collection
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-primary leading-none">La Boutique</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
            <div className="relative group w-full sm:w-auto">
              <Search className="w-4 h-4 text-primary/50 absolute left-0 top-1/2 -translate-y-1/2 group-hover:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full sm:w-64 md:w-64 bg-transparent border-b border-primary/20 rounded-none py-2 pl-8 text-sm font-sans placeholder:text-primary/40 focus:outline-none focus:border-primary transition-all pb-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 text-sm uppercase tracking-widest hover:text-secondary transition-colors pb-2 border-b border-transparent hover:border-secondary w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0">
               <SlidersHorizontal className="w-4 h-4" /> Filtres
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Categories */}
          <aside className="lg:w-48 hidden lg:block flex-shrink-0">
            <div className="sticky top-32">
              <h4 className="text-xs uppercase font-semibold tracking-widest text-primary mb-8 flex items-center gap-2">
                 Catégories
              </h4>
              <ul className="flex flex-col gap-4">
                {['Tous', 'Femme', 'Homme', 'Accessoires'].map(cat => (
                   <li key={cat}>
                     <button 
                       onClick={() => setActiveCategory(cat)}
                       className={`text-sm tracking-wide transition-all duration-300 w-full text-left flex items-center justify-between group ${activeCategory === cat ? 'font-medium text-primary' : 'text-primary/60 hover:text-primary'}`}
                     >
                       {cat}
                       {activeCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-secondary block"></span>}
                     </button>
                   </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            {/* Mobile Categories */}
            <div className="flex overflow-x-auto gap-6 lg:hidden mb-10 pb-4 no-scrollbar border-b border-primary/5">
              {['Tous', 'Femme', 'Homme', 'Accessoires'].map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={`text-xs uppercase tracking-widest whitespace-nowrap px-4 py-2 rounded-full border transition-all ${activeCategory === cat ? 'border-primary bg-primary text-background-warm' : 'border-primary/20 text-primary/70 hover:border-primary'}`}
                 >
                   {cat}
                 </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-32 gap-6">
                <div className="w-8 h-8 border-2 border-primary/10 border-t-secondary rounded-[1px] animate-spin"></div>
                <p className="text-xs uppercase font-medium tracking-[0.2em] text-primary/50">Chargement de la sélection...</p>
              </div>
            ) : error ? (
              <div className="border border-red-100 bg-white p-12 text-center rounded-xl shadow-sm">
                <p className="font-serif italic text-red-800 text-2xl mb-4">Erreur de connexion</p>
                <p className="text-sm font-light text-red-600/80 mb-8 max-w-md mx-auto">{error}</p>
                <button 
                  onClick={fetchProducts}
                  className="px-8 py-3 bg-red-900/5 text-red-900 border border-red-200 text-xs uppercase font-semibold tracking-widest hover:bg-red-900 hover:text-white transition-all"
                >
                  Rafraîchir
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
               <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-primary/20 rounded-lg">
                 <p className="font-serif italic text-primary/60 text-2xl mb-2">Aucune pièce trouvée.</p>
                 <p className="text-sm font-light text-primary/50">L'esthétique recherchée n'est pas disponible pour l'instant.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
                {filteredProducts.map((product, i) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex flex-col"
                  >
                    <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-accent-soft aspect-[3/4] mb-4 group-hover:shadow-xl transition-shadow duration-500">
                      <img 
                        src={product.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80'} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                      />
                      {product.stock !== undefined && product.stock <= 0 && (
                         <div className="absolute inset-0 bg-background-warm/40 backdrop-blur-sm flex items-center justify-center z-10">
                            <span className="bg-primary text-white px-6 py-2.5 text-xs uppercase font-medium tracking-[0.2em]">Épuisé</span>
                         </div>
                      )}
                      
                      {/* Quick Add Overlay */}
                      {product.stock !== undefined && product.stock > 0 && (
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={(e) => handleAddToCart(product, e)}
                            className="w-full bg-white/95 backdrop-blur text-primary py-3.5 text-xs uppercase font-semibold tracking-[0.1em] hover:bg-primary hover:text-white transition-colors duration-300 flex items-center justify-center gap-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]"
                          >
                            Ajouter <ShoppingBag className="w-3.5 h-3.5 mb-[1px]" />
                          </button>
                        </div>
                      )}
                    </Link>
                    
                    <div className="flex flex-col flex-grow px-2 py-3 bg-white/40 backdrop-blur-sm mt-[-10px] relative z-20 rounded-b-sm border-x border-b border-primary/5">
                      <div className="flex justify-between items-center gap-4 mb-2">
                        <Link to={`/product/${product.id}`} className="flex-1">
                           <h3 className="text-lg font-serif text-primary leading-tight group-hover:text-secondary transition-colors line-clamp-1">{product.name}</h3>
                        </Link>
                        <p className="font-sans font-semibold text-[13px] tracking-wider text-primary whitespace-nowrap bg-primary/5 px-2 py-1 rounded-sm">{formatPrice(product.price)}</p>
                      </div>
                      <p className="font-sans font-light text-[13px] text-primary/60 line-clamp-2 flex-grow leading-relaxed">{product.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
