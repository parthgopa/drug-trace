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
import { customerAPI } from '@/services/api';

const ISSUE_TYPES = [
  { value: 'counterfeit', label: 'Counterfeit Drug' },
  { value: 'packaging', label: 'Packaging Issue' },
  { value: 'expired', label: 'Expired Product' },
  { value: 'damaged', label: 'Damaged Product' },
  { value: 'other', label: 'Other Issue' },
];

export default function ReportScreen() {
  const [serialNumber, setSerialNumber] = useState('');
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }

    if (!issueType) {
      newErrors.issueType = 'Please select an issue type';
    }

    if (!issueDescription.trim()) {
      newErrors.issueDescription = 'Please describe the issue';
    } else if (issueDescription.trim().length < 10) {
      newErrors.issueDescription = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await customerAPI.submitReport({
        serial_number: serialNumber.trim(),
        issue_type: issueType,
        issue_description: issueDescription.trim(),
      });

      if (response.success) {
        Alert.alert('Success', 'Report submitted successfully', [
          {
            text: 'OK',
            onPress: () => {
              setSerialNumber('');
              setIssueType('');
              setIssueDescription('');
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to submit report');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to submit report'
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
          <Text style={styles.title}>Report an Issue</Text>
          <Text style={styles.subtitle}>
            Help us maintain drug safety by reporting suspicious or problematic products
          </Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Serial Number"
            placeholder="Enter drug serial number"
            value={serialNumber}
            onChangeText={(text) => {
              setSerialNumber(text);
              setErrors({ ...errors, serialNumber: '' });
            }}
            icon="key-outline"
            error={errors.serialNumber}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Issue Type</Text>
            <View style={styles.issueTypeGrid}>
              {ISSUE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.issueTypeButton,
                    issueType === type.value && styles.issueTypeButtonActive,
                  ]}
                  onPress={() => {
                    setIssueType(type.value);
                    setErrors({ ...errors, issueType: '' });
                  }}
                >
                  <Text
                    style={[
                      styles.issueTypeText,
                      issueType === type.value && styles.issueTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.issueType && <Text style={styles.errorText}>{errors.issueType}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description</Text>
            <View
              style={[
                styles.textAreaContainer,
                errors.issueDescription && styles.textAreaError,
              ]}
            >
              <CustomInput
                placeholder="Describe the issue in detail..."
                value={issueDescription}
                onChangeText={(text) => {
                  setIssueDescription(text);
                  setErrors({ ...errors, issueDescription: '' });
                }}
                multiline
                numberOfLines={6}
                style={styles.textArea}
                error={errors.issueDescription}
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Important Information</Text>
            <Text style={styles.infoText}>
              • Your report will be reviewed by our team
            </Text>
            <Text style={styles.infoText}>
              • Provide as much detail as possible
            </Text>
            <Text style={styles.infoText}>
              • False reports may result in account suspension
            </Text>
          </View>

          <CustomButton
            title="Submit Report"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
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
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  issueTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  issueTypeButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  issueTypeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  issueTypeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  issueTypeTextActive: {
    color: theme.colors.text.inverse,
  },
  textAreaContainer: {
    borderRadius: theme.borderRadius.md,
  },
  textAreaError: {
    borderColor: theme.colors.error,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  infoBox: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  submitButton: {
    marginBottom: theme.spacing.md,
  },
});
