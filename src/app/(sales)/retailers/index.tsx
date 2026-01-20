import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function SalesRetailersScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="My Retailers"
        description="Retailers you've registered will appear here"
        icon="🏪"
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
