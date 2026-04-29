import React, { createContext, useContext, useState, useEffect } from 'react';

interface SiteSettings {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  homepageText: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    logo: '/logo.png', // Default
    primaryColor: '#314227', // Default Forest Green
    secondaryColor: '#D4A373',
    homepageText: 'Boutique'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        
        if (data && data.settings) {
          setSettings({
            logo: data.settings.logo || '/logo.png',
            primaryColor: data.settings.primary_color || '#314227',
            secondaryColor: data.settings.secondary_color || '#D4A373',
            homepageText: data.settings.homepage_text || 'Bienvenue'
          });
        }
      } catch (error) {
        // Not configured or missing, ignore.
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      <div style={{ '--primary-custom': settings.primaryColor, '--secondary-custom': settings.secondaryColor } as React.CSSProperties}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
