import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [configHelp, setConfigHelp] = useState<{ siteUrl: string, callbackUrl: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const { profile, login } = useAuth();
  const navigate = useNavigate();

  // Redirect based on role when profile is loaded
  useEffect(() => {
    if (profile) {
      console.log('User profile loaded:', profile);
      if (profile.role === 'admin' || profile.role === 'affiliate') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [profile, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password })
      });

      if (!res.ok) {
         let errorMessage = 'Identifiants incorrects res.ok false.';
         const textData = await res.text();
         try {
           const errData = JSON.parse(textData);
           errorMessage = errData.error || errorMessage;
         } catch {
           errorMessage = `Erreur Serveur (${res.status}): ` + textData.substring(0, 100);
         }
         throw new Error(errorMessage);
      }

      const localData = await res.json();
      await login(localData.user, localData.token);
    } catch (err: any) {
      console.error('Login Error:', err);
      if (err.name === 'AbortError' || err.message === 'Failed to fetch') {
         setError("Impossible de contacter le serveur Sama Butik. Vérifiez votre connexion.");
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background-warm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/90 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-primary/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />
        
        <div className="text-center mb-10">
            <h1 className="text-4xl font-serif font-bold uppercase tracking-tight text-primary mb-2 italic">Connexion</h1>
            <p className="text-[10px] text-text-deep/30 uppercase tracking-[0.5em] font-bold">L'Excellence Sama Butik</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6 mb-8" id="login-form">
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-secondary transition-colors" />
            <input 
              id="email-input"
              type="text" 
              placeholder="Email professionnel" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-accent-soft/30 border border-primary/5 py-5 px-14 rounded-2xl text-xs tracking-widest font-medium placeholder:text-primary/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white focus:border-secondary transition-all duration-300"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-secondary transition-colors" />
            <input 
              id="password-input"
              type="password" 
              placeholder="Mot de passe" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-accent-soft/30 border border-primary/5 py-5 px-14 rounded-2xl text-xs tracking-widest font-medium placeholder:text-primary/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white focus:border-secondary transition-all duration-300"
            />
          </div>

          <button 
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background-warm py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-secondary hover:text-white transition-all duration-500 shadow-xl shadow-primary/10 disabled:opacity-50 group"
          >
            Se Connecter <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-50 text-center space-y-4">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-[9px] uppercase tracking-widest text-text-deep/20 hover:text-secondary transition-colors font-bold"
          >
            {showHelp ? "Masquer l'aide technique" : "Besoin d'aide pour la connexion ?"}
          </button>

          {showHelp && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-left"
            >
               <p className="text-[8px] font-bold uppercase text-stone-400 mb-3 tracking-widest">Configuration OAuth Supabase</p>
               <div className="space-y-3">
                  <div>
                    <p className="text-[7px] uppercase text-stone-400 font-bold mb-1">Site URL:</p>
                    <code className="text-[9px] block bg-white p-2 rounded border border-stone-100 break-all select-all">{window.location.origin}</code>
                  </div>
                  <div>
                    <p className="text-[7px] uppercase text-stone-400 font-bold mb-1">Redirect URI:</p>
                    <code className="text-[9px] block bg-white p-2 rounded border border-stone-100 break-all select-all">https://tepsspmrqgvkzxzfbrcx.supabase.co/auth/v1/callback</code>
                  </div>
                  <p className="text-[8px] text-stone-400 italic leading-relaxed">Utilisez "pape@samabutik.com" / "Pape2210" pour l'accès administrateur par défaut.</p>
               </div>
            </motion.div>
          )}

          <p className="text-[10px] text-text-deep/60">
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" className="text-secondary font-bold hover:underline">
              S'inscrire
            </Link>
          </p>

          <p className="text-[9px] text-text-deep/40 uppercase tracking-widest leading-relaxed">
            Accès sécurisé. <br/> 
            <span className="flex items-center justify-center gap-1 mt-2 font-bold text-stone-300">
              <Lock className="w-2 h-2" /> Sécurité Chiffrée
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
