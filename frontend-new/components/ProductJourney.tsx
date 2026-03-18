import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { ScanLocation } from '@/services/api';

interface ProductJourneyProps {
  journey: ScanLocation[];
}

export const ProductJourney: React.FC<ProductJourneyProps> = ({ journey }) => {
  const getScanTypeIcon = (scanType: string) => {
    switch (scanType) {
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

  const getScanTypeColor = (scanType: string) => {
    switch (scanType) {
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (journey.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={48} color={theme.colors.text.tertiary} />
        <Text style={styles.emptyText}>No journey data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.headerTitle}>Product Journey</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Track the complete supply chain movement from manufacturer to you
      </Text>

      <View style={styles.timeline}>
        {journey.map((scan, index) => {
          const isLast = index === journey.length - 1;
          const scanColor = getScanTypeColor(scan.scan_type);

          return (
            <View key={scan._id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.iconContainer, { backgroundColor: scanColor }]}>
                  <Ionicons
                    name={getScanTypeIcon(scan.scan_type) as any}
                    size={20}
                    color={theme.colors.text.inverse}
                  />
                </View>
                {!isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={[styles.timelineContent, isLast && styles.timelineContentLast]}>
                <View style={styles.scanCard}>
                  <View style={styles.scanHeader}>
                    <Text style={styles.scanType}>
                      {scan.scan_type.charAt(0).toUpperCase() + scan.scan_type.slice(1)}
                    </Text>
                    {/* <Text style={styles.scanDate}>{formatDate(scan.scanned_at)}</Text> */}
                  </View>
                  <View>
                    <Text>{formatDate(scan.scanned_at)}</Text>
                  </View>

                  {/* {scan.scanned_by && (
                    <View style={styles.scanDetail}>
                      <Ionicons name="person-outline" size={14} color={theme.colors.text.secondary} />
                      <Text style={styles.scanDetailText}>
                        {scan.scanned_by.company_name || scan.scanned_by.name}
                      </Text>
                    </View>
                  )} */}

                  {scan.location?.address && (
                    <View style={styles.scanDetail}>
                      <Ionicons name="location-outline" size={14} color={theme.colors.text.secondary} />
                      <Text style={styles.scanDetailText}>{scan.location.address}</Text>
                    </View>
                  )}

                  {scan.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>{scan.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.genuine} />
          <Text style={styles.footerText}>
            {journey.length} verification{journey.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  timeline: {
    marginBottom: theme.spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.xs,
  },
  timelineContent: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  timelineContentLast: {
    marginBottom: 0,
  },
  scanCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  scanType: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scanDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
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
  notesContainer: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  notesText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});
