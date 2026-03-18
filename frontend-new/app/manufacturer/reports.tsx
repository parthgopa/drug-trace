import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { manufacturerAPI } from '@/services/api';

interface Report {
  _id: string;
  serial_number: string;
  issue_type: string;
  issue_description: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  admin_notes?: string;
}

interface ReportStats {
  total_reports: number;
  pending: number;
  resolved: number;
  rejected: number;
}

export default function ReportsScreen() {
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      // Fetch all reports at once (no pagination, no status filter)
      const response = await manufacturerAPI.getReports(1, 1000);
      
      if (response.success) {
        const reports = response.reports || [];
        setAllReports(reports);
        setFilteredReports(reports);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  }, []);

  const loadStats = async () => {
    try {
      const response = await manufacturerAPI.getReportStatistics();
      if (response.success) {
        setStats(response.statistics);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadReports(), loadStats()]);
    setRefreshing(false);
  };

  const applyFilter = useCallback((status: string | null) => {
    if (status === null) {
      setFilteredReports(allReports);
    } else {
      setFilteredReports(allReports.filter(report => report.status === status));
    }
  }, [allReports]);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReport) return;
    
    setUpdating(true);
    try {
      const response = await manufacturerAPI.updateReportStatus(
        selectedReport._id,
        status,
        adminNotes
      );
      
      if (response.success) {
        // Update both allReports and filteredReports
        const updatedReports = allReports.map(r =>
          r._id === selectedReport._id
            ? { ...r, status: status as any, admin_notes: adminNotes }
            : r
        );
        setAllReports(updatedReports);
        
        // Reapply filter
        if (selectedStatus === null) {
          setFilteredReports(updatedReports);
        } else {
          setFilteredReports(updatedReports.filter(r => r.status === selectedStatus));
        }
        
        // Refresh stats
        loadStats();
        
        Alert.alert('Success', `Report status updated to ${status}`);
        setStatusModalVisible(false);
        setAdminNotes('');
        setSelectedReport(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadReports();
    loadStats();
    setLoading(false);
  }, []);

  useEffect(() => {
    applyFilter(selectedStatus);
  }, [selectedStatus, applyFilter]);

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'counterfeit':
        return 'warning-outline';
      case 'damaged':
        return 'bandage-outline';
      case 'expired':
        return 'calendar-outline';
      case 'wrong_product':
        return 'close-circle-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  const getIssueTypeColor = (type: string) => {
    switch (type) {
      case 'counterfeit':
        return theme.colors.error;
      case 'damaged':
        return theme.colors.warning;
      case 'expired':
        return theme.colors.info;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'resolved':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
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
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>View reports for your products</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.error + '15' }]}>
              <Text style={[styles.statValue, { color: theme.colors.error }]}>
                {stats.total_reports}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.warning + '15' }]}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                {stats.pending}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.success + '15' }]}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {stats.resolved}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterTab, selectedStatus === null && styles.filterTabActive]}
              onPress={() => setSelectedStatus(null)}
            >
              <Text style={[styles.filterText, selectedStatus === null && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedStatus === 'pending' && styles.filterTabActive]}
              onPress={() => setSelectedStatus('pending')}
            >
              <Text style={[styles.filterText, selectedStatus === 'pending' && styles.filterTextActive]}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedStatus === 'resolved' && styles.filterTabActive]}
              onPress={() => setSelectedStatus('resolved')}
            >
              <Text style={[styles.filterText, selectedStatus === 'resolved' && styles.filterTextActive]}>
                Resolved
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedStatus === 'rejected' && styles.filterTabActive]}
              onPress={() => setSelectedStatus('rejected')}
            >
              <Text style={[styles.filterText, selectedStatus === 'rejected' && styles.filterTextActive]}>
                Rejected
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Reports</Text>
            <Text style={styles.emptyText}>
              {selectedStatus 
                ? `No ${selectedStatus} reports found`
                : 'No reports found for your products'}
            </Text>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {filteredReports.map((report) => (
              <TouchableOpacity
                key={report._id}
                style={[styles.reportCard, theme.shadows.sm]}
                onPress={() => {
                  setSelectedReport(report);
                  setStatusModalVisible(true);
                }}
              >
                <View style={styles.reportHeader}>
                  <View
                    style={[
                      styles.issueIcon,
                      { backgroundColor: getIssueTypeColor(report.issue_type) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getIssueTypeIcon(report.issue_type) as any}
                      size={20}
                      color={getIssueTypeColor(report.issue_type)}
                    />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.issueType}>
                      {report.issue_type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.serialNumber} numberOfLines={1}>
                      {report.serial_number}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(report.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {report.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.issueDescription} numberOfLines={2}>
                  {report.issue_description}
                </Text>

                <View style={styles.reportFooter}>
                  <Text style={styles.reportDate}>
                    Reported: {formatDate(report.created_at)}
                  </Text>
                  {report.admin_notes && (
                    <Text style={styles.hasNotes}>📎 Has notes</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Report Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <View style={styles.selectedReportInfo}>
                <Text style={styles.selectedReportSerial}>
                  {selectedReport.serial_number}
                </Text>
                <Text style={styles.selectedReportIssue}>
                  {selectedReport.issue_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.notesLabel}>Admin Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              placeholder="Add notes about this report..."
              value={adminNotes}
              onChangeText={setAdminNotes}
            />

            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: theme.colors.success }]}
                onPress={() => handleUpdateStatus('resolved')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.text.inverse} />
                    <Text style={styles.statusButtonText}>Mark Resolved</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: theme.colors.error }]}
                onPress={() => handleUpdateStatus('rejected')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color={theme.colors.text.inverse} />
                    <Text style={styles.statusButtonText}>Reject Report</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusButton, { backgroundColor: theme.colors.warning }]}
                onPress={() => handleUpdateStatus('pending')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                ) : (
                  <>
                    <Ionicons name="time" size={20} color={theme.colors.text.inverse} />
                    <Text style={styles.statusButtonText}>Mark Pending</Text>
                  </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  header: {
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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  filterTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterTextActive: {
    color: theme.colors.text.inverse,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  reportsList: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  reportCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  issueIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  issueType: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  serialNumber: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
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
  issueDescription: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  reportDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  hasNotes: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.info,
  },
  loadMoreButton: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  loadMoreText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
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
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  selectedReportInfo: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  selectedReportSerial: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  selectedReportIssue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  notesLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  notesInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
  },
  statusButtons: {
    gap: theme.spacing.md,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  statusButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
});
