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
import { useAuth } from '../lib/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PHONE_VERIFICATION_KEY = '@phone_verification_status';

export default function Registration() {
  const router = useRouter();
  const { savePhoneVerificationForSignup, user } = useAuth();
  const [aadhaar, setAadhaar] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const aadhaarInputRef = useRef<TextInput>(null);
  const gstInputRef = useRef<TextInput>(null);

  // Load phone number from AsyncStorage (saved during phone verification)
  useEffect(() => {
    const loadPhoneNumber = async () => {
      try {
        // We need to get the phone number that was verified
        // For now, we'll get it from user metadata if available, or prompt user
        // Actually, we should store it temporarily during phone verification
        const storedPhone = await AsyncStorage.getItem('@verified_phone_number');
        if (storedPhone) {
          setPhoneNumber(storedPhone);
        }
      } catch (err) {
        console.error('Error loading phone number:', err);
      }
    };
    loadPhoneNumber();
  }, []);

  // Aadhaar validation: exactly 12 digits, numeric only
  const isValidAadhaar = /^\d{12}$/.test(aadhaar);

  // GST validation: 15 characters, format: 2 digits + 10 alphanumeric + 1 letter + 1 digit + 1 letter + 1 digit
  // Example: 15PAN1234G1Z5
  const isValidGST = /^\d{2}[A-Z0-9]{10}[A-Z]\d[A-Z]\d$/.test(gstNumber.toUpperCase());

  const handleSubmit = async () => {
    // Validate all fields
    if (!isValidAadhaar) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!isValidGST) {
      setError('Please enter a valid 15-character GST number');
      return;
    }

    if (!phoneNumber) {
      setError('Phone number not found. Please verify your phone again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setError('User not found. Please log in again.');
        return;
      }

      // Save phone verification and registration data to database
      await savePhoneVerificationForSignup(
        phoneNumber,
        aadhaar,
        gstNumber.toUpperCase()
      );

      // Clear temporary phone number storage
      await AsyncStorage.removeItem('@verified_phone_number');

      Alert.alert('Success', 'Registration completed successfully!');
      router.replace('/categories');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      console.error('Error during registration:', err);
    } finally {
      setLoading(false);
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
        <View style={styles.content}>
          <Text style={styles.title}>Complete Your Registration</Text>
          <Text style={styles.subtitle}>
            Please provide your Aadhaar and GST details to complete your registration
          </Text>

          {/* Aadhaar Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Aadhaar Number (12 digits)</Text>
            <TextInput
              ref={aadhaarInputRef}
              style={[
                styles.input,
                aadhaar && !isValidAadhaar && styles.inputError,
              ]}
              placeholder="Enter your 12-digit Aadhaar number"
              value={aadhaar}
              onChangeText={(text) => {
                setAadhaar(text.replace(/\D/g, '').slice(0, 12));
                setError(null);
              }}
              keyboardType="number-pad"
              maxLength={12}
              editable={!loading}
              autoFocus
            />
            {aadhaar && !isValidAadhaar && (
              <Text style={styles.hintText}>
                Aadhaar must be exactly 12 digits
              </Text>
            )}
          </View>

          {/* GST Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>GST Number (15 characters)</Text>
            <TextInput
              ref={gstInputRef}
              style={[
                styles.input,
                gstNumber && !isValidGST && styles.inputError,
              ]}
              placeholder="e.g., 15PAN1234G1Z5"
              value={gstNumber}
              onChangeText={(text) => {
                // Allow alphanumeric, convert to uppercase
                const cleaned = text.replace(/[^A-Z0-9]/gi, '').slice(0, 15).toUpperCase();
                setGstNumber(cleaned);
                setError(null);
              }}
              autoCapitalize="characters"
              maxLength={15}
              editable={!loading}
            />
            {gstNumber && !isValidGST && (
              <Text style={styles.hintText}>
                GST must be 15 characters (e.g., 15PAN1234G1Z5)
              </Text>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!isValidAadhaar || !isValidGST || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValidAadhaar || !isValidGST || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Complete Registration</Text>
            )}
          </TouchableOpacity>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
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
  hintText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 5,
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});


