import { useState } from 'react';
import { CreditCard, Wallet, Smartphone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'orange' | 'wave' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [waveStep, setWaveStep] = useState(1);
  const [waveData, setWaveData] = useState({ phone: '', transactionId: '' });
  
  const [customerInfo, setCustomerInfo] = useState({
    prenom: '',
    nom: '',
    adresse: '',
    telephone: '',
    email: ''
  });

  const createOrder = async (payMethod: string) => {
    try {
      const affiliateCode = sessionStorage.getItem('affiliate_code') || undefined;
      const res = await fetch('/api/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
         body: JSON.stringify({
            customer: customerInfo,
            items,
            total,
            method: payMethod,
            affiliate_code: affiliateCode,
            status: payMethod === 'orange' ? 'EFFECTUÉ' : 'VÉRIFICATION'
         })
      });
      if (!res.ok) throw new Error("Could not create order");
      const data = await res.json();
      return data.id;
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };


  const handlePayment = async () => {
    if (!method || items.length === 0) return;
    setIsProcessing(true);

    if (method === 'orange') {
        try {
            const orderId = await createOrder('orange');
            // Proxy to backend (mocking orange redirect logic)
            const res = await fetch('/api/pay/orange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, orderId })
            });
            const data = await res.json();
            
            clearCart();
            if (data.payment_url) {
                navigate(data.payment_url);
            } else {
                navigate(`/success?orderId=${orderId}&amount=${total}&method=orange`);
            }
        } catch (e) {
            console.error(e);
            alert('Erreur lors de l\'initialisation du paiement Orange Money');
            setIsProcessing(false);
        }
    } else {
        // Wave flow step 1
        setTimeout(() => {
            setWaveStep(2);
            setIsProcessing(false);
        }, 1500);
    }
  };

  const submitWave = async () => {
    setIsProcessing(true);
    try {
      const orderId = await createOrder('wave');
      clearCart();
      setTimeout(() => {
          navigate(`/success?orderId=${orderId}&amount=${total}&method=wave`);
      }, 2000);
    } catch (e) {
      alert("Erreur lors de la confirmation Wave");
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-24 bg-background-warm min-h-screen flex items-center justify-center">
        <p className="text-xl font-serif text-primary/60">Votre panier est vide.</p>
      </div>
    );
  }

  return (
    <div className="py-24 bg-background-warm min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Checkout Form */}
          <div className="space-y-12">
            <div className="mb-12">
                <p className="text-secondary font-serif italic text-2xl mb-1">Finalisez votre commande</p>
                <h1 className="text-6xl font-serif font-bold uppercase tracking-tight text-primary">Paiement</h1>
            </div>

            <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-primary/40 border-b border-primary/10 pb-4">1. Livraison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="PRÉNOM" value={customerInfo.prenom} onChange={e => setCustomerInfo({...customerInfo, prenom: e.target.value})} className="bg-white border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-colors rounded-2xl shadow-sm" />
                  <input type="text" placeholder="NOM" value={customerInfo.nom} onChange={e => setCustomerInfo({...customerInfo, nom: e.target.value})} className="bg-white border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-colors rounded-2xl shadow-sm" />
                  <div className="md:col-span-2">
                    <input type="text" placeholder="ADRESSE À DAKAR" value={customerInfo.adresse} onChange={e => setCustomerInfo({...customerInfo, adresse: e.target.value})} className="w-full bg-white border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-colors rounded-2xl shadow-sm" />
                  </div>
                  <input type="tel" placeholder="TÉLÉPHONE (+221)" value={customerInfo.telephone} onChange={e => setCustomerInfo({...customerInfo, telephone: e.target.value})} className="bg-white border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-colors rounded-2xl shadow-sm" />
                  <input type="email" placeholder="EMAIL" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="bg-white border border-primary/10 p-5 text-[10px] font-bold tracking-widest outline-none focus:border-secondary transition-colors rounded-2xl shadow-sm" />
                </div>
            </section>

            <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-primary/40 border-b border-primary/10 pb-4">2. Méthode de Paiement</h3>
                <div className="space-y-6">
                  <button 
                    onClick={() => setMethod('orange')}
                    className={`w-full flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-500 shadow-sm ${method === 'orange' ? 'border-secondary bg-white ring-2 ring-secondary ring-offset-4' : 'border-primary/10 bg-white hover:bg-accent-soft'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-[#FF7900] rounded-2xl flex items-center justify-center text-white font-black text-sm uppercase italic">OM</div>
                      <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">Orange Money</p>
                        <p className="text-[10px] text-text-deep/40 uppercase font-medium">Automatique & Instantané</p>
                      </div>
                    </div>
                    {method === 'orange' && <CheckCircle2 className="w-6 h-6 text-secondary" />}
                  </button>

                  <button 
                    onClick={() => setMethod('wave')}
                    className={`w-full flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-500 shadow-sm ${method === 'wave' ? 'border-secondary bg-white ring-2 ring-secondary ring-offset-4' : 'border-primary/10 bg-white hover:bg-accent-soft'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white font-black text-xs uppercase tracking-widest">Wave</div>
                      <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">Wave Mobile</p>
                        <p className="text-[10px] text-text-deep/40 uppercase font-medium">Flash QR + Validation Admin</p>
                      </div>
                    </div>
                    {method === 'wave' && <CheckCircle2 className="w-6 h-6 text-secondary" />}
                  </button>
                </div>
            </section>
          </div>

          {/* Sticky Summary */}
          <div className="lg:col-span-1">
             <div className="bg-primary text-background-warm p-12 rounded-[3.5rem] shadow-2xl sticky top-32 flex flex-col max-h-[80vh] overflow-y-auto">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.8em] mb-8 border-b border-white/10 pb-6 opacity-40">Récapitulatif</h4>
               
               <div className="space-y-6 flex-grow mb-8 overflow-y-auto pr-2">
                 {items.map(item => (
                   <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center">
                     <div className="w-14 aspect-square bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
                       <img src={item.image || 'https://images.unsplash.com/photo-1549439602-43ebcb23281f?auto=format&fit=crop&q=80&w=400'} alt="product" className="w-full h-full object-cover" />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest line-clamp-1">{item.name}</p>
                       <p className="opacity-40 text-[9px] uppercase font-bold tracking-widest">Qté: {item.quantity}</p>
                       <p className="font-serif italic text-sm text-secondary">{formatPrice(item.price * item.quantity)}</p>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="space-y-6 border-t border-white/10 pt-8 mb-8">
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                   <span className="opacity-40">Expédition Dakar</span>
                   <span className="text-secondary">Gratuit</span>
                 </div>
                 <div className="flex justify-between items-end">
                   <span className="font-serif font-bold text-2xl uppercase tracking-tight">À Payer</span>
                   <span className="text-4xl font-serif italic font-bold text-secondary">{formatPrice(total)}</span>
                 </div>
               </div>

               <AnimatePresence mode="wait">
                  {method === 'wave' && waveStep === 2 ? (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-6 mb-8 overflow-hidden"
                    >
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <Wallet className="w-5 h-5 text-secondary" />
                            <h5 className="text-[10px] uppercase font-bold tracking-widest text-white">Validation Wave SMS</h5>
                        </div>
                        <p className="text-[10px] leading-relaxed opacity-60 font-medium">
                          Faites un transfert de <strong className="text-white text-xs">{formatPrice(total)}</strong> au numéro Wave: <strong className="text-white text-xs">77 XXX XX XX</strong>.
                        </p>
                        <input 
                           type="text" 
                           placeholder="Numéro de Transaction Wave" 
                           value={waveData.transactionId}
                           onChange={e => setWaveData({...waveData, transactionId: e.target.value})}
                           className="w-full bg-white/10 border-none p-5 text-[10px] font-bold tracking-widest outline-none text-white uppercase rounded-2xl"
                        />
                    </motion.div>
                  ) : null}
               </AnimatePresence>

               {method && (
                 <button 
                  onClick={method === 'wave' && waveStep === 2 ? submitWave : handlePayment}
                  disabled={isProcessing || !customerInfo.prenom || !customerInfo.nom}
                  className="w-full bg-secondary text-primary py-6 rounded-full text-xs font-black uppercase tracking-[0.4em] hover:bg-white transition-colors flex justify-center items-center gap-3 disabled:opacity-50 mt-auto flex-shrink-0"
                 >
                   {isProcessing ? 'Traitement...' : method === 'wave' && waveStep === 1 ? 'Payer avec Wave' : method === 'wave' && waveStep === 2 ? 'Confirmer Wave' : 'Payer via Orange Money'}
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
