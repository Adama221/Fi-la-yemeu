import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import { useCart } from '../contexts/CartContext';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await pb.collection('products').getFullList({
          sort: '-created',
        });
        setProducts(data);
      } catch (error) {
        console.warn("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Set up realtime subscription
    pb.collection('products').subscribe('*', function (e) {
      fetchProducts();
    }).catch(console.warn);

    return () => {
      pb.collection('products').unsubscribe('*').catch(console.warn);
    };
  }, []);


  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: product.image,
      size: 'Unique'
    });
    alert('Produit ajouté au panier !');
  }

  return (
    <div className="py-16 bg-background-warm min-h-screen">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
          <div>
            <p className="text-secondary font-serif italic text-2xl mb-1">Nos Créations</p>
            <h1 className="text-5xl font-serif font-bold uppercase tracking-tight text-primary">Boutique</h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white border border-primary/10 px-6 py-4 rounded-full w-full md:w-auto shadow-sm">
            <Search className="w-4 h-4 text-primary/40" />
            <input 
              type="text" 
              placeholder="RECHERCHER UN STYLE..." 
              className="bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters & Grid */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-32 group">
              <div className="flex items-center gap-2 mb-8 py-4 border-b border-primary/10">
                 <SlidersHorizontal className="w-4 h-4 text-primary" />
                 <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary">Filtres</span>
              </div>
              
              <div className="flex flex-col gap-8">
                <div>
                   <h4 className="text-[10px] uppercase font-bold tracking-widest text-primary/40 mb-4 px-2 italic font-serif">Catégories</h4>
                   <ul className="flex flex-col gap-3">
                     {['Tous', 'Femme', 'Homme', 'Accessoires'].map(cat => (
                        <li key={cat}>
                          <button 
                            onClick={() => setActiveCategory(cat)}
                            className={`text-[10px] uppercase tracking-[0.2em] hover:text-secondary transition-colors px-2 py-1 w-full text-left font-bold ${activeCategory === cat ? 'text-secondary bg-accent-soft rounded-lg' : 'text-primary/60'}`}
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
              <div className="flex justify-center p-20">
                <p className="text-[10px] uppercase font-bold tracking-widest text-primary/40 animate-pulse">Chargement...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
               <div className="bg-white p-16 rounded-[3rem] text-center shadow-sm border border-primary/5">
                 <p className="text-[10px] uppercase font-bold tracking-widest text-primary/40 mb-2">Aucun Résultat</p>
                 <p className="font-serif italic text-primary text-xl">Essayez une autre recherche ou catégorie.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {filteredProducts.map((product) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <Link to={`/product/${product.id}`}>
                      <div className="relative aspect-square overflow-hidden mb-6 bg-accent-soft rounded-[2rem]">
                        <img 
                          src={product.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80'} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4 bg-secondary text-white px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                          Nouveau
                        </div>
                      </div>
                    </Link>
                    <div className="px-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-serif font-bold text-primary leading-tight max-w-[70%]">{product.name}</h3>
                        <p className="font-serif italic text-lg text-secondary">{formatPrice(product.price)}</p>
                      </div>
                      <p className="text-text-deep/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 line-clamp-2">{product.description}</p>
                      <button 
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full bg-white text-primary border border-primary/20 py-4 rounded-full text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-sm uppercase"
                      >
                        <ShoppingBag className="w-3 h-3" /> Ajouter au Panier
                      </button>
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
