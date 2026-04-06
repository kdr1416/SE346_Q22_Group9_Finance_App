import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function BillItem({ item }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name={item.iconName ?? 'receipt-outline'} size={18} color={Colors.tertiary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.due}>Hạn: {item.dueDate}</Text>
      </View>
      <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  icon: { width: Spacing.iconContainer, height: Spacing.iconContainer, borderRadius: Spacing.iconContainer / 2, backgroundColor: Colors.tertiaryContainer + '30', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  info: { flex: 1 },
  title: { fontSize: Typography.titleSm, fontWeight: Typography.medium, color: Colors.onSurface },
  due: { fontSize: Typography.labelMd, color: Colors.tertiary, marginTop: 2 },
  amount: { fontSize: Typography.titleSm, fontWeight: Typography.medium, color: Colors.onSurface },
});
