import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function PaymentsScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="No transactions"
        description="Your payment history will appear here"
        icon="💳"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
