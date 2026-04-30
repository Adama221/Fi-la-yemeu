import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, Chrome, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { pb } from '../lib/pocketbase';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<'client' | 'affiliate'>('client');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      // 1. Create user in PocketBase
      await pb.collection('users').create({
        username: email.split('@')[0] + Math.floor(Math.random() * 1000), // PB requires unique username
        email,
        emailVisibility: true,
        password,
        passwordConfirm,
        name,
        role,
      });

      // 2. Automatically log them in after registration
      await pb.collection('users').authWithPassword(email, password);

      // 3. Redirect
      if (role === 'affiliate') {
         navigate('/admin'); // Assuming affiliates go to the dashboard
      } else {
         navigate('/');
      }

    } catch (err: any) {
      console.error(err);
      if (err.status === 0) {
         setError("Serveur hors ligne ou injoignable. Le backend PocketBase est-il démarré ?");
      } else if (err.data && err.data.data) {
         const msgs = Object.values(err.data.data).map((e: any) => e.message).join(' ');
         setError("Erreur : " + msgs);
      } else if (err.data && err.data.message) {
         setError("Erreur : " + err.data.message);
      } else {
         setError("Erreur lors de l'inscription : " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await pb.collection('users').authWithOAuth2({ provider: 'google' });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Erreur avec Google : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-warm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-primary/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-primary mb-1">Créer un Compte</h1>
            <p className="text-[10px] text-text-deep/40 uppercase tracking-[0.4em] font-bold">Rejoignez-nous</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 mb-6 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 mb-8">
          
          {/* Role Selection */}
          <div className="flex gap-4 mb-6">
             <button 
               type="button"
               onClick={() => setRole('client')}
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl border transition-all ${role === 'client' ? 'border-primary bg-primary text-white' : 'border-stone-200 text-text-deep/40 hover:bg-stone-50'}`}
             >
               Client
             </button>
             <button 
               type="button"
               onClick={() => setRole('affiliate')}
               className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl border transition-all ${role === 'affiliate' ? 'border-secondary bg-secondary text-white' : 'border-stone-200 text-text-deep/40 hover:bg-stone-50'}`}
             >
               Affilié
             </button>
          </div>

          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-deep/30 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Nom complet" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 py-4 px-12 rounded-2xl text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-deep/30 group-focus-within:text-primary transition-colors" />
            <input 
              type="email" 
              placeholder="Adresse email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 py-4 px-12 rounded-2xl text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-deep/30 group-focus-within:text-primary transition-colors" />
            <input 
              type="password" 
              placeholder="Mot de passe (+8 caractères)" 
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 py-4 px-12 rounded-2xl text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-deep/30 group-focus-within:text-primary transition-colors" />
            <input 
              type="password" 
              placeholder="Confirmer mot de passe" 
              required
              minLength={8}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 py-4 px-12 rounded-2xl text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-4"
          >
            M'inscrire <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        <div className="text-center">
            <p className="text-[10px] text-text-deep/60">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-secondary font-bold hover:underline">
                Se connecter
              </Link>
            </p>
        </div>
      </motion.div>
    </div>
  );
}
