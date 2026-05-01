import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-background-warm py-24 border-t-4 border-secondary">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
          
          <div className="col-span-1 md:col-span-5">
            <h3 className="text-3xl font-serif text-white tracking-tighter uppercase mb-8">SAMA<span className="font-light italic ml-1">BUTIK</span></h3>
            <p className="max-w-md leading-relaxed text-sm font-light text-white/70">
              Maison de haute couture sénégalaise. 
              <br/>L'alliance parfaite entre l'élégance contemporaine et l'héritage africain.
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-3">
            <h4 className="text-secondary font-serif italic mb-6 text-sm">Découvrir</h4>
            <ul className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] font-semibold text-white/70">
              <li><Link to="/" className="hover:text-secondary transition-colors">La Maison</Link></li>
              <li><Link to="/products" className="hover:text-secondary transition-colors">Collections</Link></li>
              <li><Link to="/login" className="hover:text-secondary transition-colors">Espace Privé</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-4">
            <h4 className="text-secondary font-serif italic mb-6 text-sm">Conciergerie</h4>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-4 text-white/70 font-semibold">+221 75 105 92 13</p>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-8 text-white/70 font-semibold">contact@samabutik.sn</p>
            
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-secondary hover:border-secondary transition-colors text-white/70 hover:text-white"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-secondary hover:border-secondary transition-colors text-white/70 hover:text-white"><Facebook className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] uppercase tracking-[0.3em] font-medium text-white/40">
          <p>&copy; {new Date().getFullYear()} SAMA BUTIK. DAKAR, SÉNÉGAL.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-white transition-colors">Mentions Légales</Link>
            <Link to="/terms" className="hover:text-white transition-colors">CGV</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
