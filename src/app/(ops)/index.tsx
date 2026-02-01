import { Redirect } from 'expo-router';

// Default route for (ops) - redirect to items tab
export default function OpsIndex() {
  return <Redirect href="/(ops)/items" />;
}
