import { Search, ShoppingBag, User, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { itemsCount } = useCart();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4">
          {settings.logo && settings.logo !== '/logo.png' ? (
             <img src={settings.logo} alt="Sama Butik" className="h-10 w-auto object-contain" />
          ) : (
             <span className="text-2xl font-serif font-bold text-primary tracking-tight uppercase">SAMA BUTIK <span className="text-secondary font-light">HLM5</span></span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium text-text-deep/80">
          <Link to="/" className="hover:text-secondary transition-colors border-b border-secondary">Accueil</Link>
          <Link to="/products" className="hover:text-secondary transition-colors">Boutique</Link>
          {isAdmin && <Link to="/admin" className="hover:text-secondary transition-colors">Admin</Link>}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <button className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Search className="w-4 h-4 text-primary" />
            </button>
            <Link to="/cart" className="relative w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">
              <ShoppingBag className="w-4 h-4 text-primary" />
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {itemsCount}
                </span>
              )}
            </Link>
          </div>
          
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
               <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-primary leading-none mb-1">{profile?.full_name || user.user_metadata?.full_name || 'Client'}</p>
                  <p className="text-[8px] uppercase tracking-widest text-secondary font-medium leading-none">{profile?.role}</p>
               </div>
               <button onClick={() => logout()} className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center hover:bg-secondary hover:text-white transition-all">
                  <LogOut className="w-3 h-3" />
               </button>
            </div>
          ) : (
            <Link to="/login" className="hidden sm:block bg-primary text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter hover:bg-secondary transition-colors">
              Mon Espace
            </Link>
          )}
          <button 
            className="md:hidden p-2 hover:bg-stone-50 rounded-full transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-stone-100 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col gap-6 text-lg font-medium text-stone-800">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)}>Produits</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)}>Panier</Link>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>Connexion</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
