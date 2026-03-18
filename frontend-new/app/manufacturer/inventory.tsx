import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Paths, File as FSFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '@/constants/theme';
import { manufacturerAPI, Batch } from '@/services/api';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';

export default function InventoryScreen() {
const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState({
    newBatchNumber: '',
    expiryDate: '',
  });

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const response = await manufacturerAPI.getBatches();
      if (response.success) {
        const filteredBatches = showDeleted
          ? response.batches
          : response.batches.filter((b: Batch) => b.status !== 'deleted');
        setBatches(filteredBatches);
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBatches();
  };

  useEffect(() => {
    loadBatches();
  }, [showDeleted]);

  const handleExport = async (batchNumber: string, format: 'pdf' | 'csv') => {
    try {
      Alert.alert('Exporting', `Preparing ${format.toUpperCase()} file...`);
      
      const response = await manufacturerAPI.exportBatch(batchNumber, format);
      
      const filename = `batch_${batchNumber}.${format}`;
      const file = new FSFile(Paths.cache, filename);
      
      const fr = new FileReader();
      fr.onload = async () => {
        const base64 = (fr.result as string).split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await file.write(bytes);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri);
        } else {
          Alert.alert('Success', `File saved to ${file.uri}`);
        }
      };
      fr.readAsDataURL(response.data);
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Unable to export batch');
    }
  };

  const handleVoidBatch = (batch: Batch) => {
    Alert.alert(
      'Void Batch',
      `Are you sure you want to void batch ${batch._id}? This will mark all QR codes as invalid.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await manufacturerAPI.voidBatch(batch._id);
              if (response.success) {
                Alert.alert('Success', response.message);
                loadBatches();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to void batch');
            }
          },
        },
      ]
    );
  };

  const handleDuplicateBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setDuplicateData({
      newBatchNumber: '',
      expiryDate: batch.expiry_date,
    });
    setShowDuplicateModal(true);
  };

  const confirmDuplicate = async () => {
    if (!selectedBatch || !duplicateData.newBatchNumber.trim()) {
      Alert.alert('Error', 'New batch number is required');
      return;
    }

    try {
      const response = await manufacturerAPI.duplicateBatch(selectedBatch._id, {
        new_batch_number: duplicateData.newBatchNumber.trim(),
        expiry_date: duplicateData.expiryDate || undefined,
      });
      
      if (response.success) {
        Alert.alert('Success', response.message);
        setShowDuplicateModal(false);
        loadBatches();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to duplicate batch');
    }
  };

  const handleDeleteBatch = (batch: Batch) => {
    Alert.alert(
      'Delete Batch',
      `Are you sure you want to delete batch ${batch._id}? This is a soft delete and can be viewed later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await manufacturerAPI.softDeleteBatch(batch._id);
              if (response.success) {
                Alert.alert('Success', response.message);
                loadBatches();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete batch');
            }
          },
        },
      ]
    );
  };

  const openActionsMenu = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowActionsMenu(true);
  };

  const handleRecallBatch = (batchNumber: string) => {
    Alert.alert(
      'Recall Batch',
      `Are you sure you want to recall batch ${batchNumber}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recall',
          style: 'destructive',
          onPress: () => confirmRecall(batchNumber),
        },
      ]
    );
  };

  const confirmRecall = async (batchNumber: string) => {
    Alert.prompt(
      'Recall Reason',
      'Please provide a reason for the recall:',
      async (reason) => {
        if (!reason || !reason.trim()) {
          Alert.alert('Error', 'Recall reason is required');
          return;
        }

        try {
          const response = await manufacturerAPI.recallBatch(batchNumber, reason.trim());
          if (response.success) {
            Alert.alert('Success', response.message);
            loadBatches();
          } else {
            Alert.alert('Error', response.error || 'Failed to recall batch');
          }
        } catch (error: any) {
          Alert.alert(
            'Error',
            error.response?.data?.error || 'Failed to recall batch'
          );
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.genuine;
      case 'recalled':
        return theme.colors.recalled;
      case 'voided':
        return theme.colors.text.tertiary;
      case 'deleted':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderBatchItem = ({ item }: { item: Batch }) => {
    const statusColor = getStatusColor(item.status);
    const isExpired = new Date(item.expiry_date) < new Date();

    return (
      <View style={[styles.batchCard, theme.shadows.md]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.drugName}>{item.drug_name}</Text>
            <Text style={styles.manufacturer}>{item.manufacturer}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => openActionsMenu(item)} style={styles.menuButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="barcode-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Batch ID:</Text>
            <Text style={styles.infoValue}>{item._id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Quantity:</Text>
            <Text style={styles.infoValue}>{item.quantity} units</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(item.created_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isExpired ? theme.colors.error : theme.colors.text.secondary}
            />
            <Text style={styles.infoLabel}>Expires:</Text>
            <Text style={[styles.infoValue, isExpired && styles.expiredText]}>
              {formatDate(item.expiry_date)}
              {isExpired && ' (Expired)'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={[styles.exportButton, theme.shadows.sm]}
            onPress={() => handleExport(item._id, 'pdf')}
          >
            <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exportButton, theme.shadows.sm]}
            onPress={() => handleExport(item._id, 'csv')}
          >
            <Ionicons name="grid-outline" size={18} color={theme.colors.secondary} />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color={theme.colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Batches Found</Text>
      <Text style={styles.emptyText}>Start by generating your first batch</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, !showDeleted && styles.filterButtonActive]}
          onPress={() => setShowDeleted(false)}
        >
          <Text style={[styles.filterButtonText, !showDeleted && styles.filterButtonTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, showDeleted && styles.filterButtonActive]}
          onPress={() => setShowDeleted(true)}
        >
          <Text style={[styles.filterButtonText, showDeleted && styles.filterButtonTextActive]}>
            All (incl. Deleted)
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={batches}
        renderItem={renderBatchItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={renderEmpty}
      />

      <Modal
        visible={showActionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={[styles.actionsMenu, theme.shadows.lg]}>
            <Text style={styles.menuTitle}>Batch Actions</Text>
            
            {selectedBatch?.status === 'active' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowActionsMenu(false);
                  handleVoidBatch(selectedBatch);
                }}
              >
                <Ionicons name="ban-outline" size={20} color={theme.colors.warning} />
                <Text style={styles.menuItemText}>Void Batch</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowActionsMenu(false);
                if (selectedBatch) handleDuplicateBatch(selectedBatch);
              }}
            >
              <Ionicons name="copy-outline" size={20} color={theme.colors.info} />
              <Text style={styles.menuItemText}>Duplicate & Edit</Text>
            </TouchableOpacity>
            
            {selectedBatch?.status !== 'deleted' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowActionsMenu(false);
                  if (selectedBatch) handleDeleteBatch(selectedBatch);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                <Text style={styles.menuItemText}>Delete Batch</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={() => setShowActionsMenu(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showDuplicateModal}
        animationType="slide"
        onRequestClose={() => setShowDuplicateModal(false)}
      >
        <View style={styles.duplicateModal}>
          <View style={styles.duplicateHeader}>
            <Text style={styles.duplicateTitle}>Duplicate Batch</Text>
            <TouchableOpacity onPress={() => setShowDuplicateModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.duplicateForm}>
            <CustomInput
              label="New Batch Number"
              placeholder="Enter new batch number"
              value={duplicateData.newBatchNumber}
              onChangeText={(text) => setDuplicateData({ ...duplicateData, newBatchNumber: text })}
              icon="barcode-outline"
            />
            
            <CustomInput
              label="Expiry Date (Optional)"
              placeholder="YYYY-MM-DD"
              value={duplicateData.expiryDate}
              onChangeText={(text) => setDuplicateData({ ...duplicateData, expiryDate: text })}
              icon="calendar-outline"
            />
            
            <CustomButton
              title="Create Duplicate"
              onPress={confirmDuplicate}
              style={styles.duplicateButton}
            />
            
            <CustomButton
              title="Cancel"
              onPress={() => setShowDuplicateModal(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  batchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  drugName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  manufacturer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.sm,
  },
  infoContainer: {
    gap: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    flex: 1,
  },
  expiredText: {
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  recallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  recallButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  filterBar: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  exportButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '80%',
    maxWidth: 300,
  },
  menuTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  menuItemText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  cancelItem: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  duplicateModal: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  duplicateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  duplicateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  duplicateForm: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  duplicateButton: {
    marginTop: theme.spacing.md,
  },
});
