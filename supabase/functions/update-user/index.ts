import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the calling user is admin
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')!.replace('Bearer ', ''));
    if (!caller) throw new Error('Non autorizzato');
    
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', caller.id).single();
    if (profile?.role !== 'admin') throw new Error('Permessi insufficienti');
    
    const { userId, full_name, role } = await req.json();
    if (!userId || !full_name || !role) throw new Error("userId, full_name e role sono richiesti.");

    // Update user profile using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name,
        role: role
      })
      .eq('id', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Errore catturato nella Edge Function update-user:', error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
