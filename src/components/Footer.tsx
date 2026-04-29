import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-primary/10 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 px-4">
            <h3 className="text-primary text-2xl font-serif font-bold uppercase tracking-tight mb-6">SAMA BUTIK <span className="text-secondary">HLM5</span></h3>
            <p className="max-w-md leading-relaxed text-[13px] text-text-deep/60">
              Votre destination mode africaine moderne. Qualité, élégance et tradition revisitées pour le monde d'aujourd'hui. 
              Chaque vêtement raconte une histoire d'héritage d'Afrique de l'Ouest.
            </p>
          </div>
          
          <div>
            <h4 className="text-primary font-bold mb-6 text-[10px] uppercase tracking-[0.2em]">Navigation</h4>
            <ul className="flex flex-col gap-3 text-[11px] uppercase tracking-widest font-medium">
              <li><Link to="/" className="hover:text-secondary transition-colors opacity-70">Collections</Link></li>
              <li><Link to="/products" className="hover:text-secondary transition-colors opacity-70">Nouveautés</Link></li>
              <li><Link to="/checkout" className="hover:text-secondary transition-colors opacity-70">Paiement</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-primary font-bold mb-6 text-[10px] uppercase tracking-[0.2em]">Contact</h4>
            <p className="text-[11px] uppercase tracking-widest mb-4 opacity-70 font-medium">+221 75 105 92 13</p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center hover:bg-secondary hover:text-white transition-all"><Facebook className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] uppercase tracking-[0.2em] font-bold text-primary/40">
          <p>&copy; {new Date().getFullYear()} SAMA BUTIK. Dakar, Sénégal.</p>
          <div className="flex gap-8">
            <span>Livraison 2h</span>
            <span className="text-secondary">#SamaButik221</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
