import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/roles';

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
  role: UserRole;
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
  refreshProfile: () => Promise<void>;
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
      // Fast-path: detect and clean corrupted Supabase auth storage
      try {
        const sbKeys = Object.keys(localStorage).filter(k => k.includes('sb-') && k.endsWith('-auth-token'));
        let corrupted = false;
        for (const k of sbKeys) {
          try {
            const raw = localStorage.getItem(k);
            const obj = raw ? JSON.parse(raw) : null;
            // Basic sanity: presence of access_token and refresh_token strings
            if (!obj || typeof obj !== 'object' || !obj.access_token || !obj.refresh_token) {
              corrupted = true; break;
            }
          } catch {
            corrupted = true; break;
          }
        }
        if (corrupted && !sessionStorage.getItem('sb-cleaned')) {
          // Clean once and redirect to login to re-bootstrap
          Object.keys(localStorage).filter(k=>k.includes('sb-')).forEach(k=>localStorage.removeItem(k));
          Object.keys(sessionStorage).filter(k=>k.includes('sb-')).forEach(k=>sessionStorage.removeItem(k));
          sessionStorage.setItem('sb-cleaned', '1');
        }
      } catch {}

      const withTimeout = async <T,>(p: Promise<T>, ms = 1500): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('SESSION_TIMEOUT')), ms);
          p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
        });
      };

      try {
        const { data: { session }, error } = await withTimeout(supabase.auth.getSession());
        if (error) throw error;

        if (session?.user) {
          const user = session.user as ExtendedUser;
          // Try to read profile; fall back gracefully without blocking UI
          let dbProfile: Profile | null = null;
          try {
            const { data, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            if (!profileError) dbProfile = data as unknown as Profile | null;
          } catch {}

          const mustBeAdmin = user.email === 'antonio.pasetti@farmapindustry.it';
          const effectiveProfile: Profile = dbProfile ? {
            ...dbProfile,
            role: (mustBeAdmin ? 'admin' : (dbProfile.role as UserRole)),
          } : {
            id: user.id,
            email: user.email || '',
            full_name: user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: null,
            role: (mustBeAdmin ? 'admin' : 'lettore'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          if (mounted) setAuthState(prev => ({ ...prev, user, profile: effectiveProfile, loading: false, error: null }));
        } else {
          if (mounted) setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error: any) {
        // If session read times out or fails, consider user logged out and proceed to login
        if (error?.message === 'SESSION_TIMEOUT') {
          try {
            Object.keys(localStorage).filter(k=>k.includes('sb-')).forEach(k=>localStorage.removeItem(k));
            Object.keys(sessionStorage).filter(k=>k.includes('sb-')).forEach(k=>sessionStorage.removeItem(k));
          } catch {}
        }
        if (mounted) setAuthState(prev => ({ ...prev, loading: false, user: null, profile: null, error: null }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔵 onAuthStateChange', { event, hasSession: !!session, hasUser: !!session?.user });
        if (!mounted) {
          console.log('🔵 onAuthStateChange - not mounted, returning');
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🟢 SIGNED_IN event', { userId: session.user.id, email: session.user.email });
          const user = session.user as ExtendedUser;
          const mustBeAdmin = user.email === 'antonio.pasetti@farmapindustry.it';
          
          // Set user immediately without waiting for profile
          console.log('🟢 Setting user immediately (before profile load)');
          setAuthState(prev => ({
            ...prev,
            user: user,
            loading: false,
            error: null
          }));

          // Load profile in background without blocking
          (async () => {
            let dbProfile: Profile | null = null;
            try {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
              dbProfile = data as unknown as Profile | null;
            } catch (profileError) {
              console.warn('Profile load error (non-blocking):', profileError);
            }

            const effectiveProfile: Profile = dbProfile ? {
              ...dbProfile,
              role: (mustBeAdmin ? 'admin' : (dbProfile.role as UserRole)),
            } : {
              id: user.id,
              email: user.email || '',
              full_name: user.email?.split('@')[0] || 'User',
              avatar_url: null,
              role: (mustBeAdmin ? 'admin' : 'lettore'),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            console.log('🟢 Updating profile in background', { profileRole: effectiveProfile.role });
            setAuthState(prev => ({
              ...prev,
              profile: effectiveProfile
            }));
          })();
        } else if (event === 'SIGNED_OUT') {
          console.log('🔴 SIGNED_OUT event');
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
    console.log('🔵 signIn called', { email });
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // DEMO MODE: enable only when explicitly requested via env flag
    const isDemoAuth = import.meta.env.VITE_DEMO_AUTH === 'true';
    if (isDemoAuth) {
      console.log('🔵 DEMO MODE');
      const mockUser = { id: 'demo-user', email, raw_user_meta_data: { full_name: 'Demo User' } } as unknown as ExtendedUser;
      setAuthState(prev => ({ ...prev, loading: false, user: mockUser, hasUser: true } as any));
      return { data: { user: mockUser } as any, error: null };
    }
    
    try {
      console.log('🔵 Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      console.log('🔵 supabase.auth.signInWithPassword returned', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        hasError: !!error,
        error: error?.message 
      });

      if (error) {
        console.error('🔴 signIn error', error);
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { data: null, error };
      }

      console.log('🟢 signIn success - returning data immediately');
      // Return data immediately and let onAuthStateChange handle state update
      // This ensures the login doesn't get stuck waiting for profile
      return { data, error: null };
    } catch (error: any) {
      console.error('🔴 signIn exception', error);
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

  const refreshProfile = async () => {
    const currentUser = authState.user;
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('Error refreshing profile:', error);
        return;
      }

      if (data) {
        const mustBeAdmin = currentUser.email === 'antonio.pasetti@farmapindustry.it';
        const effectiveProfile: Profile = {
          ...data,
          role: (mustBeAdmin ? 'admin' : (data.role as UserRole)),
        };
        
        setAuthState(prev => ({
          ...prev,
          profile: effectiveProfile
        }));
      }
    } catch (error: any) {
      console.warn('Error refreshing profile:', error);
    }
  };

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signOut,
    refreshProfile
  };
}
