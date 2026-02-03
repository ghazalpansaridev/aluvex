import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { Card } from '../../components/ui';

export default function AdminSettingsScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Card style={styles.profileCard}>
        <Text style={styles.role}>Administrator</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Card>
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
});
