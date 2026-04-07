import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TransactionItem from '../../components/finance/TransactionItem';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { mockTransactions } from '../../data/mockData';

const CATEGORIES = ['Tất cả', 'Income', 'Dining Out', 'Groceries', 'Entertainment', 'Transport', 'Shopping'];

export default function TransactionsScreen() {
  const [active, setActive] = useState('Tất cả');
  const filtered = active === 'Tất cả'
    ? mockTransactions
    : mockTransactions.filter(t => active === 'Income' ? t.type === 'income' : t.category === active);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Giao dịch</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, active === item && styles.chipActive]}
            onPress={() => setActive(item)}
          >
            <Text style={[styles.chipText, active === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
        style={{ flexGrow: 0, marginBottom: Spacing.sm }}
      />

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        renderItem={({ item }) => <TransactionItem item={item} />}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<Text style={styles.empty}>Không có giao dịch nào</Text>}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  title: { fontSize: Typography.headlineMd, fontWeight: Typography.bold, color: Colors.onSurface, letterSpacing: Typography.tightTracking },
  filterList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: Spacing.radiusFull, backgroundColor: Colors.surfaceContainerHigh },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: Typography.labelMd, color: Colors.onSurfaceVariant, fontWeight: Typography.medium },
  chipTextActive: { color: Colors.onPrimary },
  sep: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginLeft: Spacing.iconContainer + Spacing.md },
  empty: { fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', paddingTop: Spacing.xxxl },
});
