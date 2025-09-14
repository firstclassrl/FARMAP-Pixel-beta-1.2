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
    
    const { email, password, role, full_name } = await req.json();
    if (!email || !password || !role) throw new Error("Email, password e ruolo sono richiesti.");

    // Create user in auth system
    const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { role: role, full_name: full_name }
    });

    if (createError) throw createError;

    // Create profile record in profiles table (without timestamp columns)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.id,
        email: email,
        full_name: full_name,
        role: role
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // If profile creation fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw new Error('Errore nella creazione del profilo utente');
    }

    return new Response(JSON.stringify(newUser), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Errore catturato nella Edge Function:', error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
