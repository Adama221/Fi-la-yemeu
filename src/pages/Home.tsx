import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import { formatPrice } from '../lib/utils';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await pb.collection('products').getList(1, 3, {
          sort: '-created',
        });
        setFeaturedProducts(data.items);
      } catch (error) {
        console.warn("Failed to fetch featured products", error);
      }
    };

    fetchFeatured();
  }, []);


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] bg-background-warm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-12 lg:col-span-5 bg-primary text-background-warm p-8 md:p-24 flex flex-col justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-secondary font-serif italic text-2xl mb-8 block">Roots & Couture</span>
            <h2 className="text-6xl md:text-8xl font-serif font-bold leading-[0.9] mb-10 uppercase tracking-tighter">
              Éclat <br/>Naturel
            </h2>
            <p className="text-lg opacity-90 max-w-md mb-12 leading-relaxed font-light">
              Plongez dans l'essence de la Terre avec notre nouvelle collection Signature. Des textures vibrantes et des teintes naturelles inspirées de l'héritage africain.
            </p>
            <div className="flex flex-wrap items-center gap-8">
              <Link to="/products" className="bg-secondary text-white px-12 py-5 rounded-full text-sm font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-primary transition-all duration-500 shadow-2xl transform hover:-translate-y-1">
                Explorer la Boutique
              </Link>
              <Link to="/products" className="text-xs uppercase tracking-[0.3em] font-bold border-b border-white/30 pb-1 hover:border-secondary transition-all">Le Lookbook</Link>
            </div>
          </motion.div>
        </div>
        
        <div className="hidden lg:block lg:col-span-7 relative h-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000" 
            alt="African Fashion Couture"
            className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[2000ms]"
          />
          <div className="absolute inset-0 bg-primary/20" />
        </div>
        
        {/* Mobile Image */}
        <div className="lg:hidden h-[60vh] relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000" 
            alt="African Fashion"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Categories / Featured */}
      <section className="py-24 bg-background-warm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-4">
            <div>
              <p className="text-secondary font-serif italic text-2xl mb-2">Sélection Exclusive</p>
              <h2 className="text-4xl md:text-5xl font-serif font-bold uppercase tracking-tight text-primary">Incontournables</h2>
            </div>
            <Link to="/products" className="mt-4 md:mt-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-secondary transition-colors">
              Découvrir toute la collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {featuredProducts.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-primary/40 font-bold uppercase tracking-widest text-[10px]">
                Chargement des nouveautés...
              </div>
            ) : featuredProducts.map((product, i) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -10 }}
                className="group cursor-pointer p-6 hover:bg-accent-soft transition-colors rounded-[2.5rem]"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden mb-8 rounded-[2rem] shadow-sm">
                    <img 
                      src={product.image || `https://images.unsplash.com/photo-${i === 1 ? '1620755100705-d1297e685f0a' : i === 2 ? '1572804013307-f971ad9f7152' : '1523381210434-271e8be1f52b'}?auto=format&fit=crop&q=80&w=800`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm text-primary">
                        {i === 0 ? 'Nouveau' : 'Populaire'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-primary mb-1">{product.name}</h3>
                      <p className="text-xs text-text-deep/60 uppercase tracking-widest font-medium">{product.category}</p>
                    </div>
                    <p className="font-serif italic text-xl text-secondary">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Strip (Orange/Wave info) */}
      <section className="py-12 bg-white border-y border-primary/10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-background-warm rounded-[2rem] p-8 border border-primary/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-2 text-center md:text-left">Paiement Sécurisé</h4>
                <p className="text-[11px] text-text-deep/60 text-center md:text-left">Payez instantanément via vos opérateurs locaux.</p>
              </div>
              <div className="flex gap-3">
                 <div className="h-10 w-24 bg-[#FF7900] rounded-xl flex items-center justify-center px-4">
                   <span className="text-white font-bold text-[10px] uppercase italic tracking-tighter">Orange Money</span>
                 </div>
                 <div className="h-10 w-24 bg-[#1DA1F2] rounded-xl flex items-center justify-center px-4">
                   <span className="text-white font-black text-xs italic">Wave</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-accent-soft rounded-[2rem] p-8 border border-primary/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2 text-center md:text-left">Rejoignez l'élite</h4>
                <p className="text-[11px] text-text-deep/80 text-center md:text-left">Gagnez <span className="font-bold">10% de commission</span> sur chaque vente parrainée.</p>
              </div>
              <button className="border border-primary text-primary px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all whitespace-nowrap">
                Devenir Affilié
              </button>
           </div>
        </div>
      </section>
    </div>
  );
}
