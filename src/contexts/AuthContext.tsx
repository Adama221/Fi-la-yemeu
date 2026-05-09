import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'admin' | 'affiliate' | 'client';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  created_at: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAffiliate: boolean;
  login: (userData: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // Construct profile from stored data
            const adminEmails = ['78177233ds@gmail.com', 'papesamabutik@gmail.com', 'pape@samabutik.com'];
            const role = adminEmails.includes(parsedUser.email?.toLowerCase()) ? 'admin' : (parsedUser.role || 'client');
            
            setProfile({
              id: parsedUser.id,
              email: parsedUser.email || '',
              role: role,
              full_name: parsedUser.username || parsedUser.full_name || parsedUser.email?.split('@')[0],
              phone: parsedUser.phone || '',
              created_at: parsedUser.created_at || new Date().toISOString()
            });
          } catch (e) {
            console.error('Failed to parse stored user', e);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (userData: any, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    
    const adminEmails = ['78177233ds@gmail.com', 'papesamabutik@gmail.com', 'pape@samabutik.com'];
    const role = adminEmails.includes(userData.email?.toLowerCase()) ? 'admin' : (userData.role || 'client');

    setProfile({
      id: userData.id,
      email: userData.email || '',
      role: role,
      full_name: userData.username || userData.full_name || userData.email?.split('@')[0],
      phone: userData.phone || '',
      created_at: userData.created_at || new Date().toISOString()
    });
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setProfile(null);
  };

  const adminEmails = ['78177233ds@gmail.com', 'papesamabutik@gmail.com', 'pape@samabutik.com'];
  const isAdminEmail = adminEmails.includes(profile?.email?.toLowerCase() || '');

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || isAdminEmail,
    isAffiliate: profile?.role === 'affiliate',
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

