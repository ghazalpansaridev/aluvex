import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui';
import { useAuth } from '../../lib/auth-context';

export default function VerificationPendingScreen() {
  const router = useRouter();
  const { logout, retailer } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleBrowseCatalog = () => {
    // Allow browsing with MRP-only pricing
    router.push('/(retailer)/catalog?guest=true');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>Application Under Review</Text>
        <Text style={styles.message}>
          Your retailer application is being reviewed by our team. You will
          receive an email notification once your account is approved.
        </Text>
        <Text style={styles.subMessage}>
          This typically takes 1-2 business days.
        </Text>

        {retailer && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Application Details</Text>
            <Text style={styles.infoText}>
              Business: {retailer.business_name}
            </Text>
            <Text style={styles.infoText}>
              Submitted: {new Date(retailer.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Browse Catalog"
            onPress={handleBrowseCatalog}
            variant="outline"
            fullWidth
          />
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
});
