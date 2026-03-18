import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { manufacturerAPI } from '@/services/api';

interface ScanAnalytics {
  by_type: Array<{ _id: string; count: number }>;
  by_role: Array<{ _id: string; count: number }>;
  recent_scans: Array<any>;
  total_scans: number;
}

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<ScanAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await manufacturerAPI.getScanAnalytics();
      if (response.success) {
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'manufacture':
        return 'construct-outline';
      case 'distribution':
        return 'car-outline';
      case 'retail':
        return 'storefront-outline';
      case 'verification':
        return 'shield-checkmark-outline';
      default:
        return 'location-outline';
    }
  };

  const getScanTypeColor = (type: string) => {
    switch (type) {
      case 'manufacture':
        return theme.colors.primary;
      case 'distribution':
        return theme.colors.info;
      case 'retail':
        return theme.colors.secondary;
      case 'verification':
        return theme.colors.genuine;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Scan Analytics</Text>
            <Text style={styles.headerSubtitle}>Track product movement and distribution</Text>
          </View>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push('/manufacturer/track-scan' as any)}
          >
            <Ionicons name="qr-code-outline" size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>

        <View style={styles.totalCard}>
          <Ionicons name="analytics-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.totalValue}>{analytics?.total_scans || 0}</Text>
          <Text style={styles.totalLabel}>Total Scans Recorded</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scans by Type</Text>
          <View style={styles.statsGrid}>
            {analytics?.by_type.map((item) => (
              <View key={item._id} style={[styles.statCard, theme.shadows.sm]}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: getScanTypeColor(item._id) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getScanTypeIcon(item._id) as any}
                    size={24}
                    color={getScanTypeColor(item._id)}
                  />
                </View>
                <Text style={styles.statValue}>{item.count}</Text>
                <Text style={styles.statLabel}>
                  {item._id.charAt(0).toUpperCase() + item._id.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scans by Role</Text>
          <View style={styles.roleCards}>
            {analytics?.by_role.map((item) => (
              <View key={item._id} style={[styles.roleCard, theme.shadows.sm]}>
                <View style={styles.roleCardContent}>
                  <Ionicons
                    name={
                      item._id === 'manufacturer'
                        ? 'business-outline'
                        : item._id === 'customer'
                        ? 'person-outline'
                        : 'people-outline'
                    }
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.roleLabel}>
                    {item._id.charAt(0).toUpperCase() + item._id.slice(1)}
                  </Text>
                </View>
                <Text style={styles.roleValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {analytics?.recent_scans && analytics.recent_scans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            {analytics.recent_scans.map((scan) => (
              <View key={scan._id} style={[styles.scanCard, theme.shadows.sm]}>
                <View style={styles.scanHeader}>
                  <View
                    style={[
                      styles.scanTypeIndicator,
                      { backgroundColor: getScanTypeColor(scan.scan_type) },
                    ]}
                  />
                  <View style={styles.scanInfo}>
                    <Text style={styles.scanDrugName}>
                      {scan.drug_info?.drug_name || 'Unknown Product'}
                    </Text>
                    <Text style={styles.scanType}>
                      {scan.scan_type.charAt(0).toUpperCase() + scan.scan_type.slice(1)} Scan
                    </Text>
                  </View>
                  <Text style={styles.scanDate}>{formatDate(scan.scanned_at)}</Text>
                </View>

                {scan.location?.address && (
                  <View style={styles.scanDetail}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.scanDetailText}>{scan.location.address}</Text>
                  </View>
                )}

                {scan.notes && (
                  <View style={styles.scanNotes}>
                    <Text style={styles.scanNotesText}>{scan.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  trackButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  totalCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  roleCards: {
    gap: theme.spacing.sm,
  },
  roleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roleLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  roleValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  scanCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  scanTypeIndicator: {
    width: 4,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  scanInfo: {
    flex: 1,
  },
  scanDrugName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scanType: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  scanDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  scanDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  scanDetailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  scanNotes: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  scanNotesText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});
