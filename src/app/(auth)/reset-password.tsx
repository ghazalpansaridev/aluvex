import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button, Input } from '../../components/ui';

export default function ResetPasswordScreen() {
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      try {
        // For web, check if there's an error in the URL hash
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          
          const urlError = params.get('error');
          const errorDesc = params.get('error_description');
          
          if (urlError) {
            const decodedError = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : '';
            if (mounted) {
              setError(decodedError || 'Invalid or expired reset link.');
              setHasValidSession(false);
              setCheckingSession(false);
            }
            return;
          }
        }

        // Extract tokens from URL hash and set session manually
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens from URL...');
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
        
        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session && session.user) {
            console.log('Valid recovery session found');
            setHasValidSession(true);
          } else {
            console.log('No valid session:', sessionError);
            setError('Invalid or expired reset link. Please request a new one.');
            setHasValidSession(false);
          }
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (mounted) {
          setError('Failed to validate reset link');
          setHasValidSession(false);
          setCheckingSession(false);
        }
      }
    };

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleResetPassword = async () => {
    setError(null);

    // Validation
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Sign out to clear the recovery session
      await supabase.auth.signOut();

      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Validating reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasValidSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Invalid Reset Link</Text>
          <Text style={styles.subtitle}>
            {error || 'This password reset link is invalid or has expired.'}
          </Text>
          <Text style={styles.infoText}>
            💡 To reset your password:{'\n'}
            1. Go to Login page{'\n'}
            2. Click "Forgot Password?"{'\n'}
            3. Enter your email{'\n'}
            4. Click the link in the email
          </Text>
          <Button
            title="Request New Reset Link"
            onPress={() => router.replace('/(auth)/forgot-password')}
            fullWidth
            style={styles.button}
          />
          <Button
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            variant="outline"
            fullWidth
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          hint="Minimum 8 characters"
        />

        <Input
          label="Confirm Password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title="Reset Password"
          onPress={handleResetPassword}
          loading={loading}
          fullWidth
        />

        <Button
          title="Cancel"
          onPress={() => router.replace('/(auth)/login')}
          variant="ghost"
          fullWidth
          style={styles.button}
        />
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
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
    width: '100%',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  button: {
    marginTop: 16,
  },
});
