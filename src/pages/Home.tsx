import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setFeaturedProducts((data.products || data.items || []).slice(0, 4));
      } catch (error) {
        console.warn("Failed to fetch featured products", error);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background-warm">
      
      {/* Editorial Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden border-b border-primary/20">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-serif text-primary leading-[0.9] tracking-tight mb-8">
              {settings?.homepageText || "Élégance Intemporelle."}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
              <div>
                 <p className="text-lg md:text-xl font-sans text-text-deep leading-relaxed font-light">
                   Découvrez notre collection exclusive. Chaque pièce est pensée pour sublimer votre allure avec raffinement.
                 </p>
                 <Link to="/products" className="inline-flex items-center gap-3 mt-8 border-b-2 border-primary pb-1 group">
                   <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">Explorer la collection</span>
                   <ArrowRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-2" />
                 </Link>
              </div>
              <div className="hidden md:flex justify-end items-end pb-2">
                 <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-primary/60 writing-vertical-rl rotate-180">
                   Collection {new Date().getFullYear()}
                 </p>
              </div>
            </div>
          </div>
        </div>
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-soft/30 blur-3xl rounded-full -z-10 translate-x-1/2 -translate-y-1/4"></div>
      </section>

      {/* Grid Navigation & Products */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 lg:px-12">
          
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-6">
            <h2 className="text-4xl font-serif text-primary font-light">
              Dernières <span className="italic text-secondary">Créations</span>
            </h2>
            <div className="flex gap-4">
               <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60 border border-primary/20 px-4 py-2 rounded-full">Nouveautés</span>
               <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60 border border-transparent px-4 py-2 rounded-full hover:bg-primary/5 transition-colors cursor-pointer">Best-Sellers</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.length === 0 ? (
              <div className="col-span-full text-center py-24">
                <div className="w-12 h-12 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs uppercase tracking-widest font-bold text-primary/40">Préparation de la présentation...</p>
              </div>
            ) : featuredProducts.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="group relative"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-accent-soft mb-6">
                    <img 
                      src={product.image || `https://images.unsplash.com/photo-${i === 1 ? '1620755100705-d1297e685f0a' : i === 2 ? '1572804013307-f971ad9f7152' : '1523381210434-271e8be1f52b'}?auto=format&fit=crop&q=80&w=800`}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    {i === 0 && (
                       <div className="absolute top-4 right-4 bg-primary text-background-warm px-3 py-1 text-[9px] uppercase tracking-widest font-bold">
                         Avant-première
                       </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-serif text-primary truncate group-hover:text-secondary transition-colors duration-300">{product.name}</h3>
                    <p className="text-sm font-light text-text-deep uppercase tracking-wider">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Banner */}
      <section className="py-20 bg-primary text-background-warm mt-auto">
        <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left divider-x">
           <div className="md:pr-8">
             <Star className="w-6 h-6 text-secondary mb-6 mx-auto md:mx-0 opacity-80" />
             <h4 className="text-sm font-serif mb-3 text-secondary italic">Paiement Local</h4>
             <p className="text-[11px] uppercase tracking-widest font-light text-white/70 leading-relaxed text-balance">
                Réglez vos achats en toute sérénité avec Orange Money ou Wave Sénégal.
             </p>
           </div>
           
           <div className="md:px-8 border-t md:border-t-0 md:border-l border-white/20 pt-12 md:pt-0">
             <Star className="w-6 h-6 text-secondary mb-6 mx-auto md:mx-0 opacity-80" />
             <h4 className="text-sm font-serif mb-3 text-secondary italic">Partenariat Exclusif</h4>
             <p className="text-[11px] uppercase tracking-widest font-light text-white/70 leading-relaxed text-balance">
                Bénéficiez de 10% de commission en recommandant notre maison.
             </p>
             <div className="mt-6 flex justify-center md:justify-start">
               <Link to="/register" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-semibold hover:text-secondary transition-colors border-b border-white/30 pb-1">
                 Devenir affilié
               </Link>
             </div>
           </div>

           <div className="md:pl-8 border-t md:border-t-0 md:border-l border-white/20 pt-12 md:pt-0">
             <Star className="w-6 h-6 text-secondary mb-6 mx-auto md:mx-0 opacity-80" />
             <h4 className="text-sm font-serif mb-3 text-secondary italic">Service Client</h4>
             <p className="text-[11px] uppercase tracking-widest font-light text-white/70 leading-relaxed text-balance">
                Une assistance sur-mesure pour vous accompagner 7j/7.
             </p>
           </div>
        </div>
      </section>
    </div>
  );
}
