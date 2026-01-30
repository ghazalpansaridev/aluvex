import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function SetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    // Check if we have a valid session or token from the invite link
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setValidating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Check if we have token in URL params (for web)
        const token = params.token as string;
        if (token) {
          // Try to exchange token for session
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'invite',
          });
          
          if (error) {
            Alert.alert(
              'Invalid Link',
              'This invitation link is invalid or has expired. Please contact your administrator.',
              [
                {
                  text: 'Go to Login',
                  onPress: () => router.replace('/(auth)/login'),
                },
              ]
            );
            return;
          }
        } else {
          Alert.alert(
            'Invalid Link',
            'This invitation link is invalid or has expired. Please contact your administrator.',
            [
              {
                text: 'Go to Login',
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
          return;
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      Alert.alert('Error', 'Failed to validate invitation link');
    } finally {
      setValidating(false);
    }
  };

  const validatePassword = (pwd: string): string | undefined => {
    if (!pwd) {
      return 'Password is required';
    }
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(pwd)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return undefined;
  };

  const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
    if (!pwd) return { strength: '', color: '#999' };
    
    const validations = [
      pwd.length >= 8,
      /(?=.*[a-z])/.test(pwd),
      /(?=.*[A-Z])/.test(pwd),
      /(?=.*\d)/.test(pwd),
      /(?=.*[@$!%*?&])/.test(pwd),
    ];
    
    const score = validations.filter(Boolean).length;
    
    if (score <= 2) return { strength: 'Weak', color: '#FF3B30' };
    if (score <= 4) return { strength: 'Medium', color: '#FF9500' };
    return { strength: 'Strong', color: '#34C759' };
  };

  const handleSubmit = async () => {
    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Update staff_users status to 'active'
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: statusError } = await supabase
          .from('staff_users')
          .update({ status: 'active' })
          .eq('user_id', user.id);

        if (statusError) {
          console.error('Error updating staff user status:', statusError);
          // Don't fail the whole flow if this fails
        }
      }

      Alert.alert(
        'Success!',
        'Your password has been set successfully. You can now login.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error setting password:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to set password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return <LoadingSpinner fullScreen />;
  }

  const passwordStrength = getPasswordStrength(password);

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
          <Text style={styles.title}>Set Your Password</Text>
          <Text style={styles.description}>
            Welcome! Please set a secure password to activate your account.
          </Text>

          <Input
            label="New Password"
            placeholder="Enter password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors({ ...errors, password: undefined });
              }
            }}
            onBlur={() => {
              const error = validatePassword(password);
              if (error) {
                setErrors({ ...errors, password: error });
              }
            }}
            error={errors.password}
            secureTextEntry
            required
            hint="Must be at least 8 characters with uppercase, lowercase, number, and special character"
          />

          {password && (
            <View style={styles.strengthContainer}>
              <Text style={styles.strengthLabel}>Password Strength:</Text>
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.strength}
              </Text>
            </View>
          )}

          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) {
                setErrors({ ...errors, confirmPassword: undefined });
              }
            }}
            onBlur={() => {
              if (password !== confirmPassword) {
                setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
              }
            }}
            error={errors.confirmPassword}
            secureTextEntry
            required
          />

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirementItem}>• At least 8 characters</Text>
            <Text style={styles.requirementItem}>• One uppercase letter</Text>
            <Text style={styles.requirementItem}>• One lowercase letter</Text>
            <Text style={styles.requirementItem}>• One number</Text>
            <Text style={styles.requirementItem}>• One special character (@$!%*?&)</Text>
          </View>

          <Button
            title="Set Password"
            onPress={handleSubmit}
            loading={loading}
            disabled={!password || !confirmPassword || loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 16,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirements: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  submitButton: {
    marginTop: 8,
  },
});
