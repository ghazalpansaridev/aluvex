import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const router = useRouter();
  const { logout } = useAuth();

  const handlePress = () => {
    console.log('Navigating to categories...');
    router.push('/categories');
  };

  const handleLogout = async () => {
    console.log('Logout button pressed'); // Debug log
    try {
      await logout();
      console.log('Logged out successfully'); // Debug log
      router.replace('/auth');
      console.log('Navigation called'); // Debug log
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to AluVex 🚀</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>View Categories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            console.log('LOGOUT BUTTON CLICKED!!!');
            handleLogout();
          }}
          activeOpacity={0.7}
          testID="logout-button"
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ff3b30',
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});