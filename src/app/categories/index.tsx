import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { LoadingSpinner } from '../../components/ui';

/**
 * Legacy categories route - redirects to home
 * Home will route users to their appropriate catalog based on role
 */
export default function CategoriesPage() {
  useEffect(() => {
    console.log('[Categories] Legacy route accessed - redirecting to home');
  }, []);

  return <Redirect href="/" />;
}
