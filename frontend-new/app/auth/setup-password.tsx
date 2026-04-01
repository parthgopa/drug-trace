import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { theme } from '@/constants/theme';
import { authAPI, storageAPI } from '@/services/api';

export default function SetupPasswordScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const role = params.role as string;
  const companyName = params.company_name as string;

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    company_name: companyName || '',
    license_number: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (role === 'manufacturer' && !formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required for manufacturers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetupPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.setupPassword({
        email,
        password: formData.password,
        name: formData.name.trim(),
        company_name: formData.company_name.trim() || undefined,
        license_number: formData.license_number.trim() || undefined,
        address: formData.address.trim() || undefined,
      });

      if (response.success) {
        // Save auth data
        await storageAPI.saveAuthData(response.token, response.role, response.user);

        Alert.alert(
          'Account Created',
          `Welcome! Your account has been created successfully.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Role-based routing
                switch (response.role) {
                  case 'manufacturer':
                    router.replace('/manufacturer/dashboard');
                    break;
                  case 'distributor':
                    router.replace('/distributor/dashboard' as any);
                    break;
                  case 'retailer':
                    router.replace('/retailer/dashboard' as any);
                    break;
                  default:
                    router.replace('/customer/dashboard');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Setup Failed', response.error || 'Failed to create account');
      }
    } catch (error: any) {
      Alert.alert(
        'Setup Failed',
        error.response?.data?.error || 'Unable to create account'
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'manufacturer':
        return 'business-outline';
      case 'distributor':
        return 'car-outline';
      case 'retailer':
        return 'storefront-outline';
      default:
        return 'person-outline';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'manufacturer':
        return theme.colors.primary;
      case 'distributor':
        return theme.colors.secondary;
      case 'retailer':
        return theme.colors.info;
      default:
        return theme.colors.text.secondary;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.roleIcon, { backgroundColor: getRoleColor() + '20' }]}>
            <Ionicons name={getRoleIcon() as any} size={48} color={getRoleColor()} />
          </View>
          <Text style={styles.title}>Setup Your Account</Text>
          <Text style={styles.subtitle}>You've been invited as {role}</Text>
        </View>

        <View style={styles.invitationCard}>
          <View style={styles.invitationRow}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.invitationLabel}>Email:</Text>
            <Text style={styles.invitationValue}>{email}</Text>
          </View>
          <View style={styles.invitationRow}>
            <Ionicons name="briefcase-outline" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.invitationLabel}>Role:</Text>
            <Text style={[styles.invitationValue, { color: getRoleColor() }]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </View>
          {companyName && (
            <View style={styles.invitationRow}>
              <Ionicons name="business-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.invitationLabel}>Company:</Text>
              <Text style={styles.invitationValue}>{companyName}</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            icon="person-outline"
            error={errors.name}
          />

          <CustomInput
            label="Password"
            placeholder="Create a password (min 6 characters)"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
          />

          <CustomInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          {role === 'manufacturer' && (
            <>
              <CustomInput
                label="Company Name"
                placeholder="Enter company name"
                value={formData.company_name}
                onChangeText={(text) => updateField('company_name', text)}
                icon="business-outline"
                error={errors.company_name}
              />

              <CustomInput
                label="License Number (Optional)"
                placeholder="Enter license number"
                value={formData.license_number}
                onChangeText={(text) => updateField('license_number', text)}
                icon="document-text-outline"
              />
            </>
          )}

          {(role === 'manufacturer' || role === 'distributor' || role === 'retailer') && (
            <CustomInput
              label="Business Address (Optional)"
              placeholder="Enter business address"
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              icon="location-outline"
              multiline
              numberOfLines={2}
            />
          )}

          <CustomButton
            title="Create Account"
            onPress={handleSetupPassword}
            loading={loading}
            style={styles.setupButton}
          />

          <CustomButton
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  roleIcon: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  invitationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  invitationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  invitationLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  invitationValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  setupButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});
