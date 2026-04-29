import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Heart, Share2, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        const data = await pb.collection('products').getOne(id);
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
     return <div className="py-32 flex justify-center text-primary font-serif">Chargement...</div>;
  }

  if (!product) {
     return <div className="py-32 flex justify-center text-primary font-serif">Produit non trouvé.</div>;
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image: product.image,
      size: 'Unique'
    });
    alert('Produit ajouté au panier !');
  };

  return (
    <div className="py-16 bg-background-warm min-h-screen">
      <div className="container mx-auto px-4">
        <Link to="/products" className="inline-flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest mb-12 hover:text-secondary transition-all">
          <ChevronLeft className="w-4 h-4" /> Retour à la boutique
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-accent-soft rounded-[3rem] overflow-hidden shadow-lg"
            >
              <img src={product.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=1200'} alt={product.name} className="w-full h-full object-cover" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex flex-col">
            <span className="text-secondary font-serif italic text-2xl mb-4 block">{product.category || 'Collection Exclusive'}</span>
            <h1 className="text-6xl font-serif font-bold uppercase tracking-tight mb-4 leading-none text-primary">{product.name}</h1>
            <p className="text-3xl font-serif italic text-secondary mb-12">{formatPrice(product.price)}</p>
            
            <div className="prose prose-primary mb-12">
               <p className="text-text-deep/80 leading-relaxed text-lg font-light">{product.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 mb-16 mt-8">
              <button 
                onClick={handleAddToCart}
                className="flex-grow bg-primary text-white py-6 rounded-full text-xs font-bold uppercase tracking-[0.3em] hover:bg-secondary transition-all flex items-center justify-center gap-3 shadow-xl transform active:scale-95"
              >
                <ShoppingBag className="w-5 h-5 font-bold" /> Ajouter au Panier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-primary/10">
               <div className="flex gap-4">
                 <div className="bg-accent-soft/30 p-3 rounded-full h-fit border border-primary/5">
                   <ShieldCheck className="w-5 h-5 text-secondary" />
                 </div>
                 <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-primary">Paiement Sécurisé</h5>
                    <p className="text-[10px] text-primary/40 uppercase tracking-widest font-bold leading-tight">OM & WAVE VÉRIFIÉS</p>
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="bg-accent-soft/30 p-3 rounded-full h-fit border border-primary/5">
                   <Truck className="w-5 h-5 text-secondary" />
                 </div>
                 <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-primary">Livraison Express</h5>
                    <p className="text-[10px] text-primary/40 uppercase tracking-widest font-bold leading-tight">Sénégal & International</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
