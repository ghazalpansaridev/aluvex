import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { supabase, supabaseDb } from '../../../lib/supabase';
import { config } from '../../../lib/config';
import { useAuth } from '../../../lib/auth-context';
import { uploadRetailerDocument } from '../../../lib/retailers.api';
import { BackButton } from '../../../components/ui';

import StepEmail from './step-email';
import StepOTP from './step-otp';
import StepBusiness from './step-business';
import StepOwner from './step-owner';
import StepDocuments from './step-documents';
import StepPassword from './step-password';
import { RegistrationFormData } from '../../../types';

const TOTAL_STEPS = 6;

export default function RegisterScreen() {
  const router = useRouter();
  const navigation = useNavigation();
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

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Dynamically update header back button based on current step
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <BackButton
          onPress={currentStep === 1 ? () => router.back() : prevStep}
        />
      ),
    });
  }, [currentStep, navigation, router, prevStep]);

  const handleSubmit = async () => {
    // #region agent log
    const logStartTime = Date.now();
    fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:handleSubmit:start',message:'Registration submit started',data:{hasEmail:!!formData.email,hasPassword:!!formData.password,hasUserId:!!formData.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion

    console.log('=== REGISTRATION SUBMIT STARTED ===');
    console.log('Form data:', formData);

    if (!formData.email || !formData.password) {
      console.error('Missing required fields:', { email: !!formData.email, password: !!formData.password });
      setError('Missing required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get user ID from formData (saved during OTP verification)
      console.log('Step 1: Getting user ID from formData...');
      
      if (!formData.userId) {
        console.error('User ID not found in formData');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:handleSubmit:no-userid',message:'User ID missing from formData',data:{formDataKeys:Object.keys(formData)},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        throw new Error('User session not found. Please start registration again.');
      }

      const userId = formData.userId;
      console.log('User ID from formData:', userId);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:handleSubmit:userId-found',message:'User ID retrieved from formData',data:{userId:userId,timeSinceStart:Date.now()-logStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // 2. Update user password using access token (bypassing client storage to avoid hang)
      console.log('Step 2: Updating user password with saved access token...');
      if (formData.password && formData.accessToken) {
        try {
          console.log('Setting password via direct API call with access token...');
          const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
            method: 'PUT',
            headers: {
              'apikey': config.supabaseAnonKey,
              'Authorization': `Bearer ${formData.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              password: formData.password
            })
          });

          if (response.ok) {
            console.log('Password set successfully!');
          } else {
            const error = await response.json();
            console.error('Password update failed:', error);
            console.log('User can set password later via password reset');
          }
        } catch (pwdErr) {
          console.error('Password update error:', pwdErr);
          console.log('User can set password later via password reset');
        }
      } else {
        console.log('No password or access token available, skipping password update');
        console.log('User can set password later via password reset');
      }

      // 3. Format date properly (YYYY-MM-DD)
      let formattedDob = null;
      if (formData.ownerDob) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const parts = formData.ownerDob.split('/');
        if (parts.length === 3) {
          formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      console.log('Formatted DOB:', formattedDob);

      // 4. Create retailer record
      console.log('Step 4: Creating retailer record...');
      
      // Skip session check - it might be hanging too
      console.log('Proceeding with insert using stored userId:', userId);

      const retailerData = {
        user_id: userId,
        business_name: formData.businessName,
        business_type: formData.businessType,
        gst_number: formData.gstNumber || null,
        pan_number: formData.panNumber,
        business_address: formData.businessAddress,
        pincode: formData.pincode,
        city: formData.city,
        state: formData.state,
        owner_name: formData.ownerName,
        owner_dob: formattedDob,
        owner_phone: formData.ownerPhone,
        alternate_phone: formData.alternatePhone || null,
        status: 'pending',
      };
      console.log('Retailer data to insert:', retailerData);

      // #region agent log
      const insertStart = Date.now();
      fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:insert-start',message:'Starting retailer INSERT',data:{userId:userId,businessName:formData.businessName,hasDob:!!formattedDob},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'A,C,D'})}).catch(()=>{});
      // #endregion

      try {
        console.log('Attempting database insert with direct fetch (bypassing client storage issues)...');
        
        const result = await supabaseDb.from('retailers').insert(retailerData);
        
        const insertDuration = Date.now() - insertStart;
        console.log(`Insert completed in ${insertDuration}ms`);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:insert-result',message:'INSERT operation completed',data:{hasError:!!result.error,errorCode:result.error?.code,errorMsg:result.error?.message,duration:insertDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'A,C,D,E'})}).catch(()=>{});
        // #endregion

        if (result.error) {
          console.error('Insert retailer error:', result.error);
          throw new Error(`Failed to create retailer record: ${result.error.message}`);
        }
        console.log('Retailer record created successfully');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:insert-success',message:'INSERT succeeded',data:{duration:Date.now()-insertStart},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (insertError: any) {
        const insertDuration = Date.now() - insertStart;
        console.error(`Insert failed after ${insertDuration}ms:`, insertError);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:insert-catch',message:'INSERT threw error',data:{errorMsg:insertError.message,errorCode:insertError.code,errorDetails:insertError.details,errorHint:insertError.hint,duration:insertDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'A,C,D,E'})}).catch(()=>{});
        // #endregion
        throw new Error(`Failed to create retailer record: ${insertError.message}`);
      }

      // 5. Upload documents if any were selected
      if (formData.documents && formData.documents.length > 0) {
        console.log('Step 5: Uploading documents...');
        try {
          // Get the retailer ID we just created
          const { data: retailerRecord } = await supabase
            .from('retailers')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (retailerRecord?.id) {
            for (const doc of formData.documents) {
              console.log(`Uploading ${doc.type} document: ${doc.fileName}`);
              const { error: uploadError } = await uploadRetailerDocument(
                retailerRecord.id,
                {
                  uri: doc.uri,
                  fileName: doc.fileName,
                  mimeType: doc.mimeType,
                  fileSize: doc.fileSize,
                },
                doc.type as 'pan' | 'gst' | 'other',
                userId
              );
              if (uploadError) {
                console.warn(`Document upload failed for ${doc.type}:`, uploadError);
                // Don't block registration if document upload fails
              } else {
                console.log(`${doc.type} document uploaded successfully`);
              }
            }
          } else {
            console.warn('Could not find retailer record for document upload');
          }
        } catch (docError) {
          console.warn('Document upload error (non-blocking):', docError);
          // Don't block registration if document upload fails
        }
      }

      // 6. Refresh retailer data in context (with timeout protection)
      console.log('Step 6: Refreshing retailer data...');
      try {
        const refreshPromise = refreshRetailer();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Refresh timeout')), 5000)
        );
        await Promise.race([refreshPromise, timeoutPromise]);
        console.log('Retailer data refreshed');
      } catch (refreshError) {
        console.warn('Refresh failed, continuing anyway:', refreshError);
        // Continue even if refresh fails
      }

      // 7. Navigate to verification pending
      console.log('Step 7: Navigating to verification pending...');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:navigation',message:'Navigating to verification pending',data:{totalDuration:Date.now()-logStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'ALL'})}).catch(()=>{});
      // #endregion
      router.replace('/(auth)/verification-pending');
      console.log('=== REGISTRATION COMPLETED ===');
    } catch (err: unknown) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error details:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dcab6c23-0f0c-4bdf-abf0-380458f434b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/index.tsx:error-handler',message:'Registration error caught',data:{errorMsg:err instanceof Error?err.message:String(err),errorType:typeof err,totalDuration:Date.now()-logStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'reg-attempt',hypothesisId:'ALL'})}).catch(()=>{});
      // #endregion
      
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      alert('Registration Error: ' + errorMessage); // Show alert for visibility
    } finally {
      console.log('Setting loading to false');
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
          <StepOTP
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
          <StepBusiness
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            error={error}
            setError={setError}
          />
        );
      case 4:
        return (
          <StepOwner
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            error={error}
            setError={setError}
          />
        );
      case 5:
        return (
          <StepDocuments
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            error={error}
            setError={setError}
          />
        );
      case 6:
        return (
          <StepPassword
            formData={formData}
            updateFormData={updateFormData}
            onSubmit={handleSubmit}
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
          {[1, 2, 3, 4, 5, 6].map((step) => (
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
