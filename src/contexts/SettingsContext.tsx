import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

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
        const records = await pb.collection('settings').getList(1, 1, {
          filter: 'type="branding"'
        });
        
        if (records.items && records.items.length > 0) {
          const data = records.items[0];
          setSettings({
            logo: data.logo_file ? pb.files.getURL(data, data.logo_file) : (data.logo || '/logo.png'),
            primaryColor: data.primary_color || '#314227',
            secondaryColor: data.secondary_color || '#D4A373',
            homepageText: data.homepage_text || 'Bienvenue'
          });
        }
      } catch (error) {
        // Not configured or missing, ignore.
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Subscribe to realtime changes
    pb.collection('settings').subscribe('*', function (e) {
      if (e.action === 'update' && e.record.type === 'branding') {
         const data = e.record;
         setSettings({
            logo: data.logo_file ? pb.files.getURL(data, data.logo_file) : (data.logo || '/logo.png'),
            primaryColor: data.primary_color || '#314227',
            secondaryColor: data.secondary_color || '#D4A373',
            homepageText: data.homepage_text || 'Bienvenue'
         });
      }
    });

    return () => {
      pb.collection('settings').unsubscribe('*');
    };
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
