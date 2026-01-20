import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function CartScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Your cart is empty"
        description="Add items from the catalog to get started"
        icon="🛒"
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
