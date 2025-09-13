import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId) // se la colonna si chiama user_id, cambia qui
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null, session: null, profile: null, loading: true, error: null,
  });

  useEffect(() => {
    let mounted = true;

    // 1) Get initial session state with better error handling
    (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setAuthState({ 
              user: null, 
              session: null, 
              profile: null, 
              loading: false, 
              error: `Session error: ${sessionError.message}` 
            });
          }
          return;
        }

        let profile: Profile | null = null;
        if (session?.user) {
          profile = await fetchUserProfile(session.user.id);
        }
        
        if (mounted) {
          setAuthState({ 
            user: session?.user ?? null, 
            session: session ?? null, 
            profile, 
            loading: false, 
            error: null 
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState({ 
            user: null, 
            session: null, 
            profile: null, 
            loading: false, 
            error: `Auth initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      }
    })();

    // 2) Auth state change listener with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      try {
        let profile: Profile | null = null;
        if (session?.user) {
          profile = await fetchUserProfile(session.user.id);
        }
        
        if (mounted) {
          setAuthState({ 
            user: session?.user ?? null, 
            session: session ?? null, 
            profile, 
            loading: false, 
            error: null 
          });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        if (mounted) {
          setAuthState({ 
            user: null, 
            session: null, 
            profile: null, 
            loading: false, 
            error: `Auth state change failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback((email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }), []);

  const signUp = useCallback((email: string, password: string) =>
    supabase.auth.signUp({ email, password }), []);

  const signOut = useCallback(() => {
    setAuthState({ user: null, session: null, profile: null, loading: false, error: null });
    return supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback((email: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` }), []);

  return { ...authState, signIn, signUp, signOut, resetPassword };
};
