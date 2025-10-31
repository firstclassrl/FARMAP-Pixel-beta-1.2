import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Estendi il tipo User per includere raw_user_meta_data
interface ExtendedUser extends User {
  raw_user_meta_data?: {
    full_name?: string;
    role?: string;
    [key: string]: any;
  };
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'commerciale' | 'lettore' | 'production' | 'sales';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: ExtendedUser | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): {
  user: ExtendedUser | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
} {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 useAuth: Session error:', error);
          if (mounted) {
            setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
          }
          return;
        }

        if (session?.user) {
          const user = session.user as ExtendedUser;
          // Load authoritative profile from DB and enforce overrides
          let dbProfile: Profile | null = null;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            dbProfile = data as unknown as Profile | null;
          } catch {}

          const mustBeAdmin = user.email === 'antonio.pasetti@farmapindustry.it';

          if (!dbProfile) {
            // Create minimal profile
            const role: Profile['role'] = mustBeAdmin ? 'admin' : 'lettore';
            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email || '',
              full_name: user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: null,
              role
            } as any);
            dbProfile = {
              id: user.id,
              email: user.email || '',
              full_name: user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: null,
              role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as Profile;
          } else if (mustBeAdmin && dbProfile.role !== 'admin') {
            // Upgrade role persistently
            await supabase.from('profiles').update({ role: 'admin' as any }).eq('id', user.id);
            dbProfile.role = 'admin' as any;
          }

          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              user: user,
              profile: dbProfile!,
              loading: false,
              error: null
            }));
          }
        } else {
          if (mounted) {
            setAuthState(prev => ({ ...prev, loading: false }));
          }
        }
      } catch (error: any) {
        console.error('🔐 useAuth: Error in getInitialSession:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user as ExtendedUser;
          // Reload authoritative profile from DB and enforce overrides
          const mustBeAdmin = user.email === 'antonio.pasetti@farmapindustry.it';
          let dbProfile: Profile | null = null;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            dbProfile = data as unknown as Profile | null;
          } catch {}

          if (!dbProfile) {
            const role: Profile['role'] = mustBeAdmin ? 'admin' : 'lettore';
            await supabase.from('profiles').insert({ id: user.id, email: user.email || '', role } as any);
            dbProfile = { id: user.id, email: user.email || '', full_name: user.email?.split('@')[0] || 'User', avatar_url: null, role, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Profile;
          } else if (mustBeAdmin && dbProfile.role !== 'admin') {
            await supabase.from('profiles').update({ role: 'admin' as any }).eq('id', user.id);
            dbProfile.role = 'admin' as any;
          }

          setAuthState(prev => ({
            ...prev,
            user: user,
            profile: dbProfile!,
            loading: false,
            error: null
          }));
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // DEMO MODE: enable only when explicitly requested via env flag
    const isDemoAuth = import.meta.env.VITE_DEMO_AUTH === 'true';
    if (isDemoAuth) {
      const mockUser = { id: 'demo-user', email, raw_user_meta_data: { full_name: 'Demo User' } } as unknown as ExtendedUser;
      setAuthState(prev => ({ ...prev, loading: false, user: mockUser, hasUser: true } as any));
      return { data: { user: mockUser } as any, error: null };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { data: null, error };
      }

      return { data, error };
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      return { data: null, error };
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null
        });
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signOut
  };
}
