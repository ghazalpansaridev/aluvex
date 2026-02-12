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
import { Ionicons } from '@expo/vector-icons';
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

  const handleHomeNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.replace(route as any);
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
        {/* Home - visible to all users */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            // Navigate to appropriate catalog based on authentication status and role
            // Use replace to reset the stack so no back button appears on Home
            if (!session) {
              handleHomeNavigation('/catalog-guest');
            } else if (role === 'retailer') {
              handleHomeNavigation('/(retailer)/catalog');
            } else if (role === 'sales') {
              handleHomeNavigation('/(sales)/catalog');
            } else if (role === 'admin') {
              handleHomeNavigation('/(admin)/catalog');
            } else if (role === 'operations') {
              handleHomeNavigation('/(ops)/catalog');
            } else {
              handleHomeNavigation('/catalog-guest');
            }
          }}
        >
          <Ionicons name="home-outline" size={24} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuText}>Home</Text>
        </TouchableOpacity>

        {/* Show Login/Register only if not logged in */}
        {!session && (
          <>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/contact-us')}
            >
              <Ionicons name="call-outline" size={24} color="#333" style={styles.menuIcon} />
              <Text style={styles.menuText}>Contact Us</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/(auth)/login')}
            >
              <Ionicons name="log-in-outline" size={24} color="#333" style={styles.menuIcon} />
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
                  <Ionicons name="stats-chart-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(admin)/users')}
                >
                  <Ionicons name="people-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(admin)/orders')}
                >
                  <Ionicons name="list-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(admin)/items')}
                >
                  <Ionicons name="cube-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Item Management</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(admin)/customers')}
                >
                  <Ionicons name="storefront-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Customer Management</Text>
                </TouchableOpacity>
              </>
            )}

            {role === 'operations' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(ops)/orders')}
                >
                  <Ionicons name="list-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(ops)/items')}
                >
                  <Ionicons name="cube-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Item Management</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(ops)/customers')}
                >
                  <Ionicons name="storefront-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Customer Management</Text>
                </TouchableOpacity>
              </>
            )}

            {role === 'sales' && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(sales)/retailers')}
                >
                  <Ionicons name="people-outline" size={24} color="#333" style={styles.menuIcon} />
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
                  <Ionicons name="cart-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(retailer)/orders')}
                >
                  <Ionicons name="list-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(retailer)/payments')}
                >
                  <Ionicons name="card-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Payments</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigation('/(retailer)/contact-us')}
                >
                  <Ionicons name="call-outline" size={24} color="#333" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Contact Us</Text>
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
              <Ionicons name="settings-outline" size={24} color="#333" style={styles.menuIcon} />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            {/* Logout for all logged-in users */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#ff3b30" style={styles.menuIcon} />
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
    width: 32,
    marginRight: -12,
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
