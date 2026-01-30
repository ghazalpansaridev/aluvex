import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { LoadingSpinner } from '../components/ui';

export default function Index() {
  const { session, role, retailerStatus, isPhoneVerified, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  // Check for password reset flow (tokens in URL)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const fullUrl = window.location.href;
    const hash = window.location.hash;
    
    console.log('[Index] Current URL:', fullUrl);
    console.log('[Index] URL hash:', hash.substring(0, 80) + '...');
    
    // Check if this is a password reset/recovery flow
    // Either the URL contains type=recovery or we came from Supabase verify endpoint
    if (fullUrl.includes('type=recovery') || hash.includes('type=recovery')) {
      console.log('[Index] Password reset flow detected - redirecting to reset-password');
      return <Redirect href="/(auth)/reset-password" />;
    }
  }

  // Not logged in -> Auth
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Phone verification required for all users
  if (!isPhoneVerified) {
    return <Redirect href="/(auth)/phone-verify" />;
  }

  // Route based on role
  switch (role) {
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'ops':
      return <Redirect href="/(ops)/orders" />;
    case 'sales':
      return <Redirect href="/(sales)/catalog" />;
    case 'retailer':
      // Check retailer status
      if (retailerStatus === 'pending') {
        return <Redirect href="/(auth)/verification-pending" />;
      }
      if (retailerStatus === 'rejected') {
        return <Redirect href="/(auth)/rejected" />;
      }
      if (!retailerStatus) {
        // New signup, needs to complete registration
        return <Redirect href="/(auth)/register" />;
      }
      return <Redirect href="/(retailer)/catalog" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
