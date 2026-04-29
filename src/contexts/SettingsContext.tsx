import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

interface SiteSettings {
  logo: string;
  primaryColor: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    logo: '/logo.png', // Default
    primaryColor: '#DAA520' // Default Gold
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await pb.collection('settings').getFirstListItem('type="general"');
        if (data) {
          setSettings({
            logo: data.logo || '/logo.png',
            primaryColor: data.primary_color || '#DAA520'
          });
        }
      } catch (error) {
        // Not configured or missing, ignore.
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Listen to real-time updates for site settings
    pb.collection('settings').subscribe('*', function (e) {
      if (e.action === 'create' || e.action === 'update') {
        const data = e.record as any;
        if (data.type === 'general') {
          setSettings({
            logo: data.logo || '/logo.png',
            primaryColor: data.primary_color || '#DAA520'
          });
        }
      }
    }).catch(console.warn);

    return () => {
      pb.collection('settings').unsubscribe('*').catch(console.warn);
    };
  }, []);


  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      <div style={{ '--primary-custom': settings.primaryColor } as React.CSSProperties}>
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
