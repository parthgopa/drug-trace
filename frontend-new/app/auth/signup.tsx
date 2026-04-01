import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { theme } from '@/constants/theme';
import { authAPI, storageAPI } from '@/services/api';

export default function SignupScreen() {
  const [role, setRole] = useState<'customer' | 'manufacturer' | 'owner'>('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    licenseNumber: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (role === 'manufacturer') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required for manufacturers';
      }
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required for manufacturers';
      }
    }

    if (role === 'owner') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required for owners';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,
        ...((role === 'manufacturer' || role === 'owner') && {
          company_name: formData.companyName.trim(),
        }),
        ...(role === 'manufacturer' && {
          license_number: formData.licenseNumber.trim(),
          address: formData.address.trim() || undefined,
        }),
      });

      if (response.success) {
        await storageAPI.saveAuthData(response.token, response.role, response.user);

        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              switch (response.role) {
                case 'owner':
                  router.replace('/owner/dashboard' as any);
                  break;
                case 'manufacturer':
                  router.replace('/manufacturer/dashboard');
                  break;
                case 'customer':
                  router.replace('/customer/dashboard');
                  break;
                default:
                  router.replace('/customer/dashboard');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Registration Failed', response.error || 'Unable to create account');
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Unable to connect to server'
      );
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Drug Track & Trace</Text>
        </View>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
            onPress={() => setRole('customer')}
          >
            <Text
              style={[styles.roleButtonText, role === 'customer' && styles.roleButtonTextActive]}
            >
              Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'manufacturer' && styles.roleButtonActive]}
            onPress={() => setRole('manufacturer')}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === 'manufacturer' && styles.roleButtonTextActive,
              ]}
            >
              Manufacturer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'owner' && styles.roleButtonActive]}
            onPress={() => setRole('owner')}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === 'owner' && styles.roleButtonTextActive,
              ]}
            >
              Owner
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Full Name"
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            icon="person-outline"
            error={errors.name}
          />

          <CustomInput
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={errors.email}
          />

          <CustomInput
            label="Password"
            placeholder="Enter your password"
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

          {role === 'owner' && (
            <CustomInput
              label="Company Name"
              placeholder="Enter your company name"
              value={formData.companyName}
              onChangeText={(text) => updateField('companyName', text)}
              icon="business-outline"
              error={errors.companyName}
            />
          )}

          {role === 'manufacturer' && (
            <>
              <CustomInput
                label="Company Name"
                placeholder="Enter company name"
                value={formData.companyName}
                onChangeText={(text) => updateField('companyName', text)}
                icon="business-outline"
                error={errors.companyName}
              />

              <CustomInput
                label="License Number"
                placeholder="Enter license number"
                value={formData.licenseNumber}
                onChangeText={(text) => updateField('licenseNumber', text)}
                icon="document-text-outline"
                error={errors.licenseNumber}
              />

              <CustomInput
                label="Address (Optional)"
                placeholder="Enter company address"
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
                icon="location-outline"
                multiline
                numberOfLines={3}
              />
            </>
          )}

          <CustomButton
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.signupButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <CustomButton
              title="Sign In"
              onPress={() => router.push('/auth/login')}
              variant="outline"
              size="small"
            />
          </View>
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
    paddingTop: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
  roleSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  roleButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  roleButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  form: {
    width: '100%',
  },
  signupButton: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
});
