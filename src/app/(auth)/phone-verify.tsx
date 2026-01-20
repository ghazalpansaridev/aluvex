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
import { Button, Input } from '../../components/ui';

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const { savePhoneVerificationForSignup } = useAuth();
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
      // TODO: Implement actual OTP sending via Supabase Edge Function
      // For now, just move to OTP step
      setStep('otp');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
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
      // TODO: Implement actual OTP verification via Supabase Edge Function
      // For now, just save phone verification
      await savePhoneVerificationForSignup(phone);
      router.replace('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid OTP';
      setError(errorMessage);
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
              ? 'Enter your phone number to receive OTP'
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
