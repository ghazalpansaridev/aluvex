import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';

interface DrawerContentProps {
  onClose: () => void;
}

export const DrawerContent: React.FC<DrawerContentProps> = ({ onClose }) => {
  const router = useRouter();
  const { session, role, logout } = useAuth();

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleLogout = async () => {
    // For web, use confirm dialog, for mobile use Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        onClose();
        await logout();
        router.replace('/');
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              onClose();
              await logout();
              router.replace('/');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Menu</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.menuContainer}>
        {/* Catalog - visible to all users */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            // Navigate to appropriate catalog based on authentication status and role
            if (!session) {
              // Guest user - go to guest catalog page
              handleNavigation('/catalog-guest');
            } else if (role === 'retailer') {
              // Retailer - go to retailer catalog
              handleNavigation('/(retailer)/catalog');
            } else if (role === 'sales') {
              // Sales - go to sales catalog
              handleNavigation('/(sales)/catalog');
            } else {
              // Other logged-in users - go to standard catalog
              handleNavigation('/categories');
            }
          }}
        >
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuText}>Catalog</Text>
        </TouchableOpacity>

        {/* Show Login/Register only if not logged in */}
        {!session && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/(auth)/login')}
            >
              <Text style={styles.menuIcon}>🔐</Text>
              <Text style={styles.menuText}>Login / Register</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Show role-specific menu items if logged in */}
        {session && (
          <>
            <View style={styles.divider} />
            {role === 'admin' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(admin)/dashboard')}
                >
                  <Text style={styles.menuIcon}>📊</Text>
                  <Text style={styles.menuText}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(admin)/users')}
                >
                  <Text style={styles.menuIcon}>👥</Text>
                  <Text style={styles.menuText}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(admin)/orders')}
                >
                  <Text style={styles.menuIcon}>📋</Text>
                  <Text style={styles.menuText}>Orders</Text>
                </TouchableOpacity>
              </>
            )}

            {role === 'operations' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(ops)/orders')}
                >
                  <Text style={styles.menuIcon}>📋</Text>
                  <Text style={styles.menuText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(ops)/items')}
                >
                  <Text style={styles.menuIcon}>📦</Text>
                  <Text style={styles.menuText}>Items</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(ops)/sellers')}
                >
                  <Text style={styles.menuIcon}>🏪</Text>
                  <Text style={styles.menuText}>Sellers</Text>
                </TouchableOpacity>
              </>
            )}

            {role === 'sales' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(sales)/retailers')}
                >
                  <Text style={styles.menuIcon}>👥</Text>
                  <Text style={styles.menuText}>Retailers</Text>
                </TouchableOpacity>
              </>
            )}

            {role === 'retailer' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(retailer)/cart')}
                >
                  <Text style={styles.menuIcon}>🛒</Text>
                  <Text style={styles.menuText}>Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(retailer)/orders')}
                >
                  <Text style={styles.menuIcon}>📋</Text>
                  <Text style={styles.menuText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(retailer)/payments')}
                >
                  <Text style={styles.menuIcon}>💳</Text>
                  <Text style={styles.menuText}>Payments</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Settings for all logged-in users */}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const settingsRoute =
                  role === 'admin'
                    ? '/(admin)/settings'
                    : role === 'operations'
                    ? '/(ops)/settings'
                    : role === 'sales'
                    ? '/(sales)/settings'
                    : '/(retailer)/settings';
                handleNavigation(settingsRoute);
              }}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            {/* Logout for all logged-in users */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 28,
    color: '#333',
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 24,
    width: 32,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  logoutMenuItem: {
    backgroundColor: '#fff5f5',
    marginTop: 8,
  },
  logoutText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
});
