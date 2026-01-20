import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SalesCatalogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales Catalog</Text>
      <Text style={styles.subtitle}>Browse products for retailer orders</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
