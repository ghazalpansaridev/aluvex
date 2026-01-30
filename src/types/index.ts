export * from './database';

// Form types
export interface RegistrationFormData {
  // Step 1
  email: string;
  userId?: string; // Store user ID after OTP verification
  accessToken?: string; // Store access token after OTP verification
  
  // Step 2 - Business Info
  businessName: string;
  businessType: string;
  gstNumber?: string;
  panNumber: string;
  businessAddress: string;
  pincode: string;
  city: string;
  state: string;
  
  // Step 3 - Owner Info
  ownerName: string;
  ownerDob?: string;
  ownerPhone: string;
  alternatePhone?: string;
  
  // Step 4 - Auth
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

// Navigation types
export type RootStackParamList = {
  index: undefined;
  auth: undefined;
  'phone-auth': { isSignup?: boolean };
  registration: undefined;
  '(retailer)': undefined;
  '(ops)': undefined;
  '(admin)': undefined;
  '(sales)': undefined;
};
