import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { customerAPI, storageAPI, ScanLog } from '@/services/api';

export default function CustomerDashboard() {
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { user } = await storageAPI.getAuthData();
      if (user) {
        setUserName(user.name);
      }

      const response = await customerAPI.getScanHistory(1, 5);
      if (response.success) {
        setRecentScans(response.history);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await storageAPI.clearAuthData();
          router.replace('/auth/login' as any);
        },
      },
    ]);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{userName || 'Customer'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/customer/scan' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="scan-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.actionTitle}>Scan Drug</Text>
            <Text style={styles.actionSubtitle}>Verify authenticity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/customer/history' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="time-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionSubtitle}>View scan logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/customer/report' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="alert-circle-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.actionTitle}>Report</Text>
            <Text style={styles.actionSubtitle}>Report counterfeit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/customer/history' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : recentScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySubtext}>Start scanning to verify drug authenticity</Text>
            </View>
          ) : (
            recentScans.map((scan) => (
              <View key={scan._id} style={[styles.scanCard, theme.shadows.sm]}>
                <View style={styles.scanHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(scan.scan_result.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {scan.scan_result.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.scanDate}>{formatDate(scan.scanned_at)}</Text>
                </View>
                <Text style={styles.serialNumber} numberOfLines={1}>
                  {scan.serial_number}
                </Text>
                {scan.drug_info && (
                  <Text style={styles.drugName}>{scan.drug_info.drug_name}</Text>
                )}
                <Text style={styles.scanMessage}>{scan.scan_result.message}</Text>
              </View>
            ))
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  greeting: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  userName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  scanCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
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
  scanDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  serialNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  drugName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  scanMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
});
