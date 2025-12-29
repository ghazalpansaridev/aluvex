import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const TabsLayout = () => {
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