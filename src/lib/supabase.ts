import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// === ENV ===
const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url) throw new Error('VITE_SUPABASE_URL missing')
if (!anon) throw new Error('VITE_SUPABASE_ANON_KEY missing')

// (log temporanei, utili per capire se le ENV arrivano al browser)
console.log('🔍 Origin:', window.location.origin)
console.log('🔍 Supabase URL (dbg):', url)
console.log('🔍 Key starts with:', anon.slice(0, 8))

// === CLIENT ===
export const supabase = createClient<Database>(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  db: { schema: 'public' },
  global: { headers: { 'X-Client-Info': 'pixel-crm@1.0.0' } },
})

// DEBUG: esponi il client in Console (rimuovi in produzione)
;(window as any).supabase = supabase
;(globalThis as any).supabase = supabase
console.log('🔧 window.supabase ready?', !!(window as any).supabase)


// === TEST CONNESSIONE (minimo, per far comparire la richiesta in Network) ===
export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${url}/rest/v1/profiles?limit=1`, { 
      method: 'GET',
      headers: {
        'apikey': anon,
        'Authorization': `Bearer ${anon}`,
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
