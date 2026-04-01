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
import { supplyChainAPI, storageAPI, ScanLocation } from '@/services/api';

export default function RetailerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<ScanLocation[]>([]);
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

      // Load statistics
      const statsResponse = await supplyChainAPI.getStatistics();
      if (statsResponse.success) {
        setStats(statsResponse.statistics);
      }

      // Load recent scans
      const scansResponse = await supplyChainAPI.getRetailerScans(10);
      if (scansResponse.success) {
        setRecentScans(scansResponse.scans);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{userName || 'Retailer'}</Text>
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
        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="scan-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.total_scans || 0}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="cube-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.unique_products || 0}</Text>
            <Text style={styles.statLabel}>Products Received</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{recentScans.filter(s => !isExpired(s.drug_info?.expiry_date)).length}</Text>
            <Text style={styles.statLabel}>Valid Stock</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="time-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{recentScans.filter(s => isExpiringSoon(s.drug_info?.expiry_date)).length}</Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/retailer/scan-product' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="scan-outline" size={28} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan Product</Text>
              <Text style={styles.actionSubtitle}>Verify product receipt</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

        </View>

        {/* Recent Scans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
          </View>

          {loading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : recentScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySubtext}>Start scanning to verify product receipt</Text>
            </View>
          ) : (
            recentScans.map((scan) => {
              const expired = isExpired(scan.drug_info?.expiry_date);
              const expiringSoon = isExpiringSoon(scan.drug_info?.expiry_date);
              
              return (
                <View key={scan._id} style={[styles.scanCard, theme.shadows.sm]}>
                  <View style={styles.scanHeader}>
                    <View style={[styles.scanTypeIcon, { backgroundColor: theme.colors.info + '20' }]}>
                      <Ionicons name="storefront-outline" size={20} color={theme.colors.info} />
                    </View>
                    <View style={styles.scanInfo}>
                      <Text style={styles.scanType}>Retail Scan</Text>
                      <Text style={styles.scanDate}>{formatDate(scan.scanned_at)}</Text>
                    </View>
                    {expired && (
                      <View style={[styles.statusBadge, { backgroundColor: theme.colors.error + '20' }]}>
                        <Text style={[styles.statusText, { color: theme.colors.error }]}>EXPIRED</Text>
                      </View>
                    )}
                    {!expired && expiringSoon && (
                      <View style={[styles.statusBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                        <Text style={[styles.statusText, { color: theme.colors.warning }]}>EXPIRING</Text>
                      </View>
                    )}
                  </View>
                  
                  {scan.drug_info && (
                    <View style={styles.drugInfo}>
                      <Text style={styles.drugName}>{scan.drug_info.drug_name}</Text>
                      <View style={styles.drugMeta}>
                        <Text style={styles.batchNumber}>Batch: {scan.drug_info.batch_number}</Text>
                        {scan.drug_info.manufacturer && (
                          <Text style={styles.manufacturer}>• {scan.drug_info.manufacturer}</Text>
                        )}
                      </View>
                      {scan.drug_info.expiry_date && (
                        <View style={styles.expiryInfo}>
                          <Ionicons 
                            name="calendar-outline" 
                            size={14} 
                            color={expired ? theme.colors.error : expiringSoon ? theme.colors.warning : theme.colors.text.secondary} 
                          />
                          <Text style={[
                            styles.expiryText,
                            { color: expired ? theme.colors.error : expiringSoon ? theme.colors.warning : theme.colors.text.secondary }
                          ]}>
                            Expires: {new Date(scan.drug_info.expiry_date).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {scan.location?.address && (
                    <View style={styles.locationInfo}>
                      <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.locationText}>{scan.location.address}</Text>
                    </View>
                  )}

                  {scan.notes && (
                    <View style={styles.notesInfo}>
                      <Ionicons name="document-text-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.notesText}>{scan.notes}</Text>
                    </View>
                  )}
                </View>
              );
            })
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
    color: theme.colors.info,
    fontWeight: theme.typography.fontWeight.semibold,
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
    marginBottom: theme.spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  scanTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  scanInfo: {
    flex: 1,
  },
  scanType: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  scanDate: {
    fontSize: theme.typography.fontSize.xs,
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
  },
  drugInfo: {
    marginBottom: theme.spacing.sm,
  },
  drugName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  drugMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  batchNumber: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  manufacturer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  expiryText: {
    fontSize: theme.typography.fontSize.sm,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  notesInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  notesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
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
