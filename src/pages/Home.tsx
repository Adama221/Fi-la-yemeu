import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  const fetchFeatured = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products');
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          throw new Error(errData.error || `Erreur ${response.status}`);
        } else {
          throw new Error("Le serveur API n'a pas répondu correctement. Vérifiez votre déploiement Hostinger.");
        }
      }

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Réponse API invalide : Reçu du HTML au lieu de JSON. Le Reverse Proxy est mal configuré.");
      }

      const data = await response.json();
      setFeaturedProducts((data.products || data.items || []).slice(0, 4));
    } catch (error: any) {
      console.warn("Failed to fetch featured products", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatic fetching disabled at user request to avoid loading issues.
    // fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background-warm selection:bg-secondary/20">
      
      {/* Editorial Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden border-b border-primary/10">
        <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-12">
          <div className="max-w-4xl relative">
            <p className="text-xs uppercase tracking-[0.3em] font-medium text-secondary mb-6 pl-1 animate-fade-in-up">
               Maison de Couture
            </p>
            <h1 id="home-title" className="text-5xl sm:text-6xl md:text-8xl lg:text-[8rem] font-serif text-primary leading-[0.85] tracking-tight mb-6 md:mb-8">
              {settings?.homepageText || "Boubous Modernes\n& Élégance."}
            </h1>
          </div>
          
          <div className="max-w-sm md:text-right flex flex-col md:items-end w-full">
             <p id="home-description" className="text-base md:text-lg font-sans text-primary/70 leading-relaxed font-light text-balance mb-8">
               Découvrez notre collection exclusive de boubous modernes et tenues tendance. Chaque pièce est pensée pour sublimer votre allure avec raffinement.
             </p>
             <Link to="/products" className="inline-flex items-center gap-3 border-b border-primary/30 pb-2 group hover:border-primary transition-colors">
               <span className="text-xs uppercase tracking-[0.2em] font-medium text-primary group-hover:text-secondary transition-colors">Explorer la collection</span>
               <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 group-hover:text-secondary transition-all" />
             </Link>
          </div>
        </div>
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-secondary/5 blur-[100px] rounded-full -z-10 translate-x-1/4 -translate-y-1/4"></div>
      </section>

      {/* Grid Navigation & Products */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 lg:px-12">
          
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-primary tracking-tight">
              Dernières <span className="italic text-secondary">Créations</span>
            </h2>
            <div className="flex gap-6 border-b border-primary/10 pb-2 w-full md:w-auto">
               <span className="text-xs uppercase tracking-widest font-semibold text-primary/90 border-b-2 border-primary pb-2 -mb-[3px] cursor-pointer">Nouveautés</span>
               <span className="text-xs uppercase tracking-widest font-medium text-primary/40 hover:text-primary transition-colors cursor-pointer pb-2">Best-Sellers</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-16">
            {error ? (
              <div className="col-span-full border border-red-100 bg-white p-12 rounded-xl text-center shadow-sm">
                <p className="text-red-800 font-serif italic text-2xl mb-4">Erreur de connexion</p>
                <p className="text-sm text-red-600/80 mb-8">{error}</p>
                <button 
                   onClick={fetchFeatured}
                   className="px-8 py-3 bg-red-900/5 text-red-900 border border-red-200 text-xs uppercase font-semibold tracking-widest hover:bg-red-900 hover:text-white transition-all"
                >
                  Réessayer
                </button>
              </div>
            ) : loading ? (
              <div className="col-span-full text-center py-32 flex flex-col justify-center items-center">
                <div className="w-8 h-8 border-2 border-primary/10 border-t-secondary rounded-[1px] animate-spin mb-6"></div>
                <p className="text-xs uppercase tracking-widest font-medium text-primary/40">Préparation de la présentation...</p>
              </div>
            ) : featuredProducts.length === 0 ? (
               <div className="col-span-full text-center py-20">
                  <p className="text-xs uppercase tracking-widest font-medium text-primary/40 italic">La vitrine est en cours de mise à jour...</p>
               </div>
            ) : featuredProducts.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col"
              >
                <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-accent-soft aspect-[3/4] mb-4">
                  <img 
                    src={product.image || `https://images.unsplash.com/photo-${i === 1 ? '1620755100705-d1297e685f0a' : i === 2 ? '1572804013307-f971ad9f7152' : '1523381210434-271e8be1f52b'}?auto=format&fit=crop&q=80&w=800`}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                  />
                  {product.stock !== undefined && product.stock <= 0 && (
                     <div className="absolute inset-0 bg-background-warm/40 backdrop-blur-sm flex items-center justify-center z-10">
                        <span className="bg-primary text-white px-6 py-2.5 text-xs uppercase font-medium tracking-[0.2em]">Épuisé</span>
                     </div>
                  )}
                  {i === 0 && product.stock > 0 && (
                     <div className="absolute top-4 right-4 bg-primary text-white px-4 py-1.5 text-[9px] uppercase tracking-widest font-medium shadow-sm">
                       Avant-première
                     </div>
                  )}
                </Link>
                
                <div className="flex flex-col px-2 py-3 bg-white/40 backdrop-blur-sm mt-[-10px] relative z-20 rounded-b-sm border-x border-b border-primary/5">
                   <div className="flex justify-between items-center gap-4 mb-2">
                      <Link to={`/product/${product.id}`} className="flex-1">
                         <h3 className="text-lg font-serif text-primary leading-tight hover:text-secondary transition-colors line-clamp-1">{product.name}</h3>
                      </Link>
                      <p className="font-sans font-semibold text-[13px] tracking-wider text-primary whitespace-nowrap bg-primary/5 px-2 py-1 rounded-sm">{formatPrice(product.price)}</p>
                   </div>
                   <p className="font-sans font-light text-[13px] text-primary/60 line-clamp-1">Collection Actuelle</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-20 text-center">
             <Link to="/products" className="inline-flex items-center justify-center px-10 py-4 bg-primary text-white text-xs uppercase font-medium tracking-[0.2em] hover:bg-secondary transition-colors duration-500">
               Voir tout le catalogue
             </Link>
          </div>
        </div>
      </section>

      {/* Service Banner */}
      <section className="py-24 bg-primary text-background-warm mt-auto border-t border-primary-light/10">
        <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-16 text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-white/10">
           <div className="md:pr-12 pt-8 md:pt-0">
             <Star className="w-5 h-5 text-secondary mb-6 mx-auto md:mx-0 opacity-90" />
             <h4 className="text-base font-serif mb-3 text-secondary italic">Paiement Mobile</h4>
             <p className="text-xs uppercase tracking-[0.1em] font-light text-white/50 leading-relaxed text-balance">
                Réglez vos achats en toute sérénité avec Orange Money ou Wave Sénégal.
             </p>
           </div>
           
           <div className="md:px-12 pt-8 md:pt-0">
             <Star className="w-5 h-5 text-secondary mb-6 mx-auto md:mx-0 opacity-90" />
             <h4 className="text-base font-serif mb-3 text-secondary italic">Partenariat Exclusif</h4>
             <p className="text-xs uppercase tracking-[0.1em] font-light text-white/50 leading-relaxed text-balance">
                Bénéficiez de 10% de commission en recommandant notre maison.
             </p>
             <div className="mt-6 flex justify-center md:justify-start">
               <Link to="/register" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-medium text-white/80 hover:text-secondary transition-colors border-b border-white/20 hover:border-secondary pb-1">
                 Devenir affilié
               </Link>
             </div>
           </div>

           <div className="md:pl-12 pt-8 md:pt-0">
             <Star className="w-5 h-5 text-secondary mb-6 mx-auto md:mx-0 opacity-90" />
             <h4 className="text-base font-serif mb-3 text-secondary italic">Service Client</h4>
             <p className="text-xs uppercase tracking-[0.1em] font-light text-white/50 leading-relaxed text-balance">
                Une assistance sur-mesure pour vous accompagner 7j/7 via WhatsApp.
             </p>
           </div>
        </div>
      </section>
    </div>
  );
}
