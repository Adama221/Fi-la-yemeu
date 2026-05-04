import React from 'react';
import { Mail, Phone, MapPin, Music, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-background-warm pt-20 pb-10 px-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {/* LOGO / DESCRIPTION */}
        <div className="space-y-6">
          <h2 className="text-3xl font-serif font-bold uppercase tracking-tighter text-secondary italic">Sama Butik</h2>
          <p className="text-sm leading-relaxed opacity-70 max-w-xs">
            Découvrez nos meilleurs produits mode et couture avec une qualité exceptionnelle.
            Livraison rapide au Sénégal 🇸🇳
          </p>
        </div>

        {/* CONTACT */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary">Contact</h3>
          <div className="space-y-4">
            <a 
              href="https://wa.me/221751059213" 
              className="flex items-center gap-3 group hover:text-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-sm">+221 75 105 92 13</span>
            </a>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm">Sénégal</span>
            </div>
          </div>
        </div>

        {/* RESEAUX SOCIAUX */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary">Réseaux Sociaux</h3>
          <div className="space-y-4">
            <a 
              href="https://www.tiktok.com/@samabutikcouture" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 group hover:text-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-sm">@samabutikcouture</span>
            </a>
            <a 
              href="https://www.instagram.com/samabutik26?igsh=MWJ0bXZmdXB4M2dsOA==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 group hover:text-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </div>
              <span className="text-sm">Sama Butik</span>
            </a>
            <a 
              href="https://www.facebook.com/share/1BEWuSMtRw/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 group hover:text-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </div>
              <span className="text-sm">Voir la page Facebook</span>
            </a>
          </div>
        </div>

        {/* LIENS RAPIDES */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary">Liens Rapides</h3>
          <nav className="flex flex-col gap-4">
            <Link to="/" className="text-sm opacity-70 hover:opacity-100 hover:text-secondary transition-all">Accueil</Link>
            <Link to="/products" className="text-sm opacity-70 hover:opacity-100 hover:text-secondary transition-all">Produits</Link>
            <Link to="/contact" className="text-sm opacity-70 hover:opacity-100 hover:text-secondary transition-all">Contact</Link>
          </nav>
        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="max-w-7xl mx-auto pt-10 border-t border-white/10 text-center">
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-30">
          © 2026 Sama Butik — Tous droits réservés | Créé avec ❤️
        </p>
      </div>
    </footer>
  );
};

export default Footer;
