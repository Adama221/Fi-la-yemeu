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
      if (!response.ok) throw new Error(`Server status: ${response.status}`);
      const data = await response.json();
      setProducts(data.products || data.items || []);
    } catch (error: any) {
      console.warn("Failed to fetch products", error);
      setError(error.message);
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
    <div className="pt-32 pb-24 bg-background-warm min-h-screen">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Page Header */}
        <div className="mb-20 mt-12">
          <div className="flex flex-col items-center text-center">
             <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-primary/60 mb-4 relative inline-block before:w-12 before:h-[1px] before:bg-primary/20 before:absolute before:right-full before:mr-4 before:top-1/2 after:w-12 after:h-[1px] after:bg-primary/20 after:absolute after:left-full after:ml-4 after:top-1/2">
                Nos Créations
             </p>
             <h1 className="text-5xl md:text-7xl font-serif text-primary leading-none tracking-tight">La Boutique</h1>
          </div>
        </div>

        {/* Filters & Grid */}
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar Filters */}
          <aside className="lg:w-48 xl:w-64 flex-shrink-0">
            <div className="sticky top-32 group">
              <div className="flex items-center gap-3 mb-10 pb-4 border-b border-primary/20">
                 <SlidersHorizontal className="w-4 h-4 text-primary" />
                 <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Filtres</span>
              </div>
              
              <div className="mb-10">
                 <div className="relative">
                   <Search className="w-4 h-4 text-primary/40 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input 
                     type="text" 
                     placeholder="Rechercher..." 
                     className="w-full bg-transparent border border-primary/20 rounded-none px-4 py-3 pl-10 text-xs font-sans placeholder:text-primary/40 focus:outline-none focus:border-primary transition-colors"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                 </div>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                   <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/40 mb-4 px-2">Catégories</h4>
                   <ul className="flex flex-col gap-1">
                     {['Tous', 'Femme', 'Homme', 'Accessoires'].map(cat => (
                        <li key={cat}>
                          <button 
                            onClick={() => setActiveCategory(cat)}
                            className={`text-[11px] uppercase tracking-wider transition-colors px-2 py-2 w-full text-left font-medium ${activeCategory === cat ? 'text-primary bg-primary/5 border-l-2 border-primary' : 'text-primary/60 hover:text-primary'}`}
                          >
                            {cat}
                          </button>
                        </li>
                     ))}
                   </ul>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-6">
                <div className="w-10 h-10 border border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] uppercase font-medium tracking-[0.2em] text-primary/40 animate-pulse">Chargement de la collection...</p>
              </div>
            ) : error ? (
              <div className="border border-red-100 bg-red-50/30 p-16 text-center rounded-[2rem]">
                <p className="font-serif italic text-red-500 text-xl mb-4">Erreur de chargement</p>
                <p className="text-[10px] uppercase font-medium tracking-[0.2em] text-red-400 mb-8">{error}</p>
                <button 
                  onClick={fetchProducts}
                  className="px-10 py-4 bg-primary text-white text-[10px] uppercase font-bold tracking-[0.3em] rounded-full hover:bg-secondary transition-all"
                >
                  Réessayer la connexion
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
               <div className="border border-primary/10 p-16 text-center">
                 <p className="font-serif italic text-primary/60 text-xl mb-4">Aucune création trouvée.</p>
                 <p className="text-[10px] uppercase font-medium tracking-[0.2em] text-primary/40">Veuillez ajuster vos critères de recherche.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {filteredProducts.map((product, i) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex flex-col"
                  >
                    <Link to={`/product/${product.id}`} className="block mb-6 relative overflow-hidden aspect-[3/4] bg-accent-soft">
                      <img 
                        src={product.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80'} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      {product.stock !== undefined && product.stock <= 0 && (
                         <div className="absolute top-0 left-0 w-full h-full bg-primary/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                            <span className="bg-white/90 text-primary px-6 py-2 text-[10px] uppercase font-bold tracking-[0.2em] shadow-xl">Épuisé</span>
                         </div>
                      )}
                    </Link>
                    
                    <div className="flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <Link to={`/product/${product.id}`}>
                           <h3 className="text-lg font-serif text-primary leading-tight hover:text-secondary transition-colors">{product.name}</h3>
                        </Link>
                        <p className="font-sans font-light text-sm text-text-deep uppercase tracking-wider">{formatPrice(product.price)}</p>
                      </div>
                      <p className="font-sans font-light text-xs text-primary/60 line-clamp-1 mb-6 flex-grow">{product.description}</p>
                      
                      {product.stock !== undefined && product.stock <= 0 ? (
                         <div className="w-full bg-primary/5 text-primary/40 py-3 text-[9px] uppercase font-semibold tracking-[0.2em] flex items-center justify-center cursor-not-allowed">
                           Rupture de stock
                         </div>
                      ) : (
                        <button 
                          onClick={(e) => handleAddToCart(product, e)}
                          className="w-full bg-transparent border border-primary/20 text-primary py-3 text-[9px] uppercase font-semibold tracking-[0.2em] hover:bg-primary hover:text-background-warm hover:border-primary transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          Ajouter au Panier
                        </button>
                      )}
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
