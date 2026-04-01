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
import { manufacturerAPI, storageAPI, ManufacturerStats, Batch } from '@/services/api';

export default function ManufacturerDashboard() {
  const [stats, setStats] = useState<ManufacturerStats | null>(null);
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { user } = await storageAPI.getAuthData();
      if (user) {
        setUserName(user.name);
        setCompanyName(user.company_name || '');
      }

      const response = await manufacturerAPI.getStats();
      if (response.success) {
        setStats(response.stats);
        setRecentBatches(response.recent_batches || []);
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
      case 'active':
        return theme.colors.genuine;
      case 'recalled':
        return theme.colors.recalled;
      case 'voided':
        return theme.colors.text.tertiary;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'recalled':
        return '🔴';
      case 'voided':
        return '⚪';
      default:
        return '⚫';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.userName}>{userName || 'Manufacturer'}</Text>
          {companyName && <Text style={styles.companyName}>{companyName}</Text>}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="cube-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.total_batches || 0}</Text>
            <Text style={styles.statLabel}>Total Batches</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="qr-code-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.total_drugs || 0}</Text>
            <Text style={styles.statLabel}>Active QRs</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="eye-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.total_scans || 0}</Text>
            <Text style={styles.statLabel}>Customer Scans</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.error }]}>
              <Ionicons name="warning-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.fake_scans || 0}</Text>
            <Text style={styles.statLabel}>Fake Scans</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/manufacturer/generate-qr' as any)}
          >
            <View style={[styles.actionIconLarge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="qr-code-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Generate New Batch</Text>
              <Text style={styles.actionSubtitle}>Create drug batch with QR codes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/manufacturer/inventory' as any)}
          >
            <View style={[styles.actionIconLarge, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="list-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Inventory</Text>
              <Text style={styles.actionSubtitle}>Manage batches and compliance</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/manufacturer/scan-product' as any)}
          >
            <View style={[styles.actionIconLarge, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="scan-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan Product</Text>
              <Text style={styles.actionSubtitle}>Track product with geo-location</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/manufacturer/analytics' as any)}
          >
            <View style={[styles.actionIconLarge, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="analytics-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Analytics</Text>
              <Text style={styles.actionSubtitle}>Track scan locations and distribution</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/manufacturer/reports' as any)}
          >
            <View style={[styles.actionIconLarge, { backgroundColor: theme.colors.error }]}>
              <Ionicons name="warning-outline" size={32} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Reports</Text>
              <Text style={styles.actionSubtitle}>Customer reports on your products</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/manufacturer/inventory' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentBatches.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No batches yet</Text>
              <Text style={styles.emptySubtext}>Create your first batch to get started</Text>
            </View>
          ) : (
            recentBatches.map((batch) => (
              <View key={batch._id} style={[styles.batchCard, theme.shadows.sm]}>
                <View style={styles.batchHeader}>
                  <View style={styles.batchInfo}>
                    <Text style={styles.batchName}>{batch.drug_name}</Text>
                    <Text style={styles.batchId}>Batch: {batch._id}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(batch.status) }]}>
                    <Text style={styles.statusText}>{getStatusEmoji(batch.status)} {batch.status.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.batchDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="cube-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{batch.quantity} units</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{formatDate(batch.created_at)}</Text>
                  </View>
                </View>
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
  companyName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  actionsSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionIconLarge: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
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
  recentSection: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  batchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  batchId: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  batchDetails: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
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
