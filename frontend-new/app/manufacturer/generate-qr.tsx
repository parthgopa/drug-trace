import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { theme } from '@/constants/theme';
import { manufacturerAPI } from '@/services/api';

interface QRCode {
  serial_number: string;
  qr_code: string;
}

export default function GenerateQRScreen() {
  const [formData, setFormData] = useState({
    drugName: '',
    batchNumber: '',
    quantity: '',
    manufacturingDate: '',
    expiryDate: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMfgDatePicker, setShowMfgDatePicker] = useState(false);
  const [showExpDatePicker, setShowExpDatePicker] = useState(false);
  const [mfgDate, setMfgDate] = useState(new Date());
  const [expDate, setExpDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.drugName.trim()) {
      newErrors.drugName = 'Drug name is required';
    }

    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = 'Batch number is required';
    }

    const quantity = parseInt(formData.quantity);
    if (!formData.quantity || isNaN(quantity) || quantity < 1) {
      newErrors.quantity = 'Valid quantity is required (minimum 1)';
    } else if (quantity > 10000) {
      newErrors.quantity = 'Maximum quantity is 10,000';
    }

    if (!formData.manufacturingDate) {
      newErrors.manufacturingDate = 'Manufacturing date is required';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (formData.manufacturingDate && formData.expiryDate) {
      const mfgDate = new Date(formData.manufacturingDate);
      const expDate = new Date(formData.expiryDate);
      if (expDate <= mfgDate) {
        newErrors.expiryDate = 'Expiry date must be after manufacturing date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await manufacturerAPI.generateDrugs({
        drug_name: formData.drugName.trim(),
        batch_number: formData.batchNumber.trim(),
        quantity: parseInt(formData.quantity),
        manufacturing_date: formData.manufacturingDate,
        expiry_date: formData.expiryDate,
        description: formData.description.trim() || undefined,
      });

      if (response.success) {
        setQrCodes(response.qr_codes);
        setShowQRModal(true);
        Alert.alert(
          'Success',
          `Generated ${response.quantity} QR codes for batch ${response.batch_number}`
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to generate QR codes');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to generate QR codes'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowQRModal(false);
    setFormData({
      drugName: '',
      batchNumber: '',
      quantity: '',
      manufacturingDate: '',
      expiryDate: '',
      description: '',
    });
    router.back();
  };

  const renderQRItem = ({ item }: { item: QRCode }) => (
    <View style={styles.qrItem}>
      <Image
        source={{ uri: item.qr_code }}
        style={styles.qrImage}
        resizeMode="contain"
      />
      <Text style={styles.qrSerial} numberOfLines={1}>
        {item.serial_number}
      </Text>
    </View>
  );

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
          <Text style={styles.title}>Generate QR Codes</Text>
          <Text style={styles.subtitle}>Create a new batch of drugs with QR codes</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Drug Name"
            placeholder="e.g., Paracetamol 500mg"
            value={formData.drugName}
            onChangeText={(text) => updateField('drugName', text)}
            icon="medical-outline"
            error={errors.drugName}
          />

          <CustomInput
            label="Batch Number"
            placeholder="e.g., BATCH-2024-001"
            value={formData.batchNumber}
            onChangeText={(text) => updateField('batchNumber', text)}
            icon="barcode-outline"
            error={errors.batchNumber}
          />

          <CustomInput
            label="Quantity"
            placeholder="Number of units"
            value={formData.quantity}
            onChangeText={(text) => updateField('quantity', text)}
            keyboardType="number-pad"
            icon="cube-outline"
            error={errors.quantity}
          />

          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Manufacturing Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowMfgDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.dateText}>
                {formData.manufacturingDate || 'Select date'}
              </Text>
            </TouchableOpacity>
            {errors.manufacturingDate && (
              <Text style={styles.errorText}>{errors.manufacturingDate}</Text>
            )}
          </View>

          {showMfgDatePicker && (
            <DateTimePicker
              value={mfgDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowMfgDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setMfgDate(selectedDate);
                  const formattedDate = selectedDate.toISOString().split('T')[0];
                  updateField('manufacturingDate', formattedDate);
                }
              }}
            />
          )}

          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Expiry Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowExpDatePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.dateText}>
                {formData.expiryDate || 'Select date'}
              </Text>
            </TouchableOpacity>
            {errors.expiryDate && (
              <Text style={styles.errorText}>{errors.expiryDate}</Text>
            )}
          </View>

          {showExpDatePicker && (
            <DateTimePicker
              value={expDate}
              mode="date"
              display="default"
              minimumDate={mfgDate}
              onChange={(event, selectedDate) => {
                setShowExpDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setExpDate(selectedDate);
                  const formattedDate = selectedDate.toISOString().split('T')[0];
                  updateField('expiryDate', formattedDate);
                }
              }}
            />
          )}

          <CustomInput
            label="Description (Optional)"
            placeholder="Additional information about the drug"
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            icon="document-text-outline"
            multiline
            numberOfLines={3}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Important Notes</Text>
            <Text style={styles.infoText}>
              • Each drug will receive a unique serial number
            </Text>
            <Text style={styles.infoText}>
              • QR codes will be generated automatically
            </Text>
            <Text style={styles.infoText}>
              • Batch number must be unique
            </Text>
            <Text style={styles.infoText}>
              • You can download QR codes after generation
            </Text>
          </View>

          <CustomButton
            title="Generate QR Codes"
            onPress={handleGenerate}
            loading={loading}
            style={styles.generateButton}
          />

          <CustomButton
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </ScrollView>

      <Modal
        visible={showQRModal}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generated QR Codes</Text>
            <Text style={styles.modalSubtitle}>
              {qrCodes.length} QR codes generated successfully
            </Text>
          </View>

          <FlatList
            data={qrCodes}
            renderItem={renderQRItem}
            keyExtractor={(item) => item.serial_number}
            numColumns={2}
            contentContainerStyle={styles.qrGrid}
          />

          <View style={styles.modalFooter}>
            <CustomButton
              title="Done"
              onPress={handleCloseModal}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
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
  },
  form: {
    width: '100%',
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
  generateButton: {
    marginBottom: theme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  qrGrid: {
    padding: theme.spacing.md,
  },
  qrItem: {
    flex: 1,
    margin: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  qrImage: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.sm,
  },
  qrSerial: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  modalFooter: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  modalButton: {
    width: '100%',
  },
  dateInputContainer: {
    marginBottom: theme.spacing.md,
  },
  dateLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    flex: 1,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
