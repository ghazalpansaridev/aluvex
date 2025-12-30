const SUPABASE_URL = 'https://pcbeiqmfjettsmpnhsxv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYmVpcW1mamV0dHNtcG5oc3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODQxNzUsImV4cCI6MjA4MjU2MDE3NX0.j485Hf2WTgVu_AzhE_LiSif7L9j8i6egRbToI8WtrIw';

export interface SendOTPResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  verified: boolean;
  error?: string;
}

export async function sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone: phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to send OTP',
        error: data.error,
      };
    }

    return {
      success: true,
      message: data.message || 'OTP sent successfully',
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function verifyOTP(
  phoneNumber: string,
  otpCode: string
): Promise<VerifyOTPResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone: phoneNumber, code: otpCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'OTP verification failed',
        verified: false,
        error: data.error,
      };
    }

    return {
      success: true,
      message: data.message || 'OTP verified successfully',
      verified: data.verified || false,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

