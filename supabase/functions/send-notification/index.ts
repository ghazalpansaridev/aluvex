import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT } from 'https://esm.sh/jose@5.9.6';

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
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(fcmPrivateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(fcmClientEmail)
    .setSubject(fcmClientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
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
  return json.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, '\n');
  const lines = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = Uint8Array.from(atob(lines), (c) => c.charCodeAt(0));
  return binary.buffer;
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
    return { ok: false, error: `${res.status}: ${text}` };
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
          if (!result.ok) pushSuccess = false;
        }
        console.log('✅ [Edge Function] FCM push sent to', fcmTokens.length, 'token(s)');
      } catch (e) {
        console.error('❌ [Edge Function] FCM send failed:', e);
        pushResults.push({ provider: 'fcm', ok: false, error: String(e) });
        pushSuccess = false;
      }
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
