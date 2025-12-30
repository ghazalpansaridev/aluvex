import { Stack } from "expo-router";
import { AuthProvider } from "./lib/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="phone-auth" options={{ headerShown: false }} />
        <Stack.Screen name="(b2b)" options={{ headerShown: false}} /> 
        <Stack.Screen name="categories" options={{ headerShown: true,title: 'Categories' }} /> 
        <Stack.Screen name="products" options={{ headerShown: true,title: 'Products' }} /> 
        <Stack.Screen name="auth" options={{ headerShown: true,title: 'Auth' }} />
        <Stack.Screen name="cart" options={{ presentation: 'modal',title: 'Cart' }} />
      </Stack>
    </AuthProvider>
  );
}