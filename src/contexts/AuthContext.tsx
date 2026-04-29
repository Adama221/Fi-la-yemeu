import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthModel } from 'pocketbase';
import { pb } from '../lib/pocketbase';

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
  user: AuthModel | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAffiliate: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.model);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthChange = () => {
      const model = pb.authStore.model;
      setUser(model);
      if (model) {
        // Map PB record to UserProfile
        setProfile({
          id: model.id,
          email: model.email,
          role: model.role || 'client',
          full_name: model.full_name || model.name || '',
          phone: model.phone || '',
          created_at: model.created || ''
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    // Initialize
    handleAuthChange();

    const unsubscribe = pb.authStore.onChange(handleAuthChange);

    return () => {
      unsubscribe();
    };
  }, []);

  const logout = () => {
    pb.authStore.clear();
  };

  const isAdminEmail = ['78177233ds@gmail.com', 'Papesamabutik@gmail.com'].includes(profile?.email || '');

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || isAdminEmail || user?.collectionName === '_superusers',
    isAffiliate: profile?.role === 'affiliate',
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
