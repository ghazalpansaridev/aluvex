import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { z } from 'zod';
import { Button, Input, Select } from '../../../components/ui';
import { RegistrationFormData, BusinessType } from '../../../types';

const businessSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.string().min(1, 'Please select a business type'),
  gstNumber: z.string().optional(),
  panNumber: z.string().length(10, 'PAN must be 10 characters').toUpperCase(),
  businessAddress: z.string().min(10, 'Please enter a complete address'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
});

const BUSINESS_TYPES: { label: string; value: BusinessType }[] = [
  { label: 'Trader', value: 'Trader' },
  { label: 'Fabricator', value: 'Fabricator' },
  { label: 'Builder', value: 'Builder' },
  { label: 'Architect', value: 'Architect' },
  { label: 'Other', value: 'Other' },
];

const STATES = [
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Karnataka', value: 'Karnataka' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'West Bengal', value: 'West Bengal' },
  // Add more states as needed
];

interface StepBusinessProps {
  formData: Partial<RegistrationFormData>;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export default function StepBusiness({
  formData,
  updateFormData,
  onNext,
  onBack,
  error,
  setError,
}: StepBusinessProps) {
  const [businessName, setBusinessName] = useState(formData.businessName || '');
  const [businessType, setBusinessType] = useState(formData.businessType || '');
  const [gstNumber, setGstNumber] = useState(formData.gstNumber || '');
  const [panNumber, setPanNumber] = useState(formData.panNumber || '');
  const [businessAddress, setBusinessAddress] = useState(formData.businessAddress || '');
  const [pincode, setPincode] = useState(formData.pincode || '');
  const [city, setCity] = useState(formData.city || '');
  const [state, setState] = useState(formData.state || '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    setFieldErrors({});
    setError(null);

    const data = {
      businessName,
      businessType,
      gstNumber: gstNumber || undefined,
      panNumber: panNumber.toUpperCase(),
      businessAddress,
      pincode,
      city,
      state,
    };

    const result = businessSchema.safeParse(data);
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
      <Text style={styles.title}>Business Details</Text>
      <Text style={styles.subtitle}>Tell us about your business</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Input
        label="Business Name"
        placeholder="Enter business name"
        value={businessName}
        onChangeText={setBusinessName}
        error={fieldErrors.businessName}
        required
      />

      <Select
        label="Business Type"
        placeholder="Select business type"
        value={businessType}
        options={BUSINESS_TYPES}
        onChange={setBusinessType}
        error={fieldErrors.businessType}
        required
      />

      <Input
        label="GST Number"
        placeholder="Enter GST number (optional)"
        value={gstNumber}
        onChangeText={setGstNumber}
        autoCapitalize="characters"
        error={fieldErrors.gstNumber}
      />

      <Input
        label="PAN Number"
        placeholder="Enter PAN number"
        value={panNumber}
        onChangeText={(text) => setPanNumber(text.toUpperCase())}
        autoCapitalize="characters"
        maxLength={10}
        error={fieldErrors.panNumber}
        required
      />

      <Input
        label="Business Address"
        placeholder="Enter complete address"
        value={businessAddress}
        onChangeText={setBusinessAddress}
        multiline
        numberOfLines={3}
        error={fieldErrors.businessAddress}
        required
      />

      <Input
        label="Pincode"
        placeholder="Enter pincode"
        value={pincode}
        onChangeText={setPincode}
        keyboardType="number-pad"
        maxLength={6}
        error={fieldErrors.pincode}
        required
      />

      <Input
        label="City"
        placeholder="Enter city"
        value={city}
        onChangeText={setCity}
        error={fieldErrors.city}
        required
      />

      <Select
        label="State"
        placeholder="Select state"
        value={state}
        options={STATES}
        onChange={setState}
        error={fieldErrors.state}
        required
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
