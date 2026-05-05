import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Chrome, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    try {
      // 1. Try Supabase Auth Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      // 2. If Supabase fails (e.g. invalid key, or user not found there), try local backend
      if (error) {
        console.log('Supabase login failed, trying local fallback...', error.message);
        
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: email, password })
        });

        if (!res.ok) {
           const errData = await res.json().catch(() => ({ error: 'Identifiants incorrects.' }));
           throw new Error(errData.error || 'Erreur de connexion.');
        }

        const localData = await res.json();
        await login(localData.user, localData.token);
      } else {
        // Supabase login success
        await login(data.user, data.session?.access_token || '');
      }
    } catch (error: any) {
      alert("Erreur de connexion : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // 1. Try Supabase OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        // If Supabase OAuth is not configured (common error), use local mock Google login
        if (error.message.includes('OAuth secret') || error.message.includes('not found')) {
           console.log('Supabase OAuth not configured, using local mock...');
           const res = await fetch('/api/auth/google', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: email || 'pape@samabutik.com' })
           });
           
           if (!res.ok) throw new Error('Local Google auth failed');
           
           const data = await res.json();
           await login(data.user, data.token);
           return;
        }
        throw error;
      };
    } catch (error: any) {
      alert("Erreur Authentification : " + error.message);
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

        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-100"></div>
          </div>
          <span className="relative px-4 bg-white text-[9px] uppercase tracking-[0.4em] text-text-deep/30">Ou</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-stone-200 text-text-deep/60 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-stone-50 transition-all disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-secondary" /> Continuer avec Google
        </button>

        <div className="mt-8 pt-6 border-t border-stone-50 text-center space-y-4">
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
