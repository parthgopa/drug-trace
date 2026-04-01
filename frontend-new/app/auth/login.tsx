import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { theme } from '@/constants/theme';
import { authAPI, storageAPI, InvitationCheck } from '@/services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingInvitation, setCheckingInvitation] = useState(false);
  const [invitationChecked, setInvitationChecked] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationCheck | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateEmail = () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Invalid email format' });
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setErrors({ ...errors, password: 'Password is required' });
      return false;
    }
    if (password.length < 6) {
      setErrors({ ...errors, password: 'Password must be at least 6 characters' });
      return false;
    }
    return true;
  };

  const handleCheckInvitation = async () => {
    if (!validateEmail()) return;

    setCheckingInvitation(true);
    try {
      const response = await authAPI.checkInvitation(email.trim());

      setInvitationData(response);
      setInvitationChecked(true);

      if (response.has_invitation) {
        // User has pending invitation, redirect to password setup
        Alert.alert(
          'Invitation Found',
          `You have been invited as ${response.invitation?.role}. Please set up your password.`,
          [
            {
              text: 'Setup Password',
              onPress: () => {
                router.push({
                  pathname: '/auth/setup-password',
                  params: {
                    email: email.trim(),
                    role: response.invitation?.role,
                    company_name: response.invitation?.company_name || '',
                  },
                });
              },
            },
          ]
        );
      } else if (!response.has_account) {
        Alert.alert(
          'No Account Found',
          'No account or invitation found for this email. Please contact your administrator or sign up as a customer.'
        );
        setInvitationChecked(false);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to check invitation'
      );
      setInvitationChecked(false);
    } finally {
      setCheckingInvitation(false);
    }
  };

  const handleLogin = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(email.trim(), password);

      if (response.success) {
        await storageAPI.saveAuthData(response.token, response.role, response.user);

        // Role-based routing
        switch (response.role) {
          case 'owner':
            router.replace('/owner/dashboard' as any);
            break;
          case 'manufacturer':
            router.replace('/manufacturer/dashboard');
            break;
          case 'distributor':
            router.replace('/distributor/dashboard' as any);
            break;
          case 'retailer':
            router.replace('/retailer/dashboard' as any);
            break;
          case 'customer':
            router.replace('/customer/dashboard');
            break;
          default:
            router.replace('/customer/dashboard');
        }
      } else {
        Alert.alert('Login Failed', response.error || 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.error || 'Unable to connect to server'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setEmail('');
    setPassword('');
    setInvitationChecked(false);
    setInvitationData(null);
    setErrors({});
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          {/* Email Input - Always visible */}
          <CustomInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: undefined });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={errors.email}
            editable={!invitationChecked}
          />

          {/* Show checking indicator */}
          {checkingInvitation && (
            <View style={styles.checkingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.checkingText}>Checking invitation...</Text>
            </View>
          )}

          {/* Continue button - Show if email not checked yet */}
          {!invitationChecked && !checkingInvitation && (
            <CustomButton
              title="Continue"
              onPress={handleCheckInvitation}
              style={styles.continueButton}
            />
          )}

          {/* Password field - Show only after invitation check for existing users */}
          {invitationChecked && invitationData?.has_account && (
            <>
              <View style={styles.invitationInfo}>
                <Text style={styles.invitationText}>✓ Account found for {email}</Text>
                <CustomButton
                  title="Change Email"
                  onPress={handleChangeEmail}
                  variant="outline"
                  size="small"
                />
              </View>

              <CustomInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
                icon="lock-closed-outline"
                error={errors.password}
              />

              <CustomButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <CustomButton
              title="Sign Up"
              onPress={() => router.push('/auth/signup')}
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
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  checkingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  continueButton: {
    marginTop: theme.spacing.md,
  },
  invitationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.success + '15',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  invitationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
  },
});
