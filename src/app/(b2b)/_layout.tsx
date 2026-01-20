import { useEffect } from "react";
import { Tabs, useRouter, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { View, ActivityIndicator } from "react-native";

const TabsLayout = () => {
  const { isVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect if not verified
    if (!isVerified) {
      // Use replace to prevent back navigation
      router.replace("/phone-auth");
    }
  }, [isVerified, router]);

  // Don't render anything if not verified - redirect immediately
  if (!isVerified) {
    return null; // Will redirect via useEffect
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs>
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home', 
            headerShown: false,
            tabBarLabel: 'Home',
            tabBarIcon: () => null,
          }} 
        />
        {/* Remove other tabs - they're at root level, not in (b2b) folder */}
      </Tabs>
    </SafeAreaView>
  );
};

export default TabsLayout;