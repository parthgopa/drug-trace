import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { Drug } from '@/services/api';

interface DrugCardProps {
  drug: Drug;
  onPress?: () => void;
  showStatus?: boolean;
}

export const DrugCard: React.FC<DrugCardProps> = ({
  drug,
  onPress,
  showStatus = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.genuine;
      case 'recalled':
        return theme.colors.recalled;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'recalled':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, theme.shadows.md]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.drugName}>{drug.drug_name}</Text>
          <Text style={styles.manufacturer}>{drug.manufacturer}</Text>
        </View>
        {showStatus && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(drug.status) }]}>
            <Ionicons
              name={getStatusIcon(drug.status) as any}
              size={14}
              color={theme.colors.text.inverse}
            />
            <Text style={styles.statusText}>{drug.status.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="barcode-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.infoLabel}>Batch:</Text>
          <Text style={styles.infoValue}>{drug.batch_number}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="key-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.infoLabel}>Serial:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {drug.serial_number}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.infoLabel}>Mfg:</Text>
          <Text style={styles.infoValue}>{formatDate(drug.manufacturing_date)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.infoLabel}>Exp:</Text>
          <Text style={styles.infoValue}>{formatDate(drug.expiry_date)}</Text>
        </View>
      </View>

      {drug.description && (
        <>
          <View style={styles.divider} />
          <Text style={styles.description} numberOfLines={2}>
            {drug.description}
          </Text>
        </>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  drugName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  manufacturer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.sm,
  },
  infoContainer: {
    gap: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    flex: 1,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
});
