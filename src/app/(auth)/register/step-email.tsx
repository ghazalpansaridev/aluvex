import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { z } from 'zod';
import { supabase } from '../../../lib/supabase';
import { Button, Input } from '../../../components/ui';
import { RegistrationFormData } from '../../../types';

const emailSchema = z.string().email('Please enter a valid email address');

interface StepEmailProps {
  formData: Partial<RegistrationFormData>;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export default function StepEmail({
  formData,
  updateFormData,
  onNext,
  error,
  setError,
}: StepEmailProps) {
  const [email, setEmail] = useState(formData.email || '');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleNext = async () => {
    setFieldError(null);
    setError(null);

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setFieldError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const { data, error: checkError } = await supabase.functions.invoke('check-email-exists', {
        body: { email },
      });

      if (checkError) {
        // If function doesn't exist, skip the check
        console.log('Email check function not available, skipping...');
      } else if (data?.exists) {
        setFieldError('This email is already registered. Please login instead.');
        setLoading(false);
        return;
      }

      updateFormData({ email });
      onNext();
    } catch (err) {
      console.log('Email check error:', err);
      // Continue anyway if there's an error checking
      updateFormData({ email });
      onNext();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Enter your email to get started</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Input
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={fieldError || undefined}
        required
      />

      <Button
        title="Continue"
        onPress={handleNext}
        loading={loading}
        fullWidth
        disabled={!email}
      />

      <Text style={styles.termsText}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
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
    marginBottom: 32,
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
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
  },
});
