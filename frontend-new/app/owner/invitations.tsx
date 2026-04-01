import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { ownerAPI, Invitation } from '@/services/api';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';

export default function InvitationsScreen() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [filteredInvitations, setFilteredInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'manufacturer' as 'manufacturer' | 'distributor' | 'retailer',
    company_name: '',
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  useEffect(() => {
    filterInvitations();
  }, [selectedStatus, searchQuery, invitations]);

  const loadInvitations = async () => {
    try {
      const response = await ownerAPI.getInvitations(undefined, 1, 100);
      if (response.success) {
        setInvitations(response.invitations);
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterInvitations = () => {
    let filtered = [...invitations];

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter((inv) => inv.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.email.toLowerCase().includes(query) ||
          inv.role.toLowerCase().includes(query) ||
          inv.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredInvitations(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInvitations();
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
        loadInvitations();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvitation = (invitation: Invitation) => {
    Alert.alert(
      'Delete Invitation',
      `Are you sure you want to delete the invitation for ${invitation.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ownerAPI.deleteInvitation(invitation._id);
              if (response.success) {
                Alert.alert('Success', 'Invitation deleted');
                loadInvitations();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete invitation');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'accepted':
        return theme.colors.success;
      case 'expired':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manufacturer':
        return theme.colors.primary;
      case 'distributor':
        return theme.colors.secondary;
      case 'retailer':
        return theme.colors.info;
      default:
        return theme.colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderInvitation = ({ item }: { item: Invitation }) => (
    <View style={[styles.invitationCard, theme.shadows.sm]}>
      <View style={styles.cardHeader}>
        <View style={styles.invitationInfo}>
          <Text style={styles.email}>{item.email}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
            {item.company_name && (
              <View style={styles.companyInfo}>
                <Ionicons name="business-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.companyText}>{item.company_name}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
          <Text style={styles.dateText}>Sent: {formatDate(item.created_at)}</Text>
        </View>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteInvitation(item)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitations</Text>
        <TouchableOpacity onPress={() => setShowInviteModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <CustomInput
          placeholder="Search by email, role, or company..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search-outline"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedStatus === null && styles.filterTabActive]}
          onPress={() => setSelectedStatus(null)}
        >
          <Text
            style={[styles.filterText, selectedStatus === null && styles.filterTextActive]}
          >
            All ({invitations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedStatus === 'pending' && styles.filterTabActive]}
          onPress={() => setSelectedStatus('pending')}
        >
          <Text
            style={[styles.filterText, selectedStatus === 'pending' && styles.filterTextActive]}
          >
            Pending ({invitations.filter((i) => i.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedStatus === 'accepted' && styles.filterTabActive]}
          onPress={() => setSelectedStatus('accepted')}
        >
          <Text
            style={[styles.filterText, selectedStatus === 'accepted' && styles.filterTextActive]}
          >
            Accepted ({invitations.filter((i) => i.status === 'accepted').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Invitations List */}
      <FlatList
        data={filteredInvitations}
        renderItem={renderInvitation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Invitations</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedStatus
                ? 'No invitations match your filters'
                : 'Send your first invitation to get started'}
            </Text>
            {!searchQuery && !selectedStatus && (
              <CustomButton
                title="Send Invitation"
                onPress={() => setShowInviteModal(true)}
                style={styles.emptyButton}
              />
            )}
          </View>
        }
      />

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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: theme.spacing.sm,
  },
  searchContainer: {
    padding: theme.spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.text.inverse,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  invitationCard: {
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
  invitationInfo: {
    flex: 1,
  },
  email: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  roleText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  companyText: {
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  deleteText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
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
