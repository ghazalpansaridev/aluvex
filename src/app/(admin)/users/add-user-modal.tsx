import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { inviteStaffUser, checkEmailExists } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'ops' | 'sales' | '';
  region: string;
  pincode: string;
  address: string;
}

export function AddUserModal({ visible, onClose, onSuccess }: AddUserModalProps) {
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    region: '',
    pincode: '',
    address: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const emailInputRef = useRef<any>(null);

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: '',
      region: '',
      pincode: '',
      address: '',
    });
    setErrors({});
    setCurrentStep(1);
    setEmailExists(false);
    setEmailError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Step 1: Email Check
  const handleEmailBlur = async () => {
    if (!formData.email) {
      setEmailError('Email is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Invalid email format');
      setEmailExists(false);
      return;
    }

    setCheckingEmail(true);
    setEmailError(null);

    try {
      const result = await checkEmailExists(formData.email, supabase);
      
      if (result.exists) {
        setEmailExists(true);
        setEmailError('Account already exists');
      } else {
        setEmailExists(false);
        setEmailError(null);
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailError('Failed to check email. Please try again.');
    } finally {
      setCheckingEmail(false);
    }
  };

  const canProceedFromStep1 = () => {
    return formData.email && !emailExists && !emailError && !checkingEmail;
  };

  // Step 2: User Details
  const validateStep2 = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    if (!formData.role) {
      newErrors.role = 'Profile type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceedFromStep2 = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.phone.trim() &&
      /^\d{10}$/.test(formData.phone) &&
      formData.role !== ''
    );
  };

  // Step 3: Conditional Fields (Sales only)
  const validateStep3 = () => {
    if (formData.role !== 'sales') {
      return true; // Skip validation for non-sales
    }

    const newErrors: Partial<FormData> = {};

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required for Sales';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required for Sales';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required for Sales';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceedFromStep3 = () => {
    if (formData.role !== 'sales') {
      return true;
    }
    return (
      formData.region.trim() &&
      formData.pincode.trim() &&
      /^\d{6}$/.test(formData.pincode) &&
      formData.address.trim()
    );
  };

  // Step 4: Submit
  const handleSubmit = async () => {
    if (!session?.access_token) {
      Alert.alert('Error', 'Session expired. Please login again.');
      return;
    }

    setLoading(true);

    try {
      const requestData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
      };

      if (formData.role === 'sales') {
        requestData.region = formData.region;
        requestData.pincode = formData.pincode;
        requestData.address = formData.address;
      }

      const result = await inviteStaffUser(requestData, session.access_token);

      if (result.success) {
        Alert.alert(
          'Success',
          `Invitation sent to ${formData.email}. The user will receive an email to set up their password.`,
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      Alert.alert('Error', 'Failed to invite user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 1: Enter Email</Text>
      <Text style={styles.stepDescription}>
        We'll check if this email is already registered.
      </Text>

      <Input
        ref={emailInputRef}
        label="Email Address"
        placeholder="user@example.com"
        value={formData.email}
        onChangeText={(text) => {
          setFormData({ ...formData, email: text });
          setEmailError(null);
          setEmailExists(false);
        }}
        onBlur={handleEmailBlur}
        error={emailError || (emailExists ? 'Account already exists' : undefined)}
        keyboardType="email-address"
        autoCapitalize="none"
        required
        editable={!checkingEmail}
      />

      {checkingEmail && (
        <Text style={styles.checkingText}>Checking email availability...</Text>
      )}

      {emailExists && (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>
            This email is already registered. Please use a different email or ask the user to login.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 2: User Details</Text>
      <Text style={styles.stepDescription}>
        Enter the user's basic information.
      </Text>

      <Input
        label="First Name"
        placeholder="John"
        value={formData.firstName}
        onChangeText={(text) => {
          setFormData({ ...formData, firstName: text });
          if (errors.firstName) setErrors({ ...errors, firstName: undefined });
        }}
        error={errors.firstName}
        required
      />

      <Input
        label="Last Name"
        placeholder="Doe"
        value={formData.lastName}
        onChangeText={(text) => {
          setFormData({ ...formData, lastName: text });
          if (errors.lastName) setErrors({ ...errors, lastName: undefined });
        }}
        error={errors.lastName}
        required
      />

      <Input
        label="Phone Number"
        placeholder="9876543210"
        value={formData.phone}
        onChangeText={(text) => {
          const numeric = text.replace(/[^0-9]/g, '');
          setFormData({ ...formData, phone: numeric });
          if (errors.phone) setErrors({ ...errors, phone: undefined });
        }}
        error={errors.phone}
        keyboardType="phone-pad"
        maxLength={10}
        required
      />

      <Select
        label="Profile Type"
        placeholder="Select profile type"
        value={formData.role}
        onChange={(value) => {
          setFormData({ ...formData, role: value as any });
          if (errors.role) setErrors({ ...errors, role: undefined });
        }}
        options={[
          { label: 'Admin', value: 'admin' },
          { label: 'Operations', value: 'operations' },
          { label: 'Sales', value: 'sales' },
        ]}
        error={errors.role}
        required
      />
    </View>
  );

  const renderStep3 = () => {
    if (formData.role !== 'sales') {
      return null; // Skip this step for non-sales
    }

    return (
      <View>
        <Text style={styles.stepTitle}>Step 3: Sales Person Details</Text>
        <Text style={styles.stepDescription}>
          Sales persons need location information for the Contact Us page.
        </Text>

        <Input
          label="Region"
          placeholder="Mumbai"
          value={formData.region}
          onChangeText={(text) => {
            setFormData({ ...formData, region: text });
            if (errors.region) setErrors({ ...errors, region: undefined });
          }}
          error={errors.region}
          required
        />

        <Input
          label="Pincode"
          placeholder="400001"
          value={formData.pincode}
          onChangeText={(text) => {
            const numeric = text.replace(/[^0-9]/g, '');
            setFormData({ ...formData, pincode: numeric });
            if (errors.pincode) setErrors({ ...errors, pincode: undefined });
          }}
          error={errors.pincode}
          keyboardType="number-pad"
          maxLength={6}
          required
        />

        <Input
          label="Address"
          placeholder="123 Main Street, Area Name"
          value={formData.address}
          onChangeText={(text) => {
            setFormData({ ...formData, address: text });
            if (errors.address) setErrors({ ...errors, address: undefined });
          }}
          error={errors.address}
          multiline
          numberOfLines={3}
          required
        />
      </View>
    );
  };

  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>Step 4: Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Please review the information before sending the invitation.
      </Text>

      <View style={styles.reviewSection}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{formData.email}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.phone}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Profile Type:</Text>
          <Text style={styles.reviewValue}>
            {formData.role === 'admin'
              ? 'Admin'
              : formData.role === 'ops'
              ? 'Operations'
              : 'Sales'}
          </Text>
        </View>
        {formData.role === 'sales' && (
          <>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Region:</Text>
              <Text style={styles.reviewValue}>{formData.region}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Pincode:</Text>
              <Text style={styles.reviewValue}>{formData.pincode}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Address:</Text>
              <Text style={styles.reviewValue}>{formData.address}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          An invitation email will be sent to {formData.email} with a link to set up their password.
        </Text>
      </View>
    </View>
  );

  const handleNext = () => {
    if (currentStep === 1) {
      if (canProceedFromStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2() && canProceedFromStep2()) {
        if (formData.role === 'sales') {
          setCurrentStep(3);
        } else {
          setCurrentStep(4);
        }
      }
    } else if (currentStep === 3) {
      if (validateStep3() && canProceedFromStep3()) {
        setCurrentStep(4);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add New User</Text>
              <Button
                title="✕"
                onPress={handleClose}
                variant="ghost"
                size="sm"
                style={styles.closeButton}
              />
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressStep,
                  currentStep >= 1 && styles.progressStepActive,
                ]}
              />
              <View
                style={[
                  styles.progressStep,
                  currentStep >= 2 && styles.progressStepActive,
                ]}
              />
              {formData.role === 'sales' && (
                <View
                  style={[
                    styles.progressStep,
                    currentStep >= 3 && styles.progressStepActive,
                  ]}
                />
              )}
              <View
                style={[
                  styles.progressStep,
                  currentStep >= 4 && styles.progressStepActive,
                ]}
              />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </ScrollView>

            <View style={styles.footer}>
              {currentStep > 1 && (
                <Button
                  title="Back"
                  onPress={handleBack}
                  variant="outline"
                  style={styles.backButton}
                />
              )}
              <View style={styles.spacer} />
              {currentStep < 4 ? (
                <Button
                  title="Next"
                  onPress={handleNext}
                  disabled={
                    (currentStep === 1 && !canProceedFromStep1()) ||
                    (currentStep === 2 && !canProceedFromStep2()) ||
                    (currentStep === 3 && !canProceedFromStep3())
                  }
                />
              ) : (
                <Button
                  title="Send Invitation"
                  onPress={handleSubmit}
                  loading={loading}
                />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    minWidth: 40,
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  checkingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: -12,
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorBoxText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  reviewSection: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  reviewValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#1976D2',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  backButton: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
});
