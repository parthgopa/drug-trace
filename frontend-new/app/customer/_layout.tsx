import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';

export default function CustomerLayout() {
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
        name="scan"
        options={{
          title: 'Scan Drug',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Scan History',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="report"
        options={{
          title: 'Report Issue',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
