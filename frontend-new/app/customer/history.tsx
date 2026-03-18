import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { customerAPI, ScanLog } from '@/services/api';

export default function HistoryScreen() {
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (pageNum = 1) => {
    try {
      const response = await customerAPI.getScanHistory(pageNum, 20);
      if (response.success) {
        if (pageNum === 1) {
          setScans(response.history);
        } else {
          setScans([...scans, ...response.history]);
        }
        setHasMore(response.pagination.page < response.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadHistory(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHistory(nextPage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'genuine':
        return theme.colors.genuine;
      case 'fake':
        return theme.colors.fake;
      case 'expired':
        return theme.colors.expired;
      case 'recalled':
        return theme.colors.recalled;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'genuine':
        return 'checkmark-circle';
      case 'fake':
        return 'close-circle';
      case 'expired':
        return 'time';
      case 'recalled':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderScanItem = ({ item }: { item: ScanLog }) => {
    const statusColor = getStatusColor(item.scan_result.status);
    const statusIcon = getStatusIcon(item.scan_result.status);

    return (
      <View style={[styles.scanCard, theme.shadows.sm]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons name={statusIcon as any} size={16} color={theme.colors.text.inverse} />
            <Text style={styles.statusText}>{item.scan_result.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.scanned_at)}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="key-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.serialNumber} numberOfLines={1}>
              {item.serial_number}
            </Text>
          </View>

          {item.drug_info && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.drugName}>{item.drug_info.drug_name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.manufacturer}>{item.drug_info.manufacturer}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="barcode-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.batchNumber}>Batch: {item.drug_info.batch_number}</Text>
              </View>
            </>
          )}

          <View style={styles.messageContainer}>
            <Text style={styles.message}>{item.scan_result.message}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={theme.colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Scan History</Text>
      <Text style={styles.emptyText}>Your scan history will appear here</Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  if (loading && scans.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={scans}
        renderItem={renderScanItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
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
  scanCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  cardContent: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  serialNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  drugName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  manufacturer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  batchNumber: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  messageContainer: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  message: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
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
  footer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
});
