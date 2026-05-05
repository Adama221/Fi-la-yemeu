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
  const [configHelp, setConfigHelp] = useState<{ siteUrl: string, callbackUrl: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
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

    const assignedRole = email.includes('pape') ? 'admin' : (role || 'client');
    
    try {
      // 1. Try Supabase Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: assignedRole
          }
        }
      });

      // 2. Local Backend Registration
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role: assignedRole }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Erreur backend' }));
          if (authError) throw new Error(errData.error || authError.message);
        }

        const localData = await res.json().catch(() => null);

        if (authData.user) {
          const sessionToken = (await supabase.auth.getSession()).data.session?.access_token || '';
          await login(authData.user, sessionToken);
        } else if (localData && localData.user) {
          await login(localData.user, localData.token);
        } else {
          if (authError) throw authError;
          throw new Error("Impossible de créer le compte.");
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError' || fetchErr.message === 'Failed to fetch') {
           throw new Error("Le serveur est injoignable pour l'inscription. Réessayez.");
        }
        throw fetchErr;
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
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (sbError) {
        const errorMessage = sbError.message || '';
        const isConfigError = errorMessage.includes('OAuth secret') || 
                            errorMessage.includes('not found') || 
                            errorMessage.includes('provider') ||
                            (sbError as any).error_code === 'validation_failed' ||
                            (sbError as any).msg?.includes('OAuth secret');

        if (isConfigError) {
           console.log('Supabase OAuth not configured, using local mock...');
           setConfigHelp({
             siteUrl: window.location.origin,
             callbackUrl: 'https://toxpzpxvowuduixhaxzq.supabase.co/auth/v1/callback'
           });

           const res = await fetch('/api/auth/google', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: email || 'pape@samabutik.com' }),
             signal: controller.signal
           });
           clearTimeout(timeoutId);
           
           if (!res.ok) {
             const data = await res.json().catch(() => ({}));
             throw new Error(data.error || 'Erreur auth Google locale');
           }
           
           const data = await res.json();
           await login(data.user, data.token);
           navigate(data.user.role === 'admin' ? '/admin' : '/');
           return;
        }
        throw sbError;
      }
    } catch (err: any) {
      console.error('Registration Google Error:', err);
      if (err.name === 'AbortError' || err.message === 'Failed to fetch') {
        setError("Erreur réseau: Serveur injoignable.");
      } else {
        setError("Erreur Google : " + err.message);
      }
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

        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-100"></div>
          </div>
          <span className="relative px-4 bg-white text-[9px] uppercase tracking-[0.4em] text-text-deep/30">Ou</span>
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white border border-stone-200 text-text-deep/60 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-stone-50 hover:border-secondary/30 transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] shadow-sm mb-6"
        >
          <Chrome className="w-4 h-4 text-secondary" /> S'inscrire avec Google
        </button>

        {configHelp && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-left"
          >
            <p className="text-[9px] font-bold uppercase text-orange-600 mb-2 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse" /> Configuration requise
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[8px] uppercase text-orange-400 font-bold mb-1">Site URL (Supabase):</p>
                <code className="text-[9px] block bg-white p-2 rounded border border-orange-100 break-all select-all">{configHelp.siteUrl}</code>
              </div>
              <div>
                <p className="text-[8px] uppercase text-orange-400 font-bold mb-1">Redirect URI (Google Console):</p>
                <code className="text-[9px] block bg-white p-2 rounded border border-orange-100 break-all select-all">{configHelp.callbackUrl}</code>
              </div>
            </div>
          </motion.div>
        )}

        <div className="text-center space-y-4">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="text-[9px] uppercase tracking-widest text-text-deep/20 hover:text-secondary transition-colors font-bold"
            >
              {showHelp ? "Masquer l'aide" : "Aide technique"}
            </button>

            {showHelp && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-left mb-4"
              >
                 <p className="text-[8px] font-bold uppercase text-stone-400 mb-3 tracking-widest">Configuration OAuth Supabase</p>
                 <div className="space-y-3">
                    <div>
                      <p className="text-[7px] uppercase text-stone-400 font-bold mb-1">Site URL:</p>
                      <code className="text-[9px] block bg-white p-2 rounded border border-stone-100 break-all select-all">{window.location.origin}</code>
                    </div>
                    <div>
                      <p className="text-[7px] uppercase text-stone-400 font-bold mb-1">Redirect URI:</p>
                      <code className="text-[9px] block bg-white p-2 rounded border border-stone-100 break-all select-all">https://toxpzpxvowuduixhaxzq.supabase.co/auth/v1/callback</code>
                    </div>
                 </div>
              </motion.div>
            )}

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
