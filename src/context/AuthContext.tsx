import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { UserAccess } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userAccess: UserAccess | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userAccess: null,
  loading: true,
  signOut: async () => {},
  loginAsDemo: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsDemo = () => {
    const demoUser = {
      id: 'demo-user-123',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@demo.com',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmation_sent_at: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User;
    
    const demoSession = {
      access_token: 'demo-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: demoUser,
    } as Session;

    setSession(demoSession);
    setUser(demoUser);
    setUserAccess({ user_id: 'demo-user-123', plan: 'pro', status: 'active' });
    localStorage.setItem('demo_mode', 'true');
    setLoading(false);
  };

  const signOut = async () => {
    if (localStorage.getItem('demo_mode')) {
        localStorage.removeItem('demo_mode');
        setSession(null);
        setUser(null);
        setUserAccess(null);
        return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserAccess(null);
  };

  useEffect(() => {
    if (localStorage.getItem('demo_mode') === 'true') {
        loginAsDemo();
        return;
    }

    if (!isSupabaseConfigured()) {
      console.warn("Supabase is not configured. Auth disabled.");
      setLoading(false);
      return;
    }

    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserAccess(session.user.id);
      } else {
        setUserAccess(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_access')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user access:', error);
        // If row doesn't exist yet (race condition with trigger), handle gracefully
      }
      
      if (data) {
        setUserAccess(data as UserAccess);
      }
    } catch (err) {
      console.error('Unexpected error fetching access:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userAccess, loading, signOut, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
