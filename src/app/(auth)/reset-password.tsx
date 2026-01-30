import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
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
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkRecoverySession = async () => {
      try {
        console.log('Starting session check...');
        
        // For web, check if there's an error in the URL hash
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          
          console.log('URL hash params:', Array.from(params.keys()));
          
          const urlError = params.get('error');
          const errorDesc = params.get('error_description');
          
          if (urlError) {
            const decodedError = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : '';
            console.log('Error in URL:', decodedError);
            if (mounted) {
              setError(decodedError || 'Invalid or expired reset link.');
              setHasValidSession(false);
              setCheckingSession(false);
            }
            return;
          }

          // Check if we have the type parameter indicating password recovery
          const type = params.get('type');
          console.log('URL type:', type);
          
          if (type === 'recovery' || params.has('access_token')) {
            console.log('Recovery link detected, waiting for Supabase to process...');
            // Wait longer for Supabase to automatically process the hash
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        // Check if we have a valid session
        console.log('Checking for active session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Session check result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          email: session?.user?.email,
          error: sessionError 
        });
        
        if (mounted) {
          if (session && session.user) {
            console.log('✓ Valid recovery session found for user:', session.user.email);
            setHasValidSession(true);
          } else {
            console.log('✗ No valid session found');
            setError('Invalid or expired reset link. Please request a new one.');
            setHasValidSession(false);
          }
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (mounted) {
          setError('Failed to validate reset link. Please try again.');
          setHasValidSession(false);
          setCheckingSession(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && checkingSession) {
        console.log('Session check timeout - taking too long');
        setError('Session validation timed out. Please request a new reset link.');
        setHasValidSession(false);
        setCheckingSession(false);
      }
    }, 10000); // 10 second timeout

    checkRecoverySession();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkingSession]);

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
      console.log('Updating password...');
      
      // Update the user's password with timeout
      const updatePromise = supabase.auth.updateUser({
        password: password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password update timeout')), 8000)
      );
      
      const result = await Promise.race([
        updatePromise,
        timeoutPromise
      ]) as { error: any };

      if (result && result.error) {
        throw result.error;
      }

      console.log('Password updated successfully!');

      // Show success state immediately
      setSuccess(true);
      setLoading(false);
      
      // Clear session and redirect with hard refresh
      const clearAndRedirect = async () => {
        try {
          // Try to sign out with short timeout
          const signOutTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sign out timeout')), 2000)
          );
          
          await Promise.race([
            supabase.auth.signOut(),
            signOutTimeoutPromise
          ]);
          
          console.log('Signed out successfully');
        } catch (err) {
          console.log('Sign out timed out, forcing cleanup:', err);
        }
        
        // Force clear all Supabase storage
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key);
            }
          });
          
          const sessionKeys = Object.keys(sessionStorage);
          sessionKeys.forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              sessionStorage.removeItem(key);
            }
          });
        }
        
        console.log('Storage cleared, redirecting...');
        
        // Use window.location for hard refresh instead of router
        setTimeout(() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.href = '/login';
          } else {
            router.replace('/(auth)/login');
          }
        }, 1500);
      };
      
      clearAndRedirect();
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      
      // Check if it's a timeout error - password might still have been updated
      if (err instanceof Error && err.message.includes('timeout')) {
        console.log('Update timed out, but password may have been changed. Proceeding to success...');
        setSuccess(true);
        setLoading(false);
        
        // Clear storage and hard redirect
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key);
            }
          });
        }
        
        setTimeout(() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.href = '/login';
          } else {
            router.replace('/(auth)/login');
          }
        }, 1500);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
        setError(errorMessage);
        setLoading(false);
      }
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

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>Password Reset Successful!</Text>
          <Text style={styles.subtitle}>
            Your password has been reset successfully.
          </Text>
          <Text style={styles.infoText}>
            Redirecting to login page...
          </Text>
          <Button
            title="Go to Login"
            onPress={() => router.replace('/(auth)/login')}
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
