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
  login: (userData: any, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
        if (storedUser) {
          setUser(storedUser);
          setProfile({
            id: storedUser.id,
            email: storedUser.email,
            role: storedUser.role || 'client',
            full_name: storedUser.username || '',
            phone: '',
            created_at: ''
          });
        }
      } catch (e) {
        // empty
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: any, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    setProfile({
      id: userData.id,
      email: userData.email,
      role: userData.role || 'client',
      full_name: userData.username || '',
      phone: '',
      created_at: ''
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setProfile(null);
  };

  const isAdminEmail = ['78177233ds@gmail.com', 'papesamabutik@gmail.com'].includes(profile?.email?.toLowerCase() || '');

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

