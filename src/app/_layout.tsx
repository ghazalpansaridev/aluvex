import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(b2b)" options={{ headerShown: false}} /> 
      <Stack.Screen name="categories" options={{ headerShown: true,title: 'Categories' }} /> 
      <Stack.Screen name="products" options={{ headerShown: true,title: 'Products' }} /> 
      <Stack.Screen name="auth" options={{ headerShown: true,title: 'Auth' }} />
      <Stack.Screen name="cart" options={{ presentation: 'modal',title: 'Cart' }} />
    </Stack>
  );
}``