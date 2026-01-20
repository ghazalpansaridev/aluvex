import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { z } from 'zod';
import { Button, Input } from '../../../components/ui';
import { RegistrationFormData } from '../../../types';

const ownerSchema = z.object({
  ownerName: z.string().min(2, 'Owner name is required'),
  ownerDob: z.string().optional(),
  ownerPhone: z.string().length(10, 'Phone number must be 10 digits'),
  alternatePhone: z.string().optional(),
});

interface StepOwnerProps {
  formData: Partial<RegistrationFormData>;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export default function StepOwner({
  formData,
  updateFormData,
  onNext,
  onBack,
  error,
  setError,
}: StepOwnerProps) {
  const [ownerName, setOwnerName] = useState(formData.ownerName || '');
  const [ownerDob, setOwnerDob] = useState(formData.ownerDob || '');
  const [ownerPhone, setOwnerPhone] = useState(formData.ownerPhone || '');
  const [alternatePhone, setAlternatePhone] = useState(formData.alternatePhone || '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    setFieldErrors({});
    setError(null);

    const data = {
      ownerName,
      ownerDob: ownerDob || undefined,
      ownerPhone,
      alternatePhone: alternatePhone || undefined,
    };

    const result = ownerSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    updateFormData(data);
    onNext();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Information</Text>
      <Text style={styles.subtitle}>Enter the business owner details</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Input
        label="Owner Name"
        placeholder="Enter full name"
        value={ownerName}
        onChangeText={setOwnerName}
        error={fieldErrors.ownerName}
        required
      />

      <Input
        label="Date of Birth"
        placeholder="DD/MM/YYYY (optional)"
        value={ownerDob}
        onChangeText={setOwnerDob}
        error={fieldErrors.ownerDob}
        hint="Format: DD/MM/YYYY"
      />

      <Input
        label="Phone Number"
        placeholder="Enter 10-digit phone number"
        value={ownerPhone}
        onChangeText={setOwnerPhone}
        keyboardType="phone-pad"
        maxLength={10}
        error={fieldErrors.ownerPhone}
        required
      />

      <Input
        label="Alternate Phone"
        placeholder="Enter alternate number (optional)"
        value={alternatePhone}
        onChangeText={setAlternatePhone}
        keyboardType="phone-pad"
        maxLength={10}
        error={fieldErrors.alternatePhone}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          onPress={onBack}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Continue"
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
