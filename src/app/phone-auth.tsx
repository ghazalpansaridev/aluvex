import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOTP, verifyOTP } from './lib/api';
import { useAuth } from './lib/auth-context';

export default function PhoneAuth() {
  const router = useRouter();
  const { setVerified } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<TextInput>(null);

  // Validate phone number (exactly 10 digits)
  const isValidPhone = /^\d{10}$/.test(phoneNumber);

  // Validate OTP (exactly 6 digits)
  const isValidOTP = /^\d{6}$/.test(otpCode);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await sendOTP(phoneNumber);
      
      if (response.success) {
        setOtpSent(true);
        setSuccessMessage('OTP sent successfully! Please check your phone.');
        setResendCooldown(60); // 60 second cooldown
        // Auto-focus OTP input after a short delay
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 500);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error sending OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!isValidOTP) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyOTP(phoneNumber, otpCode);
      
      console.log('Verify OTP Response:', response); // Debug log
      
      if (response.success && response.verified) {
        await setVerified(true);
        // Navigate immediately, show alert after
        router.replace('/(b2b)');
        // Show success message briefly
        setTimeout(() => {
          Alert.alert('Success', 'Phone number verified successfully!');
        }, 100);
      } else {
        const errorMsg = response.message || response.error || 'OTP verification failed';
        setError(errorMsg);
        console.error('Verification failed:', response); // Debug log
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error verifying OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtpCode('');
    setOtpSent(false);
    await handleSendOTP();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Phone Verification</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to receive an OTP
          </Text>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (10 digits)</Text>
            <TextInput
              style={[
                styles.input,
                phoneNumber && !isValidPhone && styles.inputError,
              ]}
              placeholder="Please enter your phone number"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text.replace(/\D/g, '').slice(0, 10));
                setError(null);
              }}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading && !otpSent}
              autoFocus={!otpSent}
            />
          </View>

          {/* OTP Input (shown after OTP is sent) */}
          {otpSent && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter OTP Code (6 digits)</Text>
              <TextInput
                ref={otpInputRef}
                style={[
                  styles.input,
                  otpCode && !isValidOTP && styles.inputError,
                ]}
                placeholder="123456"
                value={otpCode}
                onChangeText={(text) => {
                  setOtpCode(text.replace(/\D/g, '').slice(0, 6));
                  setError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              {resendCooldown > 0 && (
                <Text style={styles.cooldownText}>
                  Resend OTP in {resendCooldown}s
                </Text>
              )}
            </View>
          )}

          {/* Success Message */}
          {successMessage && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Send OTP Button */}
          {!otpSent && (
            <TouchableOpacity
              style={[
                styles.button,
                (!isValidPhone || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSendOTP}
              disabled={!isValidPhone || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Verify OTP Button */}
          {otpSent && (
            <View>
              <TouchableOpacity
                style={[
                  styles.button,
                  (!isValidOTP || loading) && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={!isValidOTP || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP Button */}
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendCooldown > 0 || loading) && styles.buttonDisabled,
                ]}
                onPress={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                activeOpacity={0.7}
              >
                <Text style={styles.resendButtonText}>
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  cooldownText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});

