import { Redirect } from 'expo-router';
import { useAuth } from './lib/auth-context';
import { LoadingSpinner } from '../components/ui';

export default function Index() {
  const { session, role, retailerStatus, isPhoneVerified, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  // Not logged in -> Auth
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but phone not verified -> Phone auth
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
