import { Redirect } from 'expo-router';
import { useAuth } from './lib/auth-context';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { isVerified, loading } = useAuth();

  // Wait for auth context to finish loading
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  // Redirect based on verification status
  if (isVerified) {
    return <Redirect href="/(b2b)" />;
  } else {
    return <Redirect href="/phone-auth" />;
  }
}

