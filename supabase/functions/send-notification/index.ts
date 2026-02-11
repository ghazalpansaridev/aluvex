import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const fcmProjectId = Deno.env.get('FCM_PROJECT_ID');
const fcmClientEmail = Deno.env.get('FCM_CLIENT_EMAIL');
const fcmPrivateKey = Deno.env.get('FCM_PRIVATE_KEY');

interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, string>;
}

async function getFcmAccessToken(): Promise<string> {
  if (!fcmClientEmail || !fcmPrivateKey) {
    throw new Error('FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY must be set');
  }
  
  try {
    // Unescape JSON-encoded newlines if present (Firebase service account keys often have \n as \\n)
    const privateKeyPem = fcmPrivateKey.replace(/\\n/g, '\n');
    console.log('🔑 [Edge Function] Importing FCM private key...');
    
    // Parse PEM format to get the key data
    const pemContents = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    // Import the key using Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      true,
      ['sign']
    );
    console.log('✅ [Edge Function] Private key imported successfully');
    
    console.log('🔑 [Edge Function] Generating JWT...');
    const now = Math.floor(Date.now() / 1000);
    
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: fcmClientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };
    
    const jwt = await create(header, payload, cryptoKey);
    console.log('✅ [Edge Function] JWT signed successfully');
    
    console.log('🔑 [Edge Function] Requesting OAuth2 token...');
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FCM OAuth2 failed: ${res.status} ${text}`);
    }
    
    const json = await res.json();
    console.log('✅ [Edge Function] FCM access token obtained successfully');
    return json.access_token;
  } catch (error) {
    console.error('❌ [Edge Function] FCM access token generation failed:', error);
    throw new Error(`Failed to get FCM access token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function sendFcm(
  accessToken: string,
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`;
  const message = {
    message: {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channel_id: 'default',
        },
      },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const text = await res.text();
    let errDetail = text;
    try {
      const j = JSON.parse(text);
      errDetail = j.error?.message ?? j.error?.code ?? text;
    } catch (_) {}
    return { ok: false, error: `${res.status}: ${errDetail}` };
  }
  return { ok: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
      status: 200,
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = await req.json();

    console.log('📨 [Edge Function] Received notification request:', {
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
    });

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: {
          ...payload.data,
          is_push_sent: false,
        },
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ [Edge Function] Failed to create notification:', notificationError);
      throw notificationError;
    }
    console.log('✅ [Edge Function] Notification record created:', notification.id);

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('fcm_token, expo_push_token')
      .eq('user_id', payload.user_id)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ [Edge Function] Failed to query push tokens:', tokensError);
      throw tokensError;
    }
    console.log('📱 [Edge Function] Found', tokens?.length ?? 0, 'active push token(s)');

    const fcmTokens = (tokens ?? []).filter((r) => r.fcm_token) as { fcm_token: string }[];
    const expoTokens = (tokens ?? []).filter((r) => r.expo_push_token) as { expo_push_token: string }[];
    const data = (payload.data ?? {}) as Record<string, string>;
    const body = payload.body ?? '';
    const pushResults: { provider: string; ok: boolean; error?: string }[] = [];
    let pushSuccess = true;

    if (fcmTokens.length > 0 && fcmProjectId && fcmClientEmail && fcmPrivateKey) {
      try {
        console.log('🔧 [Edge Function] FCM project_id:', fcmProjectId, '| token count:', fcmTokens.length);
        const accessToken = await getFcmAccessToken();
        for (const row of fcmTokens) {
          const result = await sendFcm(
            accessToken,
            row.fcm_token,
            payload.title,
            body,
            data
          );
          pushResults.push({ provider: 'fcm', ok: result.ok, error: result.error });
          if (result.ok) {
            console.log('✅ [Edge Function] FCM accepted for token', row.fcm_token.substring(0, 20) + '...');
          } else {
            console.error('❌ [Edge Function] FCM rejected:', result.error, '| token:', row.fcm_token.substring(0, 30) + '...');
          }
          if (!result.ok) pushSuccess = false;
        }
      } catch (e) {
        console.error('❌ [Edge Function] FCM send failed:', e);
        pushResults.push({ provider: 'fcm', ok: false, error: String(e) });
        pushSuccess = false;
      }
    } else if (fcmTokens.length > 0) {
      console.warn('⚠️ [Edge Function] FCM tokens present but FCM not configured: projectId=', !!fcmProjectId, 'clientEmail=', !!fcmClientEmail, 'privateKey=', !!fcmPrivateKey);
    }

    if (expoTokens.length > 0) {
      const expoMessages = expoTokens.map((row) => ({
        to: row.expo_push_token,
        sound: 'default',
        title: payload.title,
        body,
        data: payload.data ?? {},
      }));
      const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expoMessages),
      });
      const expoJson = await expoRes.json();
      const expoOk = expoJson.data?.every((r: { status: string }) => r.status === 'ok');
      pushResults.push({ provider: 'expo', ok: expoOk });
      if (!expoOk) pushSuccess = false;
      console.log('✅ [Edge Function] Expo push sent to', expoTokens.length, 'token(s)');
    }

    await supabase
      .from('notifications')
      .update({
        data: {
          ...notification.data,
          is_push_sent: pushSuccess,
          push_result: { fcm: pushResults.filter((r) => r.provider === 'fcm'), expo: pushResults.filter((r) => r.provider === 'expo') },
        },
      })
      .eq('id', notification.id);

    if (fcmTokens.length === 0 && expoTokens.length === 0) {
      console.log('⚠️  [Edge Function] No push tokens found for user.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification,
        push_tokens_found: (tokens?.length ?? 0),
        push_sent: pushResults.some((r) => r.ok),
        push_results: pushResults,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ [Edge Function] CRITICAL ERROR:', error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});
