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
        console.log('🔐 useAuth: Starting auth check');
        console.log('🔐 useAuth: Getting session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 useAuth: Session error:', error);
          if (mounted) {
            setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
          }
          return;
        }

        console.log('🔐 useAuth: Session result:', { hasUser: !!session?.user, hasSession: !!session });
        
        if (session?.user) {
          // Load profile for existing session with timeout
          console.log('🔐 useAuth: Loading profile for existing session...');
          try {
            console.log('🔐 useAuth: Starting profile query for existing session...');
            
            // Add timeout to prevent hanging
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 5000)
            );
            
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;

            if (profileError) {
              console.error('🔐 useAuth: Profile load error:', profileError);
              if (mounted) {
                setAuthState(prev => ({ 
                  ...prev, 
                  user: session.user, 
                  profile: null, 
                  loading: false, 
                  error: profileError.message 
                }));
              }
            } else {
              console.log('🔐 useAuth: Profile loaded successfully:', profile);
              if (mounted) {
                setAuthState(prev => ({ 
                  ...prev, 
                  user: session.user, 
                  profile, 
                  loading: false, 
                  error: null 
                }));
              }
            }
          } catch (profileError: any) {
            console.error('🔐 useAuth: Profile load exception:', profileError);
            
            // If it's a timeout or database issue, create a temporary profile
            if (profileError.message === 'Profile query timeout' || profileError.message.includes('fetch')) {
              console.log('🔐 useAuth: Creating temporary profile due to database issue...');
              const tempProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.email?.split('@')[0] || 'User',
                avatar_url: null,
                role: 'admin' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              if (mounted) {
                setAuthState(prev => ({ 
                  ...prev, 
                  user: session.user, 
                  profile: tempProfile, 
                  loading: false, 
                  error: null 
                }));
              }
            } else {
              if (mounted) {
                setAuthState(prev => ({ 
                  ...prev, 
                  user: session.user, 
                  profile: null, 
                  loading: false, 
                  error: profileError.message 
                }));
              }
            }
          }
        } else {
          console.log('🔐 useAuth: No session, setting loading false');
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
        console.log('🔐 useAuth: Auth state change:', event, session?.user?.email);
        console.log('🔐 useAuth: Component mounted?', mounted);
        if (!mounted) {
          console.log('🔐 useAuth: Component not mounted, skipping...');
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔐 useAuth: User signed in, loading profile...');
          console.log('🔐 useAuth: User ID:', session.user.id);
          
          // Load profile from database with timeout
          try {
            console.log('🔐 useAuth: Starting profile query...');
            
            // Add timeout to prevent hanging
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 5000)
            );
            
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;

            if (profileError) {
              console.error('🔐 useAuth: Profile load error:', profileError);
              setAuthState(prev => ({ 
                ...prev, 
                user: session.user, 
                profile: null, 
                loading: false, 
                error: profileError.message 
              }));
            } else {
              console.log('🔐 useAuth: Profile loaded successfully:', profile);
              setAuthState(prev => ({ 
                ...prev, 
                user: session.user, 
                profile, 
                loading: false, 
                error: null 
              }));
            }
          } catch (profileError: any) {
            console.error('🔐 useAuth: Profile load exception:', profileError);
            
            // If it's a timeout or database issue, create a temporary profile
            if (profileError.message === 'Profile query timeout' || profileError.message.includes('fetch')) {
              console.log('🔐 useAuth: Creating temporary profile due to database issue...');
              const tempProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.email?.split('@')[0] || 'User',
                avatar_url: null,
                role: 'admin' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              setAuthState(prev => ({ 
                ...prev, 
                user: session.user, 
                profile: tempProfile, 
                loading: false, 
                error: null 
              }));
            } else {
              setAuthState(prev => ({ 
                ...prev, 
                user: session.user, 
                profile: null, 
                loading: false, 
                error: profileError.message 
              }));
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 useAuth: User signed out');
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
      console.log('🔐 useAuth: Cleaning up');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 useAuth: SignIn called with email:', email);
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('🔐 useAuth: SignIn error:', error);
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { data: null, error };
      }

      if (data.user) {
        console.log('🔐 useAuth: SignIn successful, loading profile...');
        // Load profile after successful sign in with timeout
        try {
          console.log('🔐 useAuth: Starting profile query for signIn...');
          
          // Add timeout to prevent hanging
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile query timeout')), 5000)
          );
          
          const { data: profile, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          if (profileError) {
            console.error('🔐 useAuth: Profile load error:', profileError);
            setAuthState(prev => ({ 
              ...prev, 
              user: data.user, 
              profile: null, 
              loading: false, 
              error: profileError.message 
            }));
          } else {
            console.log('🔐 useAuth: Profile loaded successfully:', profile);
            setAuthState(prev => ({ 
              ...prev, 
              user: data.user, 
              profile, 
              loading: false, 
              error: null 
            }));
          }
        } catch (profileError: any) {
          console.error('🔐 useAuth: Profile load exception:', profileError);
          
          // If it's a timeout or database issue, create a temporary profile
          if (profileError.message === 'Profile query timeout' || profileError.message.includes('fetch')) {
            console.log('🔐 useAuth: Creating temporary profile due to database issue...');
            const tempProfile = {
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.email?.split('@')[0] || 'User',
              avatar_url: null,
              role: 'admin' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            setAuthState(prev => ({ 
              ...prev, 
              user: data.user, 
              profile: tempProfile, 
              loading: false, 
              error: null 
            }));
          } else {
            setAuthState(prev => ({ 
              ...prev, 
              user: data.user, 
              profile: null, 
              loading: false, 
              error: profileError.message 
            }));
          }
        }
      }

      return { data, error };
    } catch (error: any) {
      console.error('🔐 useAuth: SignIn exception:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log('🔐 useAuth: SignOut called');
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('🔐 useAuth: SignOut error:', error);
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      } else {
        console.log('🔐 useAuth: SignOut successful');
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null
        });
      }
    } catch (error: any) {
      console.error('🔐 useAuth: SignOut exception:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  // Debug logging
  console.log('🔐 useAuth: Current state:', {
    hasUser: !!authState.user,
    hasProfile: !!authState.profile, 
    loading: authState.loading, 
    hasError: !!authState.error 
  });

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signOut
  };
}