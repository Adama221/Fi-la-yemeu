import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Smartphone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { profile, user } = useAuth();
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

  useEffect(() => {
    if (profile || user) {
      const fullName = profile?.full_name || user?.user_metadata?.full_name || '';
      const [prenom, ...nomParts] = fullName.split(' ');
      setCustomerInfo(prev => ({
        ...prev,
        prenom: prenom || '',
        nom: nomParts.join(' ') || '',
        email: user?.email || '',
        // adresse and telephone might need to be fetched from a more detailed profile if available
      }));
    }
  }, [profile, user]);

  const createOrder = async (payMethod: string) => {
    try {
      const affiliateCode = sessionStorage.getItem('affiliate_code') || undefined;
      const res = await fetch('/api/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({
            customer: customerInfo,
            items: items,
            total,
            method: payMethod === 'orange' ? 'orange' : 'wave',
            affiliate_code: affiliateCode,
            status: 'pending'
         })
      });
      
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          throw new Error(errData.error || "Erreur lors de la création de la commande");
        } else {
          throw new Error(`Erreur réseau ou API indisponible (${res.status}).`);
        }
      }

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Erreur de format de réponse API.");
      }

      const data = await res.json();
      return data.id;
    } catch (error: any) {
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

  const steps = [
    { id: 1, label: 'LIVRAISON' },
    { id: 2, label: 'PAIEMENT' },
    { id: 3, label: 'CONFIRMATION' },
  ];

  const shippingComplete = !!(customerInfo.prenom && customerInfo.nom && customerInfo.adresse && customerInfo.telephone);
  const paymentMethodSelected = !!method;
  const currentStep = !shippingComplete ? 1 : (!paymentMethodSelected ? 2 : 3);

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
        {/* Progress Stepper */}
        <div className="mb-20">
          <div className="flex justify-between items-center max-w-2xl mx-auto relative px-2">
            {/* Background Track */}
            <div className="absolute top-[20px] left-0 w-full h-[3px] bg-primary/5 -translate-y-1/2 z-0 rounded-full" />
            
            {/* Active Progress Bar */}
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              className="absolute top-[20px] left-0 h-[3px] bg-secondary -translate-y-1/2 z-0 rounded-full shadow-[0_0_10px_rgba(var(--color-secondary-rgb),0.3)]"
            />

            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <motion.div 
                  initial={false}
                  animate={{ 
                    backgroundColor: currentStep >= step.id ? 'var(--color-secondary)' : '#fff',
                    borderColor: currentStep >= step.id ? 'var(--color-secondary)' : 'rgba(var(--color-primary-rgb), 0.1)',
                    scale: currentStep === step.id ? 1.2 : 1,
                    boxShadow: currentStep === step.id ? '0 10px 20px -5px rgba(var(--color-secondary-rgb), 0.3)' : '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[11px] font-black transition-all duration-500`}
                >
                  {currentStep > step.id ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : (
                    <span className={currentStep >= step.id ? 'text-white' : 'text-primary/20'}>{step.id}</span>
                  )}
                </motion.div>
                <div className="absolute top-full mt-4 text-center w-max">
                  <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${currentStep >= step.id ? 'text-primary' : 'text-primary/20'}`}>
                    {step.label}
                  </span>
                  {currentStep === step.id && (
                    <motion.div 
                      layoutId="active-step-dot"
                      className="w-1 h-1 bg-secondary rounded-full mx-auto mt-1"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Checkout Form */}
          <div className="space-y-12">
            <div className="mb-12">
                <p className="text-secondary font-serif italic text-2xl mb-1">Finalisez votre commande</p>
                <h1 className="text-6xl font-serif font-bold uppercase tracking-tight text-primary">Paiement</h1>
            </div>

            <section className={`transition-opacity duration-500 ${currentStep > 1 ? 'opacity-60' : 'opacity-100'}`}>
                <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-8 border-b pb-4 flex items-center gap-3 ${currentStep >= 1 ? 'text-primary border-secondary/30' : 'text-primary/40 border-primary/10'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${currentStep >= 1 ? 'bg-secondary text-primary' : 'bg-primary/10'}`}>1</span>
                  Livraison
                </h3>
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

            <section className={`transition-opacity duration-500 ${currentStep < 2 ? 'opacity-30 pointer-events-none' : currentStep > 2 ? 'opacity-60' : 'opacity-100'}`}>
                <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-8 border-b pb-4 flex items-center gap-3 ${currentStep >= 2 ? 'text-primary border-secondary/30' : 'text-primary/40 border-primary/10'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${currentStep >= 2 ? 'bg-secondary text-primary' : 'bg-primary/10'}`}>2</span>
                  Méthode de Paiement
                </h3>
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
