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

    console.log('📨 [Edge Function] Received notification request:', {
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
    });

    // 1. Create notification record
    console.log('💾 [Edge Function] Creating notification record in database...');
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

    // 2. Get user's push tokens
    console.log('🔍 [Edge Function] Querying push tokens for user:', payload.user_id);
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', payload.user_id)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ [Edge Function] Failed to query push tokens:', tokensError);
      throw tokensError;
    }

    console.log('📱 [Edge Function] Found', tokens?.length || 0, 'active push token(s)');

    // 3. Send push notifications via Expo
    if (tokens && tokens.length > 0) {
      const expoPushMessages = tokens.map((tokenRow) => ({
        to: tokenRow.expo_push_token,
        sound: 'default',
        title: payload.title,
        body: payload.body || '',
        data: payload.data || {},
      }));

      console.log('📤 [Edge Function] Sending push notification to Expo...');
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoPushMessages),
      });

      const pushResult = await response.json();
      console.log('✅ [Edge Function] Push notification response from Expo:', pushResult);

      // Check if push was successful
      const pushSuccess = pushResult.data?.every((result: any) => result.status === 'ok');
      
      // Update notification record
      await supabase
        .from('notifications')
        .update({
          data: {
            ...notification.data,
            is_push_sent: pushSuccess,
            push_result: pushResult,
          },
        })
        .eq('id', notification.id);
      
      console.log('✅ [Edge Function] Updated notification record with push status:', pushSuccess);
    } else {
      console.log('⚠️  [Edge Function] No push tokens found for user. In-app notification created but no push sent.');
      console.log('⚠️  [Edge Function] User needs to:');
      console.log('   1. Log in to the app on a physical device');
      console.log('   2. Grant notification permissions');
      console.log('   3. Wait for push token to be registered');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      notification,
      push_tokens_found: tokens?.length || 0,
      push_sent: tokens && tokens.length > 0
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ [Edge Function] CRITICAL ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
