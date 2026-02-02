import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = await req.json();

    // 1. Create notification record
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

    if (notificationError) throw notificationError;

    // 2. Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', payload.user_id)
      .eq('is_active', true);

    if (tokensError) throw tokensError;

    // 3. Send push notifications via Expo
    if (tokens && tokens.length > 0) {
      const expoPushMessages = tokens.map((tokenRow) => ({
        to: tokenRow.expo_push_token,
        sound: 'default',
        title: payload.title,
        body: payload.body || '',
        data: payload.data || {},
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoPushMessages),
      });

      const pushResult = await response.json();
      console.log('Push notification sent:', pushResult);

      // Update notification record
      await supabase
        .from('notifications')
        .update({
          data: {
            ...notification.data,
            is_push_sent: true,
          },
        })
        .eq('id', notification.id);
    }

    return new Response(JSON.stringify({ success: true, notification }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
