import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PotItem from '../../components/finance/PotItem';
import AppButton from '../../components/ui/AppButton';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import usePots from '../../hooks/tabs/usePots';
import { formatVND } from '../../utils/currency';

export default function PotsScreen() {
  const { pots, totalSaved, totalTarget, handleAddPot } = usePots();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Lọ tiết kiệm</Text>
        </View>

        {/* Tóm tắt */}
        <View style={styles.summaryCard}>
          <Text style={styles.sumLabel}>Tổng đã tiết kiệm</Text>
          <Text style={styles.sumAmount}>{formatVND(totalSaved)}</Text>
          <Text style={styles.sumOf}>trên {formatVND(totalTarget)} mục tiêu</Text>
        </View>

        {/* Danh sách */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Các lọ tiết kiệm</Text>
          <View style={styles.card}>
            {pots.map(p => <PotItem key={p.id} item={p} />)}
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.base }}>
          <AppButton label="+ Tạo lọ tiết kiệm mới" onPress={handleAddPot} variant="secondary" />
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  summaryCard: {
    backgroundColor: Colors.secondary,
    marginHorizontal: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sumLabel: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSecondary,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  sumAmount: {
    fontFamily: Typography.fontHeadline_ExtraBold,
    fontSize: Typography.displayMd,
    color: Colors.onSecondary,
    letterSpacing: Typography.tightTracking,
    marginBottom: 4,
  },
  sumOf: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSecondary,
    opacity: 0.8,
  },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
  sectionTitle: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.base,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
});
