import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { ownerAPI, User } from '@/services/api';
import { CustomInput } from '@/components/CustomInput';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [selectedRole, searchQuery, users]);

  const loadUsers = async () => {
    try {
      const response = await ownerAPI.getUsers(undefined, 1, 100);
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleToggleUserStatus = (user: User) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: user.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const response = user.is_active
                ? await ownerAPI.deactivateUser(user._id)
                : await ownerAPI.activateUser(user._id);

              if (response.success) {
                Alert.alert('Success', `User ${action}d successfully`);
                loadUsers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || `Failed to ${action} user`);
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return theme.colors.primary;
      case 'manufacturer':
        return theme.colors.primary;
      case 'distributor':
        return theme.colors.secondary;
      case 'retailer':
        return theme.colors.info;
      case 'customer':
        return theme.colors.text.secondary;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return 'shield-outline';
      case 'manufacturer':
        return 'business-outline';
      case 'distributor':
        return 'car-outline';
      case 'retailer':
        return 'storefront-outline';
      case 'customer':
        return 'person-outline';
      default:
        return 'person-outline';
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

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, theme.shadows.sm]}>
      <View style={styles.cardHeader}>
        <View style={[styles.roleIcon, { backgroundColor: getRoleColor(item.role) + '20' }]}>
          <Ionicons name={getRoleIcon(item.role) as any} size={24} color={getRoleColor(item.role)} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.company_name && (
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={14} color={theme.colors.text.secondary} />
              <Text style={styles.companyText}>{item.company_name}</Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: item.is_active ? theme.colors.success : theme.colors.error },
          ]}
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
            <Text style={styles.dateText}>Joined {formatDate(item.created_at)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusRow}>
          <Ionicons
            name={item.is_active ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={item.is_active ? theme.colors.success : theme.colors.error}
          />
          <Text
            style={[
              styles.statusText,
              { color: item.is_active ? theme.colors.success : theme.colors.error },
            ]}
          >
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
        {item.role !== 'owner' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleUserStatus(item)}
          >
            <Ionicons
              name={item.is_active ? 'ban-outline' : 'checkmark-circle-outline'}
              size={18}
              color={item.is_active ? theme.colors.error : theme.colors.success}
            />
            <Text
              style={[
                styles.actionText,
                { color: item.is_active ? theme.colors.error : theme.colors.success },
              ]}
            >
              {item.is_active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const roleFilters = [
    { label: 'All', value: null, count: users.length },
    { label: 'Manufacturers', value: 'manufacturer', count: users.filter((u) => u.role === 'manufacturer').length },
    { label: 'Distributors', value: 'distributor', count: users.filter((u) => u.role === 'distributor').length },
    { label: 'Retailers', value: 'retailer', count: users.filter((u) => u.role === 'retailer').length },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <CustomInput
          placeholder="Search by name, email, or company..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search-outline"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {roleFilters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            style={[styles.filterTab, selectedRole === filter.value && styles.filterTabActive]}
            onPress={() => setSelectedRole(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedRole === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Users</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedRole
                ? 'No users match your filters'
                : 'No users have been added yet'}
            </Text>
          </View>
        }
      />
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: theme.spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.text.inverse,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  companyText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: theme.spacing.sm,
  },
  cardBody: {
    marginBottom: theme.spacing.sm,
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
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  actionText: {
    fontSize: theme.typography.fontSize.sm,
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
  },
});
