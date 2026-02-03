import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  message,
  icon = '📭',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // Check if icon is an Ionicons name
  const isIonicon = typeof icon === 'string' && icon.includes('-');
  
  return (
    <View style={styles.container}>
      {isIonicon ? (
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={80} color="#C7C7CC" />
        </View>
      ) : (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {(description || message) && (
        <Text style={styles.description}>{description || message}</Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 150,
  },
});
