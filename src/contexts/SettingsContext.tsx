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
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
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

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          // Safe access to settings row from the updated API structure { settings: row }
          const s = data.settings || data; 
          updateSettings({
            logo: s.logo || '/logo.png',
            primaryColor: s.primary_color || '#314227',
            secondaryColor: s.secondary_color || '#D4A373',
            homepageText: s.homepage_text || 'Bienvenue'
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
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
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

