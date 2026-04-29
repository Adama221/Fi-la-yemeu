import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-center container mx-auto px-4 bg-background-warm">
        <div className="bg-accent-soft p-12 rounded-full mb-8">
           <ShoppingBag className="w-16 h-16 text-primary/20" />
        </div>
        <h2 className="text-4xl font-serif font-bold uppercase tracking-tight mb-4 text-primary italic">Votre panier est vide</h2>
        <p className="text-primary/40 mb-12 max-w-sm text-[11px] uppercase tracking-widest font-bold">Découvrez nos collections pour trouver la pièce qui vous correspond.</p>
        <Link to="/products" className="bg-primary text-white px-12 py-5 text-xs font-bold uppercase tracking-[0.4em] hover:bg-secondary rounded-full transition-all shadow-lg">
          Commencer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="py-24 bg-background-warm min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-serif font-bold uppercase tracking-tight mb-16 text-primary">Votre Panier</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-8">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-8 pb-8 border-b border-primary/10">
                <div className="w-32 aspect-square bg-accent-soft rounded-[2rem] overflow-hidden flex-shrink-0 shadow-md">
                  <img src={item.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=400'} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-primary mb-1">{item.name}</h3>
                      <p className="text-[10px] text-text-deep/40 uppercase tracking-widest font-bold">{item.size ? `Taille: ${item.size}` : 'Taille Unique'}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.size)}
                      className="text-primary/20 hover:text-secondary transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex items-center border border-primary/10 rounded-full overflow-hidden bg-white">
                       <button 
                         onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                         disabled={item.quantity <= 1}
                         className="px-4 py-2 text-xs hover:bg-accent-soft transition-colors disabled:opacity-50"
                       ><Minus className="w-3 h-3" /></button>
                       <span className="px-6 py-2 text-xs font-bold font-serif italic">{item.quantity}</span>
                       <button 
                         onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                         className="px-4 py-2 text-xs hover:bg-accent-soft transition-colors"
                       ><Plus className="w-3 h-3" /></button>
                    </div>
                    <p className="font-serif italic text-2xl text-secondary">{formatPrice(item.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-primary/5 sticky top-32">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-12 border-b border-primary/5 pb-4 text-primary/40">Résumé</h4>
               <div className="space-y-6 mb-12">
                 <div className="flex justify-between text-xs uppercase tracking-widest font-bold">
                   <span className="text-text-deep/40">Sous-total</span>
                   <span className="font-serif italic text-lg">{formatPrice(total)}</span>
                 </div>
                 <div className="flex justify-between text-xs uppercase tracking-widest font-bold">
                   <span className="text-text-deep/40">Livraison</span>
                   <span className="text-secondary">Offerte (Dakar)</span>
                 </div>
                 <div className="border-t border-primary/5 pt-8 flex justify-between">
                   <span className="font-serif font-bold uppercase tracking-tight text-xl text-primary">Total</span>
                   <span className="text-3xl font-serif italic text-secondary font-bold">{formatPrice(total)}</span>
                 </div>
               </div>
               
               <Link to="/checkout" className="w-full bg-primary text-white flex items-center justify-center gap-2 py-6 rounded-full text-xs font-bold uppercase tracking-[0.4em] hover:bg-secondary transition-all shadow-lg active:scale-95 transform">
                 Commander <ArrowRight className="w-4 h-4" />
               </Link>
               
               <p className="mt-8 text-[10px] text-primary/40 uppercase tracking-widest leading-relaxed text-center">
                 Taxes incluses. Paiement sécurisé via Orange Money ou Wave.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
