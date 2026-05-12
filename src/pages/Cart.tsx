import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-40 flex flex-col items-center justify-center text-center container mx-auto px-6 lg:px-12 bg-background-warm min-h-screen">
        <div className="bg-transparent border border-primary/20 p-12 mb-12 relative before:absolute before:inset-2 before:border before:border-primary/10">
           <ShoppingBag className="w-16 h-16 text-primary/40 relative z-10" />
        </div>
        <h2 className="text-4xl md:text-5xl font-serif text-primary tracking-tight mb-6">Votre panier est vide</h2>
        <p className="text-primary/60 mb-12 max-w-md text-xs font-sans uppercase tracking-[0.2em] leading-relaxed">Découvrez nos collections pour trouver la pièce qui vous correspond.</p>
        <Link to="/products" className="bg-primary text-background-warm px-12 py-5 text-[10px] font-semibold uppercase tracking-[0.3em] hover:bg-secondary transition-all shadow-md border border-primary hover:border-secondary">
          Découvrir la collection
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-background-warm min-h-screen">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-20">
          <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-primary/60 mb-4 font-sans">Votre Sélection</p>
          <h1 className="text-5xl md:text-7xl font-serif text-primary tracking-tight mb-16">Panier</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-8 flex flex-col gap-10">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-8 pb-10 border-b border-primary/20">
                <div className="w-32 md:w-48 aspect-[3/4] bg-accent-soft overflow-hidden flex-shrink-0 relative group">
                  <img src={item.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=400'} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                </div>
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl md:text-2xl font-serif text-primary mb-2 line-clamp-2 leading-tight pr-4">{item.name}</h3>
                      <p className="text-[10px] text-text-deep uppercase tracking-[0.2em] font-medium font-sans opacity-60 mb-4">{item.size ? `Taille: ${item.size}` : 'Taille Unique'}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.size)}
                      className="text-primary/40 hover:text-secondary transition-colors mt-1"
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mt-4">
                    <div className="flex items-center border border-primary/20 bg-background-warm w-fit px-1">
                       <button 
                         onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                         disabled={item.quantity <= 1}
                         className="p-3 text-xs text-primary/60 hover:text-primary transition-colors disabled:opacity-30"
                       ><Minus className="w-3 h-3" /></button>
                       <span className="w-8 text-center text-xs font-sans text-primary select-none">{item.quantity}</span>
                       <button 
                         onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                         className="p-3 text-xs text-primary/60 hover:text-primary transition-colors"
                       ><Plus className="w-3 h-3" /></button>
                    </div>
                    <p className="font-sans font-light text-lg tracking-wider uppercase text-text-deep">{formatPrice(item.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white/50 backdrop-blur-sm p-10 lg:p-12 border border-primary/20 sticky top-32">
               <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] mb-10 pb-4 text-primary font-sans border-b border-primary/20">Résumé de la commande</h4>
               <div className="space-y-6 mb-12 text-sm font-sans">
                 <div className="flex justify-between tracking-wide">
                   <span className="text-primary/70">Sous-total</span>
                   <span className="font-light uppercase">{formatPrice(total)}</span>
                 </div>
                 <div className="flex justify-between tracking-wide">
                   <span className="text-primary/70">Livraison (Dakar)</span>
                   <span className="text-secondary font-light">Offerte</span>
                 </div>
                 <div className="border-t border-primary/20 pt-8 flex justify-between items-end mt-4">
                   <span className="font-serif text-xl tracking-tight text-primary">Total</span>
                   <span className="text-2xl font-sans font-light tracking-wider uppercase text-text-deep">{formatPrice(total)}</span>
                 </div>
               </div>
               
               <Link to="/checkout" className="w-full bg-primary text-background-warm flex items-center justify-center gap-3 py-5 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-secondary hover:text-white transition-all border border-primary hover:border-secondary shadow-sm">
                 Valider la commande <ArrowRight className="w-4 h-4" />
               </Link>
               
               <p className="mt-8 text-[9px] text-primary/50 uppercase tracking-[0.2em] leading-relaxed text-center font-sans">
                 Taxes incluses. Paiement sécurisé via Orange Money ou Wave.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
