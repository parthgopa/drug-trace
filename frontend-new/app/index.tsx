import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { storageAPI } from '@/services/api';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { token, role } = await storageAPI.getAuthData();

      if (token && role) {
        // Route based on user role
        switch (role) {
          case 'owner':
            router.replace('/owner/dashboard' as any);
            break;
          case 'manufacturer':
            router.replace('/manufacturer/dashboard' as any);
            break;
          case 'distributor':
            router.replace('/distributor/dashboard' as any);
            break;
          case 'retailer':
            router.replace('/retailer/dashboard' as any);
            break;
          case 'customer':
            router.replace('/customer/dashboard' as any);
            break;
          default:
            // Unknown role, go to login
            router.replace('/auth/login' as any);
        }
      } else {
        // No auth data, go to login
        router.replace('/auth/login' as any);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/auth/login' as any);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
