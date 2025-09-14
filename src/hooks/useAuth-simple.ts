import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'commerciale' | 'lettore';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
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
          // Create a simple profile from user data without database query
          const simpleProfile: Profile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: null,
            role: session.user.user_metadata?.role || 'admin', // Default to admin for now
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          if (mounted) {
            setAuthState(prev => ({ 
              ...prev, 
              user: session.user, 
              profile: simpleProfile, 
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
          // Create a simple profile from user data
          const simpleProfile: Profile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: null,
            role: session.user.user_metadata?.role || 'admin', // Default to admin for now
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setAuthState(prev => ({ 
            ...prev, 
            user: session.user, 
            profile: simpleProfile, 
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
