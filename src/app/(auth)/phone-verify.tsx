import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { config } from '../../lib/config';
import { Button, Input } from '../../components/ui';

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Sending OTP to phone:', phone);
      
      // Direct API call to bypass Supabase client issues
      console.log('Using credentials:', {
        url: config.supabaseUrl,
        keyLength: config.supabaseAnonKey.length,
        keyStart: config.supabaseAnonKey.substring(0, 30) + '...'
      });
      
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'apikey': config.supabaseAnonKey,
          },
          body: JSON.stringify({ phone })
        }
      );

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to send OTP: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);

      if (!data?.success) {
        const errorMsg = data?.error || 'Failed to send OTP';
        console.error('OTP send failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('OTP sent successfully');
      setStep('otp');
    } catch (err: unknown) {
      console.error('Send OTP error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      
      // Show detailed error in alert for debugging
      alert(`OTP Send Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Verifying OTP for phone:', phone);
      
      // Direct API call to verify-otp
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'apikey': config.supabaseAnonKey,
          },
          body: JSON.stringify({ 
            phone, 
            code: otp,
            user_id: user?.id,
            is_signup: false
          })
        }
      );

      console.log('Verify response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Verify API error:', errorText);
        throw new Error(`Verification failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Verify API response:', data);

      if (!data?.success || !data?.verified) {
        throw new Error(data?.error || 'Invalid OTP');
      }

      console.log('OTP verified successfully');
      
      // The Edge Function already updated user metadata with phone_verified: true
      // Force reload to pick up the updated user data
      console.log('Phone verification complete! Reloading page...');
      
      // For web, use window.location to force a full page reload
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        // For mobile, use router
        router.replace('/');
      }
    } catch (err: unknown) {
      console.error('Verify OTP error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid OTP';
      setError(errorMessage);
      alert(`Verification Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? 'Phone verification is required for security. Enter your phone number to receive OTP.'
              : `Enter the OTP sent to +91 ${phone}`}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 'phone' ? (
          <>
            <Input
              label="Phone Number"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              fullWidth
            />
          </>
        ) : (
          <>
            <Input
              label="OTP"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button
              title="Verify OTP"
              onPress={handleVerifyOtp}
              loading={loading}
              fullWidth
            />
            <Button
              title="Change Phone Number"
              onPress={() => setStep('phone')}
              variant="ghost"
              fullWidth
              style={styles.changeButton}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  changeButton: {
    marginTop: 12,
  },
});
