import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, Chrome, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<'client' | 'affiliate'>('client');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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
      // 1. Try Supabase Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role
          }
        }
      });

      // 2. Local Backend Registration (Primary or Sync)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Erreur backend' }));
        // If Supabase failed AND local failed, then we show error
        if (authError) {
          throw new Error(errData.error || authError.message);
        }
        // If local failed but Supabase worked, maybe just log or show warning
        console.error("Local register failed", errData);
      }

      const localData = await res.json().catch(() => null);

      if (authData.user) {
        // Log in with the supabase session
        const sessionToken = (await supabase.auth.getSession()).data.session?.access_token || '';
        await login(authData.user, sessionToken);
      } else if (localData && localData.user) {
        // Fallback to local session
        await login(localData.user, localData.token);
      } else {
        if (authError) throw authError;
        throw new Error("Impossible de créer le compte.");
      }

      if (role === 'affiliate') {
         navigate('/admin');
      } else {
         navigate('/');
      }

    } catch (err: any) {
      console.error(err);
      setError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError("Erreur Google : " + err.message);
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

        <form onSubmit={handleRegister} className="space-y-6 mb-10">
          
          <div className="p-8 bg-accent-soft/20 rounded-[2rem] border border-primary/5 mb-4">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-primary/40 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Statut Souhaité
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`flex-1 py-4 text-[9px] font-bold uppercase tracking-widest rounded-xl border transition-all ${role === 'client' ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-primary/10 text-primary/40 hover:border-primary/30'}`}
              >
                Client Privilège
              </button>
              <button
                type="button"
                onClick={() => setRole('affiliate')}
                className={`flex-1 py-4 text-[9px] font-bold uppercase tracking-widest rounded-xl border transition-all ${role === 'affiliate' ? 'border-secondary bg-secondary text-white shadow-lg shadow-secondary/20' : 'border-primary/10 text-primary/40 hover:border-secondary/30'}`}
              >
                Ambassadeur
              </button>
            </div>
          </div>

          <div className="relative group">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-secondary transition-colors" />
            <input 
              type="text" 
              placeholder="Nom complet" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-accent-soft/30 border border-primary/5 py-5 px-14 rounded-2xl text-xs tracking-widest font-medium placeholder:text-primary/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white focus:border-secondary transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-secondary transition-colors" />
            <input 
              type="email" 
              placeholder="Adresse email professionnelle" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-accent-soft/30 border border-primary/5 py-5 px-14 rounded-2xl text-xs tracking-widest font-medium placeholder:text-primary/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white focus:border-secondary transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-secondary transition-colors" />
              <input 
                type="password" 
                placeholder="Mot de passe" 
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-accent-soft/30 border border-primary/5 py-5 px-14 rounded-2xl text-xs tracking-widest font-medium placeholder:text-primary/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white focus:border-secondary transition-all duration-300"
              />
            </div>

            <div className="relative group">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-secondary transition-colors" />
              <input 
                type="password" 
                placeholder="Confirmation" 
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full bg-accent-soft/30 border border-primary/5 py-5 px-14 rounded-2xl text-xs tracking-widest font-medium placeholder:text-primary/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white focus:border-secondary transition-all duration-300"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background-warm py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-secondary hover:text-white transition-all duration-500 shadow-xl shadow-primary/10 disabled:opacity-50 mt-6 group"
          >
            Créer mon compte <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
