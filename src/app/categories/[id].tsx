import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { LoadingSpinner } from '../../components/ui';

/**
 * Legacy category detail route - redirects to home
 * Home will route users to their appropriate catalog based on role
 */
export default function CategoryDetailPage() {
  useEffect(() => {
    console.log('[Category Detail] Legacy route accessed - redirecting to home');
  }, []);

  return <Redirect href="/" />;
}
