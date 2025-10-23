import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// === ENV ===
const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const isDemoAuth = import.meta.env.VITE_DEMO_AUTH === 'true'

if ((!url || !anon) && !isDemoAuth) {
  throw new Error('Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

const finalUrl = url
const finalAnon = anon

// Minimal runtime logs; avoid leaking sensitive info

// === CLIENT ===
export const supabase = createClient<Database>(finalUrl, finalAnon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  db: { schema: 'public' },
  global: { headers: { 'X-Client-Info': 'pixel-crm@1.2.0' } },
})

// Do not expose client globally in production
// DEBUG: Expose supabase globally for debugging (TEMPORARY - REMOVE AFTER DEBUG)
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('🔍 Supabase exposed globally for debugging');
}


// === TEST CONNESSIONE (minimo, per far comparire la richiesta in Network) ===
export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${finalUrl}/rest/v1/profiles?limit=1`, { 
      method: 'GET',
      headers: {
        'apikey': finalAnon,
        'Authorization': `Bearer ${finalAnon}`,
        'Content-Type': 'application/json'
      }
    });
    // Connection is OK if server responds (200, 401, 404 are all valid responses)
    const isOk = [200, 401, 404, 406].includes(res.status);
    console.log('🔍 testConnection result:', { status: res.status, ok: isOk });
    return isOk;
  } catch (e) {
    console.error('🔍 testConnection error:', e);
    return false;
  }
}


// === UTILS (come prima) ===
export function createRealtimeChannel(channelName: string) {
  return supabase.channel(channelName)
}
