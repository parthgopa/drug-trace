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
        if (role === 'customer') {
          router.replace('/customer/dashboard' as any);
        } else if (role === 'manufacturer') {
          router.replace('/manufacturer/dashboard' as any);
        } else {
          router.replace('/auth/login' as any);
        }
      } else {
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
