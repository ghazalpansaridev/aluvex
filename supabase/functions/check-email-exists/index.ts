import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate Supabase credentials
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as environment variables.');
    }

    // Parse request body
    const { email } = await req.json();

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({
          exists: false,
          error: 'Invalid email format',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key (admin access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    try {
      // Query auth.users table directly using SQL
      // Since we have service role key, we can execute SQL directly via PostgREST
      // Use a SQL query to check if user exists
      const sqlQuery = `
        SELECT EXISTS(
          SELECT 1 
          FROM auth.users 
          WHERE email = $1
        ) as user_exists;
      `;
      
      // Execute SQL query using PostgREST
      // We'll use the REST API to execute a function, or create one on the fly
      // Actually, let's use a simpler approach: query via SQL function
      
      // Query using RPC function (must be created in database first)
      let exists = false;
      
      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('check_user_exists_by_email', {
        user_email: email
      });
      
      if (rpcError) {
        console.error('RPC error:', rpcError);
        // If RPC doesn't exist, we need to create it or use alternative
        // For now, throw error to indicate function needs to be created
        throw new Error(`Database function not found: ${rpcError.message}. Please run the migration to create check_user_exists_by_email function.`);
      }
      
      // Parse RPC result
      if (rpcData !== null && rpcData !== undefined) {
        if (typeof rpcData === 'boolean') {
          exists = rpcData;
        } else if (typeof rpcData === 'number') {
          exists = rpcData > 0;
        } else {
          exists = Boolean(rpcData);
        }
        console.log('RPC result:', rpcData, 'exists:', exists);
      } else {
        exists = false;
      }
      
      console.log('Final user exists check result:', exists, 'for email:', email);
      
      return new Response(
        JSON.stringify({
          exists: exists,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (queryError) {
      console.error('Error checking user existence:', queryError);
      
      // Fallback: Try Admin API directly
      try {
        const adminUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
        const adminResponse = await fetch(`${adminUrl}?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          },
        });
        
        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          console.log('Admin API fallback result:', JSON.stringify(adminResult));
          
          let exists = false;
          if (Array.isArray(adminResult)) {
            exists = adminResult.length > 0;
          } else if (adminResult && typeof adminResult === 'object') {
            exists = adminResult.id !== undefined || adminResult.email !== undefined;
          }
          
          return new Response(
            JSON.stringify({
              exists: exists,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (adminError) {
        console.error('Admin API fallback also failed:', adminError);
      }
      
      // If all methods fail, return error
      return new Response(
        JSON.stringify({
          exists: false,
          error: 'Unable to verify email existence',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in check-email-exists function:', error);
    
    // If error is about user not found, that's expected - user doesn't exist
    if (error instanceof Error && error.message.includes('User not found')) {
      return new Response(
        JSON.stringify({
          exists: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        exists: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

