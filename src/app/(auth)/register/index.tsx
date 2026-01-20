import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth-context';

import StepEmail from './step-email';
import StepBusiness from './step-business';
import StepOwner from './step-owner';
import StepPassword from './step-password';
import { RegistrationFormData } from '../../../types';

const TOTAL_STEPS = 4;

export default function RegisterScreen() {
  const router = useRouter();
  const { refreshRetailer } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({});

  const updateFormData = (data: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('Missing required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'retailer',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create retailer record
      const { error: retailerError } = await supabase.from('retailers').insert({
        user_id: authData.user.id,
        business_name: formData.businessName,
        business_type: formData.businessType,
        gst_number: formData.gstNumber || null,
        pan_number: formData.panNumber,
        business_address: formData.businessAddress,
        pincode: formData.pincode,
        city: formData.city,
        state: formData.state,
        owner_name: formData.ownerName,
        owner_dob: formData.ownerDob || null,
        owner_phone: formData.ownerPhone,
        alternate_phone: formData.alternatePhone || null,
        status: 'pending',
      });

      if (retailerError) throw retailerError;

      // 3. Refresh retailer data in context
      await refreshRetailer();

      // 4. Navigate to verification pending
      router.replace('/(auth)/verification-pending');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepEmail
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            error={error}
            setError={setError}
          />
        );
      case 2:
        return (
          <StepBusiness
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            error={error}
            setError={setError}
          />
        );
      case 3:
        return (
          <StepOwner
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            error={error}
            setError={setError}
          />
        );
      case 4:
        return (
          <StepPassword
            formData={formData}
            updateFormData={updateFormData}
            onSubmit={handleSubmit}
            onBack={prevStep}
            error={error}
            setError={setError}
            loading={loading}
          />
        );
      default:
        return null;
    }
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
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                step <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {renderStep()}
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
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
});
