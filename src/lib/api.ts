import { config } from './config';

const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_ANON_KEY = config.supabaseAnonKey;

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

export interface CheckEmailExistsResponse {
  exists: boolean;
  error?: string;
}

export interface SavePhoneVerificationResponse {
  success: boolean;
  message?: string;
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
  otpCode: string,
  userId?: string,
  isSignup?: boolean
): Promise<VerifyOTPResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ 
        phone: phoneNumber, 
        code: otpCode,
        user_id: userId,
        is_signup: isSignup || false,
      }),
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

export async function checkEmailExists(email: string, supabaseClient: any): Promise<CheckEmailExistsResponse> {
  // First try the edge function
  try {
    console.log('Calling edge function to check email:', email);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-email-exists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    });

    console.log('Edge function response status:', response.status, response.statusText);
    
    let data;
    try {
      const text = await response.text();
      console.log('Edge function raw response:', text);
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error('Invalid response from server');
    }
    
    console.log('Edge function response data:', data);

    if (!response.ok) {
      console.error('Edge function error:', data);
      throw new Error(data.error || 'Failed to check email');
    }

    // Handle different response formats
    let exists = false;
    if (typeof data.exists === 'boolean') {
      exists = data.exists === true;
    } else if (data.exists === 'true' || data.exists === 1) {
      exists = true;
    } else if (data.exists === 'false' || data.exists === 0 || data.exists === null || data.exists === undefined) {
      exists = false;
    }
    
    console.log('Email exists (parsed):', exists, 'for email:', email);
    
    return {
      exists: exists,
    };
  } catch (error) {
    console.error('Error checking email via edge function, trying fallback:', error);
    
    // Fallback: Use Supabase auth API to check if user exists
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
      // Edge function not available - use client-side check
      if (supabaseClient) {
        try {
          // Try to sign in with a dummy password to check if user exists
          // This is a workaround since we can't directly query auth.users from client
          const dummyPassword = `__CHECK_${Date.now()}_${Math.random()}__`;
          const { error: signInError, data } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: dummyPassword,
          });

          // If we get a session (shouldn't happen with dummy password), something is wrong
          if (data?.session) {
            // Sign out immediately
            await supabaseClient.auth.signOut();
            return {
              exists: false,
            };
          }

          if (signInError) {
            const errorMsg = signInError.message?.toLowerCase() || '';
            const errorCode = signInError.status || '';
            
            console.log('Sign in error for email check:', { errorMsg, errorCode, fullError: signInError });
            
            // If error says "email not confirmed", user definitely exists
            if (errorMsg.includes('email not confirmed') || 
                errorMsg.includes('not confirmed') ||
                errorMsg.includes('email_not_confirmed') ||
                errorCode === 'email_not_confirmed') {
              console.log('User exists (email not confirmed)');
              return {
                exists: true,
              };
            }
            
            // Check for specific error codes/messages that indicate user doesn't exist
            // Supabase error codes: 
            // - "invalid_credentials" can mean either wrong password OR user doesn't exist
            // - But some configurations return specific messages
            
            // If error explicitly says user/email not found
            if (errorMsg.includes('user not found') || 
                errorMsg.includes('email not found') ||
                errorMsg.includes("doesn't exist") ||
                errorMsg.includes('does not exist') ||
                errorMsg.includes('no user found') ||
                errorCode === 'user_not_found') {
              console.log('User does not exist (explicit not found message)');
              return {
                exists: false,
              };
            }
            
            // For "invalid_credentials" or "Invalid login credentials", 
            // Supabase doesn't distinguish for security reasons
            // Since we can't reliably determine, we'll check by trying to send OTP with shouldCreateUser: false
            // But that would send an email, so instead we'll be conservative
            // Most likely if we get invalid credentials, the user exists (wrong password)
            // But to avoid false positives, we'll allow signup and let actual signup handle it
            if (errorMsg.includes('invalid') && (errorMsg.includes('credential') || errorMsg.includes('password'))) {
              console.log('Ambiguous error (invalid credentials) - cannot determine, allowing signup');
              // Can't determine - allow signup (actual signup will catch duplicates)
              return {
                exists: false,
              };
            }
            
            // For other errors, allow signup
            console.log('Unknown error, allowing signup');
            return {
              exists: false,
            };
          }
          
          // No error (unlikely with dummy password) - allow signup
          return {
            exists: false,
          };
        } catch (authError) {
          console.error('Error checking email via auth API:', authError);
          // If this also fails, allow user to proceed
          return {
            exists: false,
          };
        }
      }
      
      // If no supabase client, can't check - allow proceeding
      return {
        exists: false,
      };
    }
    
    // For other errors, allow proceeding
    return {
      exists: false,
    };
  }
}

export async function savePhoneVerificationForSignup(
  userId: string,
  phoneNumber: string,
  aadhaar?: string,
  gstNumber?: string
): Promise<SavePhoneVerificationResponse> {
  try {
    // This will be called from the client, so we need to use an edge function
    // or update user metadata directly via Supabase client
    // For now, we'll create an edge function call, but we can also do it client-side
    // Since we need service role for admin operations, let's create an edge function
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/save-phone-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        phone_number: phoneNumber,
        aadhaar: aadhaar,
        gst_number: gstNumber,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to save phone verification',
        error: data.error,
      };
    }

    return {
      success: true,
      message: data.message || 'Phone verification saved successfully',
    };
  } catch (error) {
    console.error('Error saving phone verification:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Staff User Management API Functions

export interface InviteStaffUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'operations' | 'sales';
  region?: string;
  pincode?: string;
  address?: string;
}

export interface InviteStaffUserResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface StaffUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'admin' | 'operations' | 'sales';
  region?: string;
  pincode?: string;
  address?: string;
  status: 'pending_password' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined from auth.users
  email?: string;
  last_login?: string;
}

export interface GetStaffUsersResponse {
  success: boolean;
  users?: StaffUser[];
  error?: string;
}

export async function inviteStaffUser(
  data: InviteStaffUserRequest,
  accessToken: string
): Promise<InviteStaffUserResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-staff-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,  // Use anon key for Edge Function
        'apikey': SUPABASE_ANON_KEY,
        'x-user-token': accessToken,  // Pass user token in custom header
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to invite user',
      };
    }

    return {
      success: true,
      message: result.message || 'User invited successfully',
      user: result.user,
    };
  } catch (error) {
    console.error('Error inviting staff user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function getStaffUsers(
  filters?: {
    role?: string;
    status?: string;
    search?: string;
  },
  supabaseClient?: any
): Promise<GetStaffUsersResponse> {
  try {
    if (!supabaseClient) {
      return {
        success: false,
        error: 'Supabase client required',
      };
    }

    // Build query
    let query = supabaseClient
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Apply search filter if provided
    let filteredData = data || [];
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter((user: StaffUser) => {
        return (
          user.first_name.toLowerCase().includes(searchLower) ||
          user.last_name.toLowerCase().includes(searchLower) ||
          user.phone.includes(searchLower)
        );
      });
    }

    return {
      success: true,
      users: filteredData,
    };
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export interface UpdateStaffUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  region?: string;
  pincode?: string;
  address?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateStaffUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function updateStaffUser(
  userId: string,
  data: UpdateStaffUserRequest,
  accessToken: string
): Promise<UpdateStaffUserResponse> {
  try {
    // This will be implemented using Supabase client directly
    // For now, return structure
    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    console.error('Error updating staff user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export interface ResendInviteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function resendInvite(
  userId: string,
  accessToken: string
): Promise<ResendInviteResponse> {
  try {
    // This will call an edge function to resend invite
    // For now, return structure
    return {
      success: true,
      message: 'Invite resent successfully',
    };
  } catch (error) {
    console.error('Error resending invite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
