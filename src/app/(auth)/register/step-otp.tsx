import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui';
import { RegistrationFormData } from '../../../types';

interface StepOTPProps {
  formData: Partial<RegistrationFormData>;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export default function StepOTP({
  formData,
  updateFormData,
  onNext,
  onBack,
  error,
  setError,
}: StepOTPProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyOTP = async () => {
    if (!otp || (otp.length !== 6 && otp.length !== 8)) {
      setError('Please enter a valid OTP code (6 or 8 digits)');
      return;
    }

    if (!formData.email) {
      setError('Email not found. Please go back and try again.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Verifying OTP for email:', formData.email);
      
      // Try 'email' type first (for signInWithOtp)
      let { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'email',
      });

      // If 'email' type fails, try 'magiclink' as fallback
      if (verifyError && verifyError.message?.includes('invalid')) {
        console.log('Trying magiclink type as fallback...');
        const result = await supabase.auth.verifyOtp({
          email: formData.email,
          token: otp,
          type: 'magiclink',
        });
        data = result.data;
        verifyError = result.error;
      }

      if (verifyError) {
        console.error('OTP verification error:', verifyError);
        
        // More helpful error messages
        if (verifyError.message?.includes('expired')) {
          setError('OTP has expired. Please request a new code.');
        } else if (verifyError.message?.includes('invalid')) {
          setError('Invalid OTP code. Please check and try again.');
        } else {
          setError(verifyError.message || 'Verification failed. Please try again.');
        }
        return;
      }

      if (!data.session) {
        setError('OTP verification failed. Please request a new code.');
        return;
      }

      console.log('OTP verified successfully, user authenticated');
      setSuccessMessage('Email verified successfully!');
      
      // Small delay to show success message
      setTimeout(() => {
        onNext();
      }, 500);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    if (!formData.email) {
      setError('Email not found. Please go back and try again.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (resendError) {
        setError(resendError.message || 'Failed to resend OTP');
        return;
      }

      setSuccessMessage('OTP resent successfully! Please check your email.');
      setResendCooldown(60); // 60 second cooldown
      setOtp(''); // Clear the OTP input
    } catch (err) {
      console.error('Error resending OTP:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a verification code to{'\n'}
        <Text style={styles.email}>{formData.email}</Text>
      </Text>

      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          ⏱️ Code expires in 60 seconds. Enter it quickly!
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.otpContainer}>
        <Text style={styles.label}>Enter OTP Code</Text>
        <TextInput
          style={styles.otpInput}
          placeholder="00000000"
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 8))}
          keyboardType="number-pad"
          maxLength={8}
          autoFocus
          editable={!loading}
        />
        <Text style={styles.hint}>Enter the code from your email</Text>
      </View>

      <Button
        title="Verify & Continue"
        onPress={handleVerifyOTP}
        loading={loading}
        fullWidth
        disabled={otp.length < 6}
      />

      <View style={styles.resendContainer}>
        {resendCooldown > 0 ? (
          <Text style={styles.resendText}>
            Resend code in {resendCooldown}s
          </Text>
        ) : (
          <Button
            title="Resend OTP"
            onPress={handleResendOTP}
            variant="ghost"
            disabled={loading}
          />
        )}
      </View>

      <Button
        title="Change Email"
        onPress={onBack}
        variant="outline"
        fullWidth
        disabled={loading}
        style={styles.backButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 24,
    lineHeight: 24,
  },
  email: {
    fontWeight: '600',
    color: '#007AFF',
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
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
  successContainer: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#065F46',
    fontSize: 14,
  },
  otpContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#999',
    paddingVertical: 12,
  },
  backButton: {
    marginTop: 8,
  },
});
