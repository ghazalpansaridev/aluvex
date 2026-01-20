import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui';
import { useAuth } from '../../lib/auth-context';

export default function RejectedScreen() {
  const router = useRouter();
  const { logout, retailer } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleContactSupport = () => {
    // TODO: Replace with actual support email
    Linking.openURL('mailto:support@fittmart.com?subject=Application%20Rejection%20Appeal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>❌</Text>
        <Text style={styles.title}>Application Rejected</Text>
        <Text style={styles.message}>
          Unfortunately, your retailer application has been rejected.
        </Text>

        {retailer?.rejection_reason && (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>Reason for Rejection</Text>
            <Text style={styles.reasonText}>{retailer.rejection_reason}</Text>
          </View>
        )}

        <Text style={styles.subMessage}>
          If you believe this is a mistake or have additional information to provide,
          please contact our support team.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Contact Support"
            onPress={handleContactSupport}
            variant="primary"
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
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  reasonCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  subMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
});
