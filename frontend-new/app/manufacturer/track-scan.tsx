import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { manufacturerAPI } from '@/services/api';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';

export default function TrackScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [scanType, setScanType] = useState('distribution');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan QR codes for tracking
          </Text>
          <CustomButton
            title="Grant Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || scanning) return;

    setScanned(true);
    setSerialNumber(data);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'Serial number is required');
      return;
    }

    setScanning(true);

    try {
      const response = await manufacturerAPI.recordScan({
        serial_number: serialNumber,
        scan_type: scanType,
        location: location ? { address: location } : undefined,
        notes: notes || undefined,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Scan location recorded successfully',
          [
            {
              text: 'Scan Another',
              onPress: handleReset,
            },
            {
              text: 'View Analytics',
              onPress: () => router.push('/manufacturer/analytics' as any),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to record scan');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setScanned(false);
    setShowForm(false);
    setSerialNumber('');
    setLocation('');
    setNotes('');
    setScanType('distribution');
  };

  const handleGoBack = () => {
    router.back();
  };

  if (showForm) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          <View style={styles.formHeader}>
            <Ionicons name="location-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.formTitle}>Record Scan Location</Text>
            <Text style={styles.formSubtitle}>Track product movement in supply chain</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Serial Number</Text>
            <View style={styles.serialDisplay}>
              <Ionicons name="barcode-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.serialText} numberOfLines={1}>
                {serialNumber}
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Scan Type *</Text>
            <View style={styles.scanTypeGrid}>
              <TouchableOpacity
                style={[
                  styles.scanTypeCard,
                  scanType === 'manufacture' && styles.scanTypeCardActive,
                ]}
                onPress={() => setScanType('manufacture')}
              >
                <Ionicons
                  name="construct-outline"
                  size={24}
                  color={scanType === 'manufacture' ? theme.colors.primary : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.scanTypeText,
                    scanType === 'manufacture' && styles.scanTypeTextActive,
                  ]}
                >
                  Manufacture
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scanTypeCard,
                  scanType === 'distribution' && styles.scanTypeCardActive,
                ]}
                onPress={() => setScanType('distribution')}
              >
                <Ionicons
                  name="car-outline"
                  size={24}
                  color={scanType === 'distribution' ? theme.colors.primary : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.scanTypeText,
                    scanType === 'distribution' && styles.scanTypeTextActive,
                  ]}
                >
                  Distribution
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scanTypeCard,
                  scanType === 'retail' && styles.scanTypeCardActive,
                ]}
                onPress={() => setScanType('retail')}
              >
                <Ionicons
                  name="storefront-outline"
                  size={24}
                  color={scanType === 'retail' ? theme.colors.primary : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.scanTypeText,
                    scanType === 'retail' && styles.scanTypeTextActive,
                  ]}
                >
                  Retail
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <CustomInput
              label="Location (Optional)"
              placeholder="Enter location or address"
              value={location}
              onChangeText={setLocation}
              icon="location-outline"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Record Scan"
              onPress={handleSubmit}
              loading={scanning}
              style={styles.submitButton}
            />
            <CustomButton
              title="Cancel"
              onPress={handleReset}
              variant="outline"
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>

          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>
              Scan product QR code to record location
            </Text>
            <Text style={styles.instructionSubtext}>
              Track product movement through supply chain
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  permissionTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  permissionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    minWidth: 200,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    height: 300,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  scanArea: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  instructionText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  instructionSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    opacity: 0.8,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: theme.spacing.lg,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  formTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  formSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  serialDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  serialText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  scanTypeGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  scanTypeCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  scanTypeCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  scanTypeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  scanTypeTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 100,
  },
  buttonContainer: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  submitButton: {
    width: '100%',
  },
});
