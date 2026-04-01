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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { ownerAPI, storageAPI, Invitation, User } from '@/services/api';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';

export default function OwnerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'manufacturer' as 'manufacturer' | 'distributor' | 'retailer',
    company_name: '',
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { user } = await storageAPI.getAuthData();
      if (user) {
        setUserName(user.name);
      }

      // Load statistics
      const statsResponse = await ownerAPI.getStatistics();
      if (statsResponse.success) {
        setStats(statsResponse.statistics);
      }

      // Load recent invitations
      const invitationsResponse = await ownerAPI.getInvitations('pending', 1, 5);
      if (invitationsResponse.success) {
        setInvitations(invitationsResponse.invitations);
      }

      // Load recent users
      const usersResponse = await ownerAPI.getUsers(undefined, 1, 5);
      if (usersResponse.success) {
        setUsers(usersResponse.users);
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

  const handleSendInvitation = async () => {
    if (!inviteForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setInviting(true);
    try {
      const response = await ownerAPI.sendInvitation({
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        company_name: inviteForm.company_name.trim() || undefined,
      });

      if (response.success) {
        Alert.alert('Success', `Invitation sent to ${inviteForm.email}`);
        setShowInviteModal(false);
        setInviteForm({ email: '', role: 'manufacturer', company_name: '' });
        loadDashboardData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
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
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{userName || 'Owner'}</Text>
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
              <Ionicons name="people-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.users?.total || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="business-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.users?.by_role?.manufacturer || 0}</Text>
            <Text style={styles.statLabel}>Manufacturers</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="car-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.users?.by_role?.distributor || 0}</Text>
            <Text style={styles.statLabel}>Distributors</Text>
          </View>

          <View style={[styles.statCard, theme.shadows.md]}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="storefront-outline" size={24} color={theme.colors.text.inverse} />
            </View>
            <Text style={styles.statValue}>{stats?.users?.by_role?.retailer || 0}</Text>
            <Text style={styles.statLabel}>Retailers</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => setShowInviteModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="mail-outline" size={28} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Send Invitation</Text>
              <Text style={styles.actionSubtitle}>Invite new users to the platform</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/owner/invitations' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="list-outline" size={28} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Invitations</Text>
              <Text style={styles.actionSubtitle}>
                {stats?.invitations?.pending || 0} pending invitations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, theme.shadows.md]}
            onPress={() => router.push('/owner/users' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="people-outline" size={28} color={theme.colors.text.inverse} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Users</Text>
              <Text style={styles.actionSubtitle}>View and manage all users</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Recent Invitations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invitations</Text>
            <TouchableOpacity onPress={() => router.push('/owner/invitations' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {invitations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No pending invitations</Text>
            </View>
          ) : (
            invitations.map((invitation) => (
              <View key={invitation._id} style={[styles.invitationCard, theme.shadows.sm]}>
                <View style={styles.invitationHeader}>
                  <View style={styles.invitationInfo}>
                    <Text style={styles.invitationEmail}>{invitation.email}</Text>
                    <Text style={styles.invitationRole}>
                      {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          invitation.status === 'pending'
                            ? theme.colors.warning + '20'
                            : theme.colors.success + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            invitation.status === 'pending'
                              ? theme.colors.warning
                              : theme.colors.success,
                        },
                      ]}
                    >
                      {invitation.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.invitationDate}>
                  Sent: {formatDate(invitation.created_at)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={() => router.push('/owner/users' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No users yet</Text>
            </View>
          ) : (
            users.map((user) => (
              <View key={user._id} style={[styles.userCard, theme.shadows.sm]}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName2}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.userRole}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Text>
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: user.is_active ? theme.colors.success : theme.colors.error },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Invitation</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Email"
              placeholder="Enter email address"
              value={inviteForm.email}
              onChangeText={(text) => setInviteForm({ ...inviteForm, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />

            <View style={styles.roleSelector}>
              <Text style={styles.roleLabel}>Role</Text>
              <View style={styles.roleButtons}>
                {(['manufacturer', 'distributor', 'retailer'] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      inviteForm.role === role && styles.roleButtonActive,
                    ]}
                    onPress={() => setInviteForm({ ...inviteForm, role })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        inviteForm.role === role && styles.roleButtonTextActive,
                      ]}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <CustomInput
              label="Company Name (Optional)"
              placeholder="Enter company name"
              value={inviteForm.company_name}
              onChangeText={(text) => setInviteForm({ ...inviteForm, company_name: text })}
              icon="business-outline"
            />

            <CustomButton
              title="Send Invitation"
              onPress={handleSendInvitation}
              loading={inviting}
              style={styles.sendButton}
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  invitationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
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
  invitationDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName2: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  userRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  roleSelector: {
    marginBottom: theme.spacing.md,
  },
  roleLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  roleButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  sendButton: {
    marginTop: theme.spacing.md,
  },
});
