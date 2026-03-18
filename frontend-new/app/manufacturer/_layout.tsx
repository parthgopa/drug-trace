import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';

export default function ManufacturerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="generate-qr"
        options={{
          title: 'Generate QR Codes',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
