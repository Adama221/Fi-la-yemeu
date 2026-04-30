import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

import { pb } from '../lib/pocketbase';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const prodData = await pb.collection('products').getList(1, 4, { sort: '-created' });
        setFeaturedProducts(prodData.items || []);
      } catch (error) {
        console.warn("Failed to fetch featured products", error);
      }
    };

    fetchFeatured();
    
    pb.collection('products').subscribe('*', function (e) {
      if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
         fetchFeatured();
      }
    });

    return () => {
      pb.collection('products').unsubscribe('*');
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background-warm pt-32 pb-16">
      <div className="container mx-auto px-4">
        {/* Simple Minimal Header */}
        <div className="flex justify-between items-end mb-12 border-b border-primary/10 pb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold uppercase tracking-widest text-primary">
              {settings?.homepageText || "Boutique"}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40 mt-2">
              Découvrez la collection
            </p>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary bg-secondary/10 px-4 py-2 rounded-full">
              Nouveautés
            </span>
          </div>
        </div>

        {/* Product Grid directly on Home */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-20">
          {featuredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-primary/40 font-bold uppercase tracking-widest text-[10px]">
              Chargement des produits...
            </div>
          ) : featuredProducts.map((product, i) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -10 }}
              className="group cursor-pointer p-0"
            >
              <Link to={`/product/${product.id}`}>
                <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-accent-soft rounded-[2rem] shadow-sm">
                  <img 
                    src={product.image_file ? pb.files.getURL(product, product.image_file) : (product.image || `https://images.unsplash.com/photo-${i === 1 ? '1620755100705-d1297e685f0a' : i === 2 ? '1572804013307-f971ad9f7152' : '1523381210434-271e8be1f52b'}?auto=format&fit=crop&q=80&w=800`)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm text-primary">
                    {i === 0 ? 'Nouveau' : 'Prestige'}
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-xl font-serif font-bold text-primary mb-1 truncate">{product.name}</h3>
                  <p className="font-serif italic text-lg text-secondary mb-3">{formatPrice(product.price)}</p>
                  <p className="text-xs text-text-deep/50 uppercase tracking-widest font-medium line-clamp-1">{product.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

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
              <Link to="/register" className="border border-primary text-primary px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all whitespace-nowrap inline-block text-center">
                Devenir Affilié
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
