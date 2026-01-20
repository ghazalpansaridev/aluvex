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
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { checkEmailExists } from '../lib/api';

type AuthMode = 'signup' | 'login';

export default function Auth() {
  const router = useRouter();
  const { setPhoneVerified } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signup');
  
  // Sign Up state
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  // Email existence check state
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const otpInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Email validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || loginEmail);
  
  // OTP validation (8 digits - Supabase default)
  const isValidOTP = /^\d{8}$/.test(otpCode);
  
  // Password validation (min 6 characters)
  const isValidPassword = password.length >= 6;
  const passwordsMatch = password === confirmPassword;

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle Email Blur - Check if email exists
  const handleEmailBlur = async () => {
    // Only check if email is valid and not empty
    if (!email || !isValidEmail) {
      setEmailExists(false);
      setEmailCheckError(null);
      return;
    }

    setEmailChecking(true);
    setEmailCheckError(null);

    try {
      console.log('Checking email existence for:', email);
      const result = await checkEmailExists(email, supabase);
      
      console.log('Email check result:', result);
      
      // Set emailExists based on the result
      setEmailExists(result.exists);
      
      if (result.exists) {
        console.log('Email exists - blocking signup');
        setEmailCheckError('Account already exists');
      } else {
        console.log('Email does not exist - allowing signup');
        setEmailCheckError(null);
      }
    } catch (err) {
      // Network error - allow proceeding
      console.error('Error checking email existence:', err);
      // Don't block user if check fails
      setEmailCheckError(null);
      setEmailExists(false);
    } finally {
      setEmailChecking(false);
    }
  };

  // Handle Send OTP for Sign Up
  const handleSendOTP = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    // Double-check if email exists before sending OTP
    if (emailExists) {
      setError('Account already exists. Please use login instead.');
      return;
    }

    // If email check is still in progress, wait a bit
    if (emailChecking) {
      setError('Please wait while we verify your email...');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Sending OTP to:', email);
      // First, do a quick check before sending OTP
      const quickCheck = await checkEmailExists(email, supabase);
      if (quickCheck.exists) {
        setEmailExists(true);
        setEmailCheckError('Account already exists');
        setError('Account already exists. Please use login instead.');
        setLoading(false);
        return;
      }

      const { data, error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true, // Allow new user creation
        },
      });

      console.log('OTP Response:', { data, error: otpError });

      if (otpError) {
        console.error('OTP Error details:', otpError);
        setError(otpError.message || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      setSuccessMessage('OTP sent successfully! Please check your email.');
      setResendCooldown(60); // 60 second cooldown
      
      // Auto-focus OTP input after a short delay
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Error sending OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP for Sign Up
  const handleVerifyOTP = async () => {
    if (!isValidOTP) {
      setError('Please enter a valid 8-digit OTP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Verifying OTP for:', email, 'Code length:', otpCode.length);
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'email',
      });

      console.log('Verify OTP Response:', { data, error: verifyError });

      if (verifyError) {
        console.error('Verify OTP Error details:', verifyError);
        setError(verifyError.message || 'OTP verification failed');
        return;
      }

      if (data.session) {
        setOtpVerified(true);
        setSuccessMessage('OTP verified! Please set your password.');
        // Auto-focus password input after a short delay
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 500);
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Error verifying OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Set Password after OTP verification
  const handleSetPassword = async () => {
    if (!isValidPassword) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to set password');
        return;
      }

      // Account created successfully, navigate to phone verification with signup flag
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/phone-auth?isSignup=true');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Error setting password:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    if (!loginPassword) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (signInError) {
        setError(signInError.message || 'Login failed');
        return;
      }

      if (data.session) {
        // Check if phone is verified, if not navigate to phone auth
        const phoneVerified = await AsyncStorage.getItem('@phone_verification_status');
        if (phoneVerified === 'true') {
          router.replace('/categories');
        } else {
          router.replace('/phone-auth');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Error during login:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtpCode('');
    setOtpVerified(false);
    setOtpSent(false);
    await handleSendOTP();
  };

  // Reset form when switching modes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setLoginEmail('');
    setLoginPassword('');
    setEmailExists(false);
    setEmailCheckError(null);
    setEmailChecking(false);
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
          <Text style={styles.title}>
            {mode === 'signup' ? 'Sign Up' : 'Login'}
          </Text>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
              onPress={() => switchMode('signup')}
              disabled={loading}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => switchMode('login')}
              disabled={loading}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <>
              {/* Email Input */}
              {!otpSent && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.emailInputWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        email && !isValidEmail && styles.inputError,
                        emailExists && styles.inputError,
                      ]}
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text.trim());
                        setError(null);
                        // Reset email existence state when user modifies email
                        setEmailExists(false);
                        setEmailCheckError(null);
                      }}
                      onBlur={handleEmailBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!loading && !emailChecking}
                      autoFocus
                    />
                    {emailChecking && (
                      <View style={styles.emailCheckIndicator}>
                        <ActivityIndicator size="small" color="#007AFF" />
                      </View>
                    )}
                  </View>
                  {emailCheckError && (
                    <Text style={styles.emailCheckErrorText}>
                      {emailCheckError}
                    </Text>
                  )}
                </View>
              )}

              {/* OTP Input (shown after OTP is sent) */}
              {otpSent && !otpVerified && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Enter OTP Code (8 digits)</Text>
                  <TextInput
                    ref={otpInputRef}
                    style={[
                      styles.input,
                      otpCode && !isValidOTP && styles.inputError,
                    ]}
                    placeholder="12345678"
                    value={otpCode}
                    onChangeText={(text) => {
                      setOtpCode(text.replace(/\D/g, '').slice(0, 8));
                      setError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={8}
                    editable={!loading}
                  />
                  {resendCooldown > 0 && (
                    <Text style={styles.cooldownText}>
                      Resend OTP in {resendCooldown}s
                    </Text>
                  )}
                </View>
              )}

              {/* Password Inputs (shown after OTP is verified) */}
              {otpVerified && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password (min 6 characters)</Text>
                    <TextInput
                      ref={passwordInputRef}
                      style={[
                        styles.input,
                        password && !isValidPassword && styles.inputError,
                      ]}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError(null);
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={[
                        styles.input,
                        confirmPassword && !passwordsMatch && styles.inputError,
                      ]}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError(null);
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </>
              )}

              {/* Send OTP Button */}
              {!otpSent && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    (!isValidEmail || loading || emailExists || emailChecking) && styles.buttonDisabled,
                  ]}
                  onPress={handleSendOTP}
                  disabled={!isValidEmail || loading || emailExists || emailChecking}
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
              {otpSent && !otpVerified && (
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

              {/* Set Password Button */}
              {otpVerified && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    (!isValidPassword || !passwordsMatch || loading) && styles.buttonDisabled,
                  ]}
                  onPress={handleSetPassword}
                  disabled={!isValidPassword || !passwordsMatch || loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    loginEmail && !isValidEmail && styles.inputError,
                  ]}
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChangeText={(text) => {
                    setLoginEmail(text.trim());
                    setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChangeText={(text) => {
                    setLoginPassword(text);
                    setError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (!isValidEmail || !loginPassword || loading) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!isValidEmail || !loginPassword || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#ffffff',
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
    marginTop: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
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
  emailInputWrapper: {
    position: 'relative',
  },
  emailCheckIndicator: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  emailCheckErrorText: {
    fontSize: 12,
    color: '#c62828',
    marginTop: 5,
  },
});
