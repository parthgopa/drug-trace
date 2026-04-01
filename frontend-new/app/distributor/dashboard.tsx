import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { supplyChainAPI, storageAPI, ScanLocation, distributorAPI } from '@/services/api';

export default function DistributorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<ScanLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCompanyName, setInviteCompanyName] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);

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
      const scansResponse = await supplyChainAPI.getDistributorScans(10);
      if (scansResponse.success) {
        setRecentScans(scansResponse.scans);
      }

      // Load invitations
      const invitationsResponse = await distributorAPI.getInvitations();
      if (invitationsResponse.success) {
        setInvitations(invitationsResponse.invitations || []);
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

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setInviteSending(true);
    try {
      const response = await distributorAPI.inviteRetailer({
        email: inviteEmail.trim(),
        company_name: inviteCompanyName.trim() || undefined,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          `Invitation sent to ${inviteEmail}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setInviteModalVisible(false);
                setInviteEmail('');
                setInviteCompanyName('');
                loadDashboardData(); // Reload to show new invitation
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{userName || 'Distributor'}</Text>
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
            <View style={[styles.statIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="cube-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.unique_products || 0}</Text>
            <Text style={styles.statLabel}>Products Tracked</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="location-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{recentScans.length}</Text>
            <Text style={styles.statLabel}>Recent Activity</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/distributor/scan-product' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="scan-outline" size={28} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan Product</Text>
              <Text style={styles.actionSubtitle}>Track product movement</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => setInviteModalVisible(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="person-add-outline" size={28} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Invite Retailer</Text>
              <Text style={styles.actionSubtitle}>Send invitation to new retailer</Text>
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
              <Text style={styles.emptySubtext}>Start scanning to track product movement</Text>
            </View>
          ) : (
            recentScans.map((scan) => (
              <View key={scan._id} style={[styles.scanCard, theme.shadows.sm]}>
                <View style={styles.scanHeader}>
                  <View style={[styles.scanTypeIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
                    <Ionicons name="car-outline" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.scanInfo}>
                    <Text style={styles.scanType}>Distribution Scan</Text>
                    <Text style={styles.scanDate}>{formatDate(scan.scanned_at)}</Text>
                  </View>
                </View>
                
                {scan.drug_info && (
                  <View style={styles.drugInfo}>
                    <Text style={styles.drugName}>{scan.drug_info.drug_name}</Text>
                    <Text style={styles.batchNumber}>Batch: {scan.drug_info.batch_number}</Text>
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
            ))
          )}
        </View>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Invitations</Text>
            </View>

            {invitations.slice(0, 5).map((invitation) => (
              <View key={invitation._id} style={[styles.invitationCard, theme.shadows.sm]}>
                <View style={styles.invitationHeader}>
                  <View style={[styles.invitationIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.invitationInfo}>
                    <Text style={styles.invitationEmail}>{invitation.email}</Text>
                    <Text style={styles.invitationRole}>Retailer</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        invitation.status === 'accepted'
                          ? theme.colors.success + '20'
                          : invitation.status === 'pending'
                            ? theme.colors.warning + '20'
                            : theme.colors.error + '20',
                    },
                  ]}>
                    <Text style={[
                      styles.statusText,
                      {
                        color:
                          invitation.status === 'accepted'
                            ? theme.colors.success
                            : invitation.status === 'pending'
                              ? theme.colors.warning
                              : theme.colors.error,
                      },
                    ]}>
                      {invitation.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                {invitation.company_name && (
                  <Text style={styles.invitationCompany}>{invitation.company_name}</Text>
                )}
                <Text style={styles.invitationDate}>
                  Sent: {new Date(invitation.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Invite Retailer Modal */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme.shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Retailer</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="retailer@example.com"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!inviteSending}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Company Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABC Pharmacy"
                  value={inviteCompanyName}
                  onChangeText={setInviteCompanyName}
                  editable={!inviteSending}
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
                <Text style={styles.infoText}>
                  The retailer will receive an email invitation to join the platform.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setInviteModalVisible(false)}
                disabled={inviteSending}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSendInvitation}
                disabled={inviteSending}
              >
                {inviteSending ? (
                  <ActivityIndicator color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Send Invitation</Text>
                )}
              </TouchableOpacity>
            </View>
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
    color: theme.colors.secondary,
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
  drugInfo: {
    marginBottom: theme.spacing.sm,
  },
  drugName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  batchNumber: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.info + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonPrimaryText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  buttonSecondaryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  invitationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  invitationIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  invitationRole: {
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
  },
  invitationCompany: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    marginLeft: 48,
  },
  invitationDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: 48,
  },
});
