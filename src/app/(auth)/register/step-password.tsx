import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { z } from 'zod';
import { Button, Input } from '../../../components/ui';
import { RegistrationFormData } from '../../../types';

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

interface StepPasswordProps {
  formData: Partial<RegistrationFormData>;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  onSubmit: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  loading: boolean;
}

export default function StepPassword({
  formData,
  updateFormData,
  onSubmit,
  error,
  setError,
  loading,
}: StepPasswordProps) {
  const [password, setPassword] = useState(formData.password || '');
  const [confirmPassword, setConfirmPassword] = useState(formData.confirmPassword || '');
  const [acceptedTerms, setAcceptedTerms] = useState(formData.acceptedTerms || false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update formData in real-time as user types
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    updateFormData({ password: value });
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    updateFormData({ confirmPassword: value });
  };

  const handleTermsChange = (value: boolean) => {
    setAcceptedTerms(value);
    updateFormData({ acceptedTerms: value });
  };

  const handleSubmit = () => {
    console.log('StepPassword handleSubmit called');
    console.log('Password length:', password.length);
    console.log('Confirm password length:', confirmPassword.length);
    console.log('Accepted terms:', acceptedTerms);
    
    setFieldErrors({});
    setError(null);

    const data = {
      password,
      confirmPassword,
      acceptedTerms,
    };

    const result = passwordSchema.safeParse(data);
    if (!result.success) {
      console.log('Validation failed:', result.error.errors);
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    console.log('Validation passed, calling onSubmit (formData already updated in real-time)');
    // FormData is already updated in real-time, just call onSubmit
    onSubmit();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Password</Text>
      <Text style={styles.subtitle}>Create a secure password for your account</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Input
        label="Password"
        placeholder="Enter password"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry
        error={fieldErrors.password}
        hint="Minimum 8 characters"
        required
      />

      <Input
        label="Confirm Password"
        placeholder="Re-enter password"
        value={confirmPassword}
        onChangeText={handleConfirmPasswordChange}
        secureTextEntry
        error={fieldErrors.confirmPassword}
        required
      />

      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => handleTermsChange(!acceptedTerms)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
          {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.termsText}>
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </TouchableOpacity>
      {fieldErrors.acceptedTerms && (
        <Text style={styles.termsError}>{fieldErrors.acceptedTerms}</Text>
      )}

      <Button
        title="Create Account"
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        style={styles.nextButton}
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  termsError: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 16,
    marginLeft: 36,
  },
  nextButton: {
    marginTop: 24,
  },
});
