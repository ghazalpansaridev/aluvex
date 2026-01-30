import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate Supabase credentials
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials');
      throw new Error('Supabase credentials not configured');
    }

    console.log('=== Starting invite-staff-user Edge Function ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Get user token from custom header (passed by frontend)
    const userToken = req.headers.get('x-user-token');
    console.log('User token from x-user-token header:', userToken ? `Present (length: ${userToken.length})` : 'Missing');
    
    if (!userToken) {
      console.error('No user token found in x-user-token header');
      return new Response(
        JSON.stringify({ error: 'User token required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const token = userToken;

    // Create Supabase admin client with service role (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
      },
    });
    
    console.log('Supabase Admin client created with service role key');

    // Verify user token and check admin role
    let currentUser;
    try {
      // Decode JWT to get user ID
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format - not 3 parts');
        return new Response(
          JSON.stringify({ error: 'Invalid token format' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let payload;
      try {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        payload = JSON.parse(jsonPayload);
      } catch (decodeError) {
        console.error('JWT decode error:', decodeError);
        return new Response(
          JSON.stringify({ error: 'Invalid token - cannot decode' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = payload.sub;
      if (!userId) {
        console.error('No user ID in JWT payload');
        return new Response(
          JSON.stringify({ error: 'Invalid token - no user ID' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Decoded user ID from JWT:', userId);

      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (getUserError) {
        console.error('Error fetching user via Admin API:', getUserError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user details', details: getUserError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!userData || !userData.user || !userData.user.id) {
        console.error('No user data returned from Admin API');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid user data' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const user = userData.user;
      const userRole = user.raw_user_meta_data?.role || user.user_metadata?.role;
      
      console.log('User role check:', {
        userId: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        raw_user_meta_data: user.raw_user_meta_data,
        role: userRole
      });
      
      if (userRole !== 'admin') {
        console.error('User is not admin. Role:', userRole);
        return new Response(
          JSON.stringify({ error: 'Only admins can invite users', details: `User role is: ${userRole || 'not set'}` }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Admin verification successful for user:', user.email);
      currentUser = user;
    } catch (authError) {
      console.error('Auth verification error:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify authentication', details: authError instanceof Error ? authError.message : 'Unknown error' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const {
      email,
      firstName,
      lastName,
      phone,
      role,
      region,
      pincode,
      address,
    } = await req.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !phone || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate role
    if (!['admin', 'operations', 'sales'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, operations, or sales' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate phone (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Phone must be 10 digits' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate sales-specific fields
    if (role === 'sales') {
      if (!region || !pincode || !address) {
        return new Response(
          JSON.stringify({ error: 'Sales users require region, pincode, and address' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (!/^\d{6}$/.test(pincode)) {
        return new Response(
          JSON.stringify({ error: 'Pincode must be 6 digits' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Reuse the admin client we already created

    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Email already exists' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare user metadata
    const userMetadata: any = {
      role: role,
      firstName: firstName,
      lastName: lastName,
      phone: phone,
    };

    if (role === 'sales') {
      userMetadata.region = region;
      userMetadata.pincode = pincode;
      userMetadata.address = address;
    }

    // Invite user via Supabase Admin API
    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: userMetadata,
      }
    );

    if (inviteError || !newUser) {
      console.error('Error inviting user:', inviteError);
      return new Response(
        JSON.stringify({ 
          error: inviteError?.message || 'Failed to invite user' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert into staff_users table
    console.log('Preparing to insert into staff_users table for user:', newUser.user.id);
    
    const staffUserData: any = {
      user_id: newUser.user.id,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      role: role,
      status: 'pending_password',
      created_by: currentUser.id,
    };

    if (role === 'sales') {
      staffUserData.region = region;
      staffUserData.pincode = pincode;
      staffUserData.address = address;
    }

    console.log('Staff user data to insert:', JSON.stringify(staffUserData, null, 2));

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('staff_users')
      .insert(staffUserData)
      .select();

    if (insertError) {
      console.error('Error inserting staff user:', JSON.stringify(insertError, null, 2));
      console.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      
      // Try to delete the auth user if staff_users insert fails
      console.log('Attempting to delete auth user due to staff_users insert failure');
      const deleteResult = await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      console.log('Delete auth user result:', deleteResult);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create staff user profile',
          details: insertError.message,
          hint: insertError.hint,
          code: insertError.code,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully inserted into staff_users table:', insertData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User invited successfully',
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in invite-staff-user function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
