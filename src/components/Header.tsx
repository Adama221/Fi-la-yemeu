import { Search, ShoppingBag, User, Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, profile, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { itemsCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-background-warm/90 backdrop-blur-xl border-b border-primary/10 py-3 shadow-md' : 'bg-transparent py-8'}`}>
      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
        
        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-primary hover:text-secondary transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-4 group mx-auto md:mx-0 pr-6 md:pr-0">
          {settings.logo && settings.logo !== '/logo.png' ? (
             <img src={settings.logo} alt="Sama Butik" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
          ) : (
             <span className="text-2xl md:text-3xl font-serif font-black text-primary tracking-tighter uppercase transition-colors group-hover:text-secondary">SAMA<span className="font-light italic ml-1">BUTIK</span></span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          <Link to="/" className={`text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300 pb-1 border-b ${location.pathname === '/' ? 'text-primary border-primary' : 'text-primary/60 border-transparent hover:text-primary hover:border-primary/50'}`}>Accueil</Link>
          <Link to="/products" className={`text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300 pb-1 border-b ${location.pathname === '/products' ? 'text-primary border-primary' : 'text-primary/60 border-transparent hover:text-primary hover:border-primary/50'}`}>La Boutique</Link>
          {isAdmin && <Link to="/admin" className="text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary hover:text-primary transition-colors duration-300 pb-1 border-b border-transparent">Administration</Link>}
          {user && !isAdmin && <Link to="/affiliate" className={`text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300 pb-1 border-b ${location.pathname === '/affiliate' ? 'text-primary border-primary' : 'text-primary/60 border-transparent hover:text-primary hover:border-primary/50'}`}>Affiliation</Link>}
        </nav>

        {/* Desktop Actions */}
        <div className="flex items-center gap-6">
          <button className="hidden sm:flex w-10 h-10 rounded-full border border-primary/20 items-center justify-center hover:bg-primary/5 transition-colors group">
            <Search className="w-4 h-4 text-primary group-hover:text-secondary transition-colors" />
          </button>
          
          <Link to="/cart" className="relative w-10 h-10 rounded-full bg-primary text-background-warm flex items-center justify-center hover:bg-secondary transition-all group shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <ShoppingBag className="w-4 h-4" />
            <AnimatePresence>
              {itemsCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-background-warm"
                >
                  {itemsCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <div className="hidden sm:flex items-center gap-4">
               <div className="text-right flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none mb-1">{profile?.full_name || user.user_metadata?.full_name || 'Client'}</p>
                  <p className="text-[8px] uppercase tracking-wider text-secondary font-medium leading-none">{profile?.role || 'Membre'}</p>
               </div>
               <button onClick={() => logout()} className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:border-primary group">
                  <LogOut className="w-4 h-4 text-primary group-hover:text-white" />
               </button>
            </div>
          ) : (
            <Link to="/login" className="hidden sm:flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center group-hover:border-primary transition-colors">
                 <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-[0.1em] text-primary group-hover:text-secondary transition-colors block">Espace<br/>Privé</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            className="md:hidden absolute top-full left-0 w-full bg-background-warm/95 backdrop-blur-xl border-b border-primary/10 overflow-hidden shadow-2xl"
          >
            <div className="container mx-auto px-6 py-10 flex flex-col gap-6">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif text-primary border-b border-primary/10 pb-4">Accueil</Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif text-primary border-b border-primary/10 pb-4">La Boutique</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif text-primary border-b border-primary/10 pb-4 flex justify-between">
                <span>Panier</span>
                {itemsCount > 0 && <span className="bg-secondary text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center">{itemsCount}</span>}
              </Link>
              {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif text-secondary border-b border-primary/10 pb-4">Administration</Link>}
              {user && !isAdmin && <Link to="/affiliate" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif text-secondary border-b border-primary/10 pb-4">Affiliation</Link>}
              {user ? (
                 <div className="pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none mb-1">{profile?.full_name || user.user_metadata?.full_name || 'Client'}</p>
                      <p className="text-[8px] uppercase tracking-wider text-secondary font-medium leading-none">{profile?.role || 'Membre'}</p>
                    </div>
                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-xs uppercase tracking-widest font-bold text-red-500 flex items-center gap-2">
                       Déconnexion <LogOut size={14} />
                    </button>
                 </div>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-2xl font-serif text-primary flex items-center gap-3 mt-4">
                  <User className="w-6 h-6 text-secondary" /> Espace Privé
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
