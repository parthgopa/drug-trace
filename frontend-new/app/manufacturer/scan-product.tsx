import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { supplyChainAPI } from '@/services/api';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';

export default function ManufacturerScanScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [notes, setNotes] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(true);

  useEffect(() => {
    requestLocationPermission();
    setTorchEnabled(true);
    return () => {
      setTorchEnabled(false);
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      if (status === 'granted') {
        fetchLocation();
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
    }
  };

  const fetchLocation = async () => {
    setLoadingLocation(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocoding to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address = 'Unknown location';
      if (geocode && geocode.length > 0) {
        const location = geocode[0];
        const parts = [
          location.name,
          location.street,
          location.city,
          location.region,
          location.country,
        ].filter(Boolean);
        address = parts.join(', ');
      }

      setLocation({ latitude, longitude, address });
    } catch (error) {
      console.error('Failed to fetch location:', error);
      Alert.alert('Location Error', 'Failed to fetch current location. You can enter it manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || scanning) return;

    setScanned(true);
    setSerialNumber(data);
    setTorchEnabled(false);
  };

  const handleSubmitScan = async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'Serial number is required');
      return;
    }

    setScanning(true);
    try {
      const response = await supplyChainAPI.manufacturerScan({
        serial_number: serialNumber.trim(),
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          `Product scanned successfully!\nScan Type: ${response.scan.scan_type}`,
          [
            {
              text: 'Scan Another',
              onPress: () => {
                setScanned(false);
                setSerialNumber('');
                setNotes('');
                setTorchEnabled(true);
                fetchLocation();
              },
            },
            {
              text: 'Back to Dashboard',
              onPress: () => router.back(),
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

  const handleGoBack = () => {
    setTorchEnabled(false);
    router.back();
  };

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan product QR codes
          </Text>
          <CustomButton
            title="Grant Permission"
            onPress={requestCameraPermission}
            style={styles.permissionButton}
          />
        </View>
      </View>
    );
  }

  if (!scanned) {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchEnabled}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
          }}
        />

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
              {scanning ? 'Processing...' : 'Align QR code within the frame'}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Product</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          <Text style={styles.successText}>QR Code Scanned</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Serial Number"
            value={serialNumber}
            onChangeText={setSerialNumber}
            icon="barcode-outline"
            editable={false}
          />

          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationLabel}>Location</Text>
              {loadingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <TouchableOpacity onPress={fetchLocation} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>

            {locationPermission !== 'granted' ? (
              <View style={styles.locationWarning}>
                <Ionicons name="warning-outline" size={20} color={theme.colors.warning} />
                <Text style={styles.warningText}>Location permission not granted</Text>
                <TouchableOpacity onPress={requestLocationPermission}>
                  <Text style={styles.grantText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            ) : location ? (
              <View style={styles.locationCard}>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={20} color={theme.colors.primary} />
                  <Text style={styles.addressText}>{location.address}</Text>
                </View>
                <View style={styles.coordsRow}>
                  <Text style={styles.coordsText}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.locationWarning}>
                <Ionicons name="location-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.warningText}>No location data</Text>
              </View>
            )}

            <CustomInput
              label="Address (Editable)"
              value={location?.address || ''}
              onChangeText={(text) =>
                setLocation((prev) => (prev ? { ...prev, address: text } : null))
              }
              icon="location-outline"
              multiline
              numberOfLines={2}
              placeholder="Enter location manually if needed"
            />
          </View>

          <CustomInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            icon="document-text-outline"
            multiline
            numberOfLines={3}
            placeholder="Add any notes about this scan..."
          />

          <CustomButton
            title="Submit Scan"
            onPress={handleSubmitScan}
            loading={scanning}
            style={styles.submitButton}
          />

          <CustomButton
            title="Scan Another"
            onPress={() => {
              setScanned(false);
              setSerialNumber('');
              setNotes('');
              setTorchEnabled(true);
              fetchLocation();
            }}
            variant="outline"
          />
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  headerBackButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  successText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.success,
    marginTop: theme.spacing.sm,
  },
  form: {
    width: '100%',
  },
  locationSection: {
    marginBottom: theme.spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  locationLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  refreshText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  locationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    flex: 1,
  },
  coordsRow: {
    marginLeft: 28,
  },
  coordsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.warning + '15',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  grantText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  submitButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});
