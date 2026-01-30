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
    const { phone, code } = await req.json();

    // Validate inputs
    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: 'Invalid phone number. Must be exactly 10 digits.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: 'Invalid OTP code. Must be exactly 6 digits.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch OTP from database
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phone)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: 'OTP not found or expired. Please request a new OTP.',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if OTP has expired
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // Delete expired OTP
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('phone_number', phone);

      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: 'OTP has expired. Please request a new OTP.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify OTP code
    if (data.otp_code !== code) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: 'Invalid OTP code. Please try again.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // OTP is valid - delete it from database
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('phone_number', phone);

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: 'OTP verified successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

