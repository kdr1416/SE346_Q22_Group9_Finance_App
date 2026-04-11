import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { formatVND } from '../../utils/currency';

export default function BillItem({ item, onToggle = null, onEdit = null, compact = false }) {
  const dueText = item.cycle === 'yearly'
    ? `Ngày ${item.dueDayOfMonth}/${item.dueMonthOfYear} (Hằng năm)`
    : `Ngày ${item.dueDayOfMonth} (Hằng tháng)`;

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.7}
      disabled={!onEdit}
      onPress={() => onEdit && onEdit(item)}
    >
      {/* Icon */}
      <View style={[styles.icon, item.isPaid && styles.iconPaid]}>
        <Ionicons
          name={item.iconName ?? 'receipt-outline'}
          size={18}
          color={item.isPaid ? Colors.secondary : Colors.tertiary}
        />
      </View>

      {/* Thông tin */}
      <View style={styles.info}>
        <Text style={[styles.title, item.isPaid && styles.titlePaid]}>{item.title}</Text>
        <Text style={[styles.due, item.isPaid && styles.duePaid]}>
          {item.isPaid ? '✓ Đã thanh toán' : `Hạn: ${dueText}`}
        </Text>
      </View>

      {/* Số tiền + Toggle */}
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, item.isPaid && { color: Colors.secondary }]}>
          {formatVND(item.amount)}
        </Text>
        {onToggle && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggle(item.id, item.isPaid, item.currentPeriod);
            }}
            style={[styles.check, item.isPaid && styles.checkPaid]}
            activeOpacity={0.7}
          >
            {item.isPaid && (
              <Ionicons name="checkmark" size={14} color={Colors.white} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  icon: {
    width: Spacing.iconContainer,
    height: Spacing.iconContainer,
    borderRadius: Spacing.iconContainer / 2,
    backgroundColor: Colors.tertiaryContainer + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPaid: { backgroundColor: Colors.secondaryContainer + '40' },
  info: { flex: 1 },
  title: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.titleSm,
    color: Colors.onSurface,
  },
  titlePaid: { color: Colors.onSurfaceVariant },
  due: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.tertiary,
    marginTop: 2,
  },
  duePaid: { color: Colors.secondary },
  amountWrap: { alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.sm },
  amount: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.titleSm,
    color: Colors.onSurface,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  checkPaid: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
});
