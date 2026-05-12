import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
         let errorMessage = 'Identifiants incorrects.';
         const contentType = res.headers.get('content-type');
         if (contentType && contentType.includes('application/json')) {
           try {
             const errData = await res.json();
             errorMessage = errData.error || errorMessage;
           } catch {
             errorMessage = `Erreur Serveur (${res.status}). Le serveur a envoyé une réponse invalide.`;
           }
         } else {
           errorMessage = `Erreur de déploiement (Hostinger) : L'API n'est pas atteignable (Reçu une page web au lieu d'une réponse API). Le serveur Node.js doit être démarré ou le fichier .htaccess doit être corrigé.`;
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

  const handleAdminQuickLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '78177233ds@gmail.com' }) // Your email
      });
      if (!res.ok) throw new Error("Erreur lors de la connexion rapide.");
      const data = await res.json();
      await login(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
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
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-accent-soft/30 border border-primary/5 py-5 px-14 rounded-2xl text-xs tracking-widest font-medium placeholder:text-primary/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-white focus:border-secondary transition-all duration-300"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/30 hover:text-secondary transition-colors uppercase tracking-widest"
            >
              {showPassword ? "Masquer" : "Voir"}
            </button>
          </div>

          <button 
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background-warm py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-secondary hover:text-white transition-all duration-500 shadow-xl shadow-primary/10 disabled:opacity-50 group"
          >
            Se Connecter <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            type="button"
            onClick={handleAdminQuickLogin}
            disabled={loading}
            className="w-full bg-white border border-primary/10 text-primary py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-background-warm transition-all duration-500 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-secondary" /> Accès Administrateur Express
          </button>
        </form>

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
