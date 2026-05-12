import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useState, useEffect } from 'react';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const response = await fetch(`/api/products/${id}`);
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            throw new Error(errData.error || 'Not found');
          } else {
            throw new Error('Le serveur API est mal configuré (Reçu du HTML au lieu de JSON).');
          }
        }

        if (!contentType || !contentType.includes('application/json')) {
           throw new Error("Réponse API invalide : Reçu du HTML au lieu de JSON.");
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);


  if (loading) {
     return <div className="py-40 flex justify-center text-primary font-serif italic text-xl">Préparation de la présentation...</div>;
  }

  if (!product) {
     return <div className="py-40 flex justify-center text-primary font-serif italic text-xl">Création non trouvée.</div>;
  }

  const handleAddToCart = () => {
    if (product.stock !== undefined && product.stock <= 0) {
       alert("Ce produit est actuellement en rupture de stock.");
       return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: product.image,
      size: 'Unique'
    });
    alert('Création ajoutée au panier');
  };

  return (
    <div className="pt-32 pb-24 bg-background-warm min-h-screen">
      <div className="container mx-auto px-6 lg:px-12">
        <Link to="/products" className="inline-flex items-center gap-3 text-[10px] uppercase font-semibold tracking-[0.2em] mb-16 hover:text-secondary transition-colors text-primary/60">
          <ChevronLeft className="w-4 h-4" /> Retour à la collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Image Gallery */}
          <div className="flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="aspect-[3/4] bg-accent-soft relative overflow-hidden"
            >
              <img 
                src={product.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=1200'} 
                alt={product.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
            </motion.div>

          </div>

          {/* Content */}
          <div className="flex flex-col pt-8 lg:pt-16">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-primary/60 mb-6 font-sans">{product.category || 'Collection Exclusive'}</span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif text-primary leading-tight tracking-tight mb-4 md:mb-6">{product.name}</h1>
            <p className="text-xl sm:text-2xl font-sans font-light text-text-deep uppercase tracking-wider mb-8 md:mb-12">{formatPrice(product.price)}</p>
            
            <div className="mb-16">
               <p className="text-text-deep/80 leading-relaxed text-sm md:text-base font-light font-sans">{product.description}</p>
            </div>

            <div className="flex flex-col gap-6 mb-20 mt-auto">
              {product.stock !== undefined && product.stock <= 0 ? (
                <div className="w-full bg-primary/5 text-primary/40 py-5 text-[10px] uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-3 cursor-not-allowed">
                  <ShoppingBag className="w-4 h-4 opacity-50" /> Rupture de stock
                </div>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-primary text-background-warm py-5 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-secondary hover:text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-md border border-primary hover:border-secondary"
                >
                  <ShoppingBag className="w-4 h-4" /> Ajouter au Panier
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 border-t border-primary/20">
               <div className="flex gap-4 items-start">
                 <ShieldCheck className="w-5 h-5 text-secondary flex-shrink-0" />
                 <div>
                    <h5 className="text-[10px] uppercase tracking-[0.1em] font-bold text-primary mb-2">Paiement Sécurisé</h5>
                    <p className="text-[11px] text-primary/60 font-light leading-relaxed">Orange Money & Wave certifiés pour un achat en toute tranquillité.</p>
                 </div>
               </div>
               <div className="flex gap-4 items-start">
                 <Truck className="w-5 h-5 text-secondary flex-shrink-0" />
                 <div>
                    <h5 className="text-[10px] uppercase tracking-[0.1em] font-bold text-primary mb-2">Livraison Globale</h5>
                    <p className="text-[11px] text-primary/60 font-light leading-relaxed">Expédition soignée partout au Sénégal et à l'international.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
