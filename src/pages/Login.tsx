import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Chrome, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { profile, login } = useAuth();
  const navigate = useNavigate();

  // Redirect based on role when profile is loaded
  useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [profile, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password })
      });

      if (!res.ok) {
        throw new Error('Identifiants incorrects');
      }

      const data = await res.json();
      login(data.user, data.token);
    } catch (error: any) {
      alert("Erreur de connexion : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Simulation of Google Login for the demo/dev environment
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pape@samabutik.com' }) // Pre-selecting new admin email
      });

      if (!res.ok) throw new Error('Simulation failed');

      const data = await res.json();
      login(data.user, data.token);
      navigate('/admin');
    } catch (error: any) {
      alert("Erreur simulation Google : " + error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background-warm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-primary/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-primary mb-1">Connexion</h1>
            <p className="text-[10px] text-text-deep/40 uppercase tracking-[0.4em] font-bold">SAMA BUTIK HLM5</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-8">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-deep/30 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Email / Nom d'utilisateur" 
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
              placeholder="Mot de passe" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 py-4 px-12 rounded-2xl text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            Se Connecter <ArrowRight className="w-3 h-3" />
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
