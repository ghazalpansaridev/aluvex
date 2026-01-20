import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { Card, Button } from '../../../components/ui';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.profileCard}>
        <Text style={styles.role}>Administrator</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Card>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="destructive"
        fullWidth
        style={styles.logoutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  profileCard: {
    marginBottom: 24,
  },
  role: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    marginTop: 'auto',
  },
});
