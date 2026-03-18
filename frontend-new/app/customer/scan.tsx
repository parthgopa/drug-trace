import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '@/constants/theme';
import { customerAPI, ScanResult, Drug, ScanLocation } from '@/services/api';
import { CustomButton } from '@/components/CustomButton';
import { ProductJourney } from '@/components/ProductJourney';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ result: ScanResult; drug: Drug | null } | null>(null);
  const [journey, setJourney] = useState<ScanLocation[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(true);

  // Auto-enable torch when screen opens, disable when it closes
  useEffect(() => {
    setTorchEnabled(true);
    return () => {
      setTorchEnabled(false);
    };
  }, []);

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
            We need camera access to scan QR codes on drug packages
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

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanning) return;

    setScanned(true);
    setScanning(true);

    try {
      const response = await customerAPI.verifyDrug(data);

      if (response.success) {
        setResult(response);

        // Load product journey
        if (response.drug) {
          loadProductJourney(response.drug.serial_number);
        }
      } else {
        Alert.alert('Error', 'Failed to verify drug');
        setScanned(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to verify drug');
      setScanned(false);
    } finally {
      setScanning(false);
    }
  };

  const loadProductJourney = async (serialNumber: string) => {
    setLoadingJourney(true);
    try {
      const response = await customerAPI.getProductJourney(serialNumber);
      if (response.success) {
        setJourney(response.journey || []);
      }
    } catch (error) {
      console.error('Failed to load product journey:', error);
    } finally {
      setLoadingJourney(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setResult(null);
    setJourney([]);
  };

  const handleGoBack = () => {
    setTorchEnabled(false);
    setScanned(false);
    setResult(null);
    setJourney([]);
    router.back();
  };

  if (result) {
    const statusColor = result.result.status === 'genuine'
      ? theme.colors.genuine
      : result.result.status === 'fake'
        ? theme.colors.fake
        : result.result.status === 'expired'
          ? theme.colors.expired
          : theme.colors.recalled;

    const statusIcon = result.result.status === 'genuine'
      ? 'checkmark-circle'
      : result.result.status === 'fake'
        ? 'close-circle'
        : result.result.status === 'expired'
          ? 'time'
          : 'alert-circle';

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultHeader}>
            <View style={[styles.resultIcon, { backgroundColor: statusColor }]}>
              <Ionicons name={statusIcon as any} size={64} color={theme.colors.text.inverse} />
            </View>

            <Text style={[styles.resultStatus, { color: statusColor }]}>
              {result.result.status.toUpperCase()}
            </Text>

            <Text style={styles.resultMessage}>{result.result.message}</Text>
          </View>

          {result.drug && (
            <View style={styles.drugInfo}>
              <View style={styles.sectionHeader}>
                <Ionicons name="medical-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.drugInfoTitle}>Product Information</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="flask-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.infoLabel}>Product Name</Text>
                </View>
                <Text style={styles.infoValue}>{result.drug.drug_name}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.infoLabel}>Manufacturer</Text>
                </View>
                <Text style={styles.infoValue}>{result.drug.manufacturer}</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="cube-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.infoLabel}>Batch Number</Text>
                </View>
                <Text style={styles.infoValue}>{result.drug.batch_number}</Text>
              </View>

              {/* Give a copy button to copy the serial number */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="barcode-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.infoLabel}>Serial Number</Text>
                  <TouchableOpacity
                    style={styles.copyButtonInline}
                    onPress={async () => {
                      await Clipboard.setStringAsync(result.drug?.serial_number || '');
                      Alert.alert('Copied', 'Serial number copied to clipboard');
                    }}
                  >
                    <Ionicons name="copy-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.copyButtonTextInline}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {result.drug.serial_number}
                </Text>
              </View>

              <View style={styles.dateSection}>
                <View style={styles.dateCard}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.info} />
                  <Text style={styles.dateLabel}>Manufacturing Date</Text>
                  <Text style={styles.dateValue}>
                    {new Date(result.drug.manufacturing_date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>

                <View style={styles.dateCard}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
                  <Text style={styles.dateLabel}>Expiry Date</Text>
                  <Text style={styles.dateValue}>
                    {new Date(result.drug.expiry_date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>

              {result.drug.description && (
                <View style={styles.descriptionCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="document-text-outline" size={18} color={theme.colors.text.secondary} />
                    <Text style={styles.infoLabel}>Description</Text>
                  </View>
                  <Text style={styles.description}>{result.drug.description}</Text>
                </View>
              )}
            </View>
          )}

          {journey.length > 0 && (
            <View style={styles.journeySection}>
              <ProductJourney journey={journey} />
            </View>
          )}

          {loadingJourney && (
            <View style={styles.loadingJourney}>
              <Text style={styles.loadingText}>Loading product journey...</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Scan Another Product"
              onPress={handleScanAgain}
              variant="primary"
              style={styles.button}
            />
            <CustomButton
              title="Back to Dashboard"
              onPress={handleGoBack}
              variant="outline"
              style={styles.button}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera fills the parent */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
        }}
      />

      {/* Overlay sits on top */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
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
            {scanning ? 'Verifying...' : 'Align QR code within the frame'}
          </Text>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.inverse} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  copyButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  copyButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.sm,
    marginLeft: 'auto',
  },
  copyButtonTextInline: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
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
    borderColor: '#00FF00',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
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
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  resultContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  resultStatus: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  resultMessage: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  drugInfo: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  drugInfoTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
  },
  dateSection: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  dateCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  dateLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  dateValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  descriptionContainer: {
    marginTop: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
  journeySection: {
    marginBottom: theme.spacing.lg,
  },
  loadingJourney: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
