import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import ProgressBar from '../ui/ProgressBar';
import { formatVND } from '../../utils/currency';

export default function PotItem({ item, onDeposit, onEdit, onComplete, onDelete }) {
  const progress = item.targetAmount > 0 ? Math.min(item.savedAmount / item.targetAmount, 1) : 0;
  const isCompleted = item.isCompleted;

  return (
    <View style={[styles.container, isCompleted && styles.containerCompleted]}>
      {/* Header: Icon + Tên + Badge */}
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: (item.color || '#277C78') + '20' }]}>
          <Ionicons name={item.iconName ?? 'wallet-outline'} size={20} color={item.color || '#277C78'} />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            {isCompleted && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={13} color={Colors.secondary} />
                <Text style={styles.badgeText}>Hoàn thành</Text>
              </View>
            )}
          </View>
          <Text style={styles.target}>Mục tiêu: {formatVND(item.targetAmount)}</Text>
          {item.targetDate && (
            <Text style={styles.targetDate}>Ngày: {item.targetDate}</Text>
          )}
        </View>
        <Text style={[styles.saved, { color: item.color || '#277C78' }]}>{formatVND(item.savedAmount)}</Text>
      </View>

      {/* Progress Bar */}
      <ProgressBar progress={progress} color={isCompleted ? Colors.secondary : (item.color || '#277C78')} style={{ marginBottom: Spacing.xs }} />
      <Text style={styles.percent}>{Math.round(progress * 100)}% hoàn thành</Text>

      {/* Action Buttons */}
      <View style={styles.actions}>
      {!isCompleted ? (
          <>
            <TouchableOpacity key="deposit" style={[styles.actionBtn, { borderColor: item.color || '#277C78' }]} onPress={onDeposit}>
              <Ionicons name="arrow-down-circle-outline" size={16} color={item.color || '#277C78'} />
              <Text style={[styles.actionText, { color: item.color || '#277C78' }]}>Nạp/Rút</Text>
            </TouchableOpacity>

            <TouchableOpacity key="edit" style={[styles.actionBtn, { borderColor: Colors.outline }]} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={16} color={Colors.onSurfaceVariant} />
              <Text style={[styles.actionText, { color: Colors.onSurfaceVariant }]}>Chỉnh sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity key="complete" style={[styles.actionBtn, { borderColor: Colors.secondary }]} onPress={onComplete}>
              <Ionicons name="flag-outline" size={16} color={Colors.secondary} />
              <Text style={[styles.actionText, { color: Colors.secondary }]}>Kết thúc</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity key="delete" style={[styles.actionBtn, { borderColor: Colors.error, flex: 1 }]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Xóa lọ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  containerCompleted: {
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  icon: {
    width: Spacing.iconContainer,
    height: Spacing.iconContainer,
    borderRadius: Spacing.iconContainer / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  name: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.titleSm,
    color: Colors.onSurface,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: 10,
    color: Colors.secondary,
  },
  target: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  targetDate: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  saved: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleMd,
  },
  percent: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'right',
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1.5,
  },
  actionText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
  },
});
