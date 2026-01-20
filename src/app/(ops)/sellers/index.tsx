import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function OpsSellersScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Seller Management"
        description="Review and manage retailer applications"
        icon="👥"
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
