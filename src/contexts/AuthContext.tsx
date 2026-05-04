import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
      // 1. Check Supabase session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email || '');
      } else {
        // 2. Fallback to local storage for local SQLite users
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            await fetchProfile(parsedUser.id, parsedUser.email || '');
          } catch (e) {
            console.error('Failed to parse stored user', e);
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email || '');
      } else {
        // Only clear if we don't have a local session
        if (!localStorage.getItem('auth_token')) {
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string, email: string) => {
    // 1. Determine role: Admin whitelist > Supabase Metadata > Default client
    const adminEmails = ['78177233ds@gmail.com', 'papesamabutik@gmail.com', 'pape@samabutik.com'];
    let role: UserRole = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'client';
    
    // Check Supabase metadata if exists
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (sbUser?.user_metadata?.role) {
      role = adminEmails.includes(email.toLowerCase()) ? 'admin' : sbUser.user_metadata.role;
    } else {
      // Fallback: Check local storage for migrated users who might have a role there
      try {
        const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
        if (storedUser.role && !adminEmails.includes(email.toLowerCase())) {
          role = storedUser.role;
        }
      } catch (e) {}
    }

    const name = sbUser?.user_metadata?.full_name || email.split('@')[0];
    
    setProfile({
      id,
      email,
      role,
      full_name: name,
      phone: sbUser?.user_metadata?.phone || '',
      created_at: new Date().toISOString()
    });
  };

  const login = async (userData: any, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    await fetchProfile(userData.id, userData.email || '');
  };

  const logout = async () => {
    await supabase.auth.signOut();
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

