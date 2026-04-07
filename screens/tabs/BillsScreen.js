import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BillItem from '../../components/finance/BillItem';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useBills from '../../hooks/tabs/useBills';

export default function BillsScreen({ navigation }) {
  const { bills, unpaid, paid, totalDue, totalPaid, togglePaid } = useBills();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Hóa đơn tháng này</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tóm tắt */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.error + '15' }]}>
          <Text style={styles.sumLabel}>Chưa thanh toán</Text>
          <Text style={[styles.sumAmount, { color: Colors.error }]}>
            ${totalDue.toFixed(2)}
          </Text>
          <Text style={styles.sumCount}>{unpaid.length} hóa đơn</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.secondary + '15' }]}>
          <Text style={styles.sumLabel}>Đã thanh toán</Text>
          <Text style={[styles.sumAmount, { color: Colors.secondary }]}>
            ${totalPaid.toFixed(2)}
          </Text>
          <Text style={styles.sumCount}>{paid.length} hóa đơn</Text>
        </View>
      </View>

      {/* Danh sách */}
      <FlatList
        data={bills}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <BillItem item={item} onToggle={togglePaid} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.listHeader}>Chạm vào ô tròn để đánh dấu đã trả</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.base,
  },
  sumLabel: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  sumAmount: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm,
    letterSpacing: Typography.tightTracking,
  },
  sumCount: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listHeader: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  sep: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginLeft: Spacing.iconContainer + Spacing.md,
  },
});
