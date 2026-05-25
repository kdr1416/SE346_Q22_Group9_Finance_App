import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { formatVND } from '../../utils/currency';

export default function HeroBalanceCard({ totalBalance, income = 0, expenses = 0, style }) {
  const total = income + expenses;
  const incomePercent = total > 0 ? (income / total) * 100 : 0;
  const expensesPercent = total > 0 ? (expenses / total) * 100 : 0;

  // Animation chạy thanh tiến trình khi mở màn hình
  const animIncome = useRef(new Animated.Value(0)).current;
  const animExpenses = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animIncome, {
        toValue: incomePercent,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animExpenses, {
        toValue: expensesPercent,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [income, expenses, incomePercent, expensesPercent]);

  return (
    <View style={[styles.card, style]}>
      {/* Khối Số dư hiện tại */}
      <Text style={styles.label}>Số dư hiện tại</Text>
      <Text style={styles.balance}>{formatVND(totalBalance)}</Text>

      {/* Đường phân cách mờ */}
      <View style={styles.divider} />

      {/* Tiêu đề khối Thống kê */}
      <Text style={styles.chartTitle}>Thống kê thu chi tháng này</Text>

      {/* Thanh Tiến trình Thu nhập */}
      <View style={styles.row}>
        <View style={styles.infoRow}>
          <Text style={styles.statLabel}>Tổng thu nhập</Text>
          <Text style={styles.incomeValue}>{formatVND(income)}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View 
            style={[
              styles.bar, 
              { 
                backgroundColor: '#4ADE80', // Xanh dạ quang phát sáng nhẹ trên nền tối
                width: animIncome.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>
      </View>

      {/* Thanh Tiến trình Chi tiêu */}
      <View style={styles.row}>
        <View style={styles.infoRow}>
          <Text style={styles.statLabel}>Tổng chi tiêu</Text>
          <Text style={styles.expenseValue}>{formatVND(expenses)}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View 
            style={[
              styles.bar, 
              { 
                backgroundColor: '#F87171', // Đỏ san hô phát sáng nhẹ trên nền tối
                width: animExpenses.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>
      </View>

      {/* Phân tích nhanh bằng chữ */}
      {income > 0 && expenses > 0 && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisText}>
            Chi tiêu hiện tại chiếm <Text style={styles.highlight}>{((expenses / income) * 100).toFixed(1)}%</Text> thu nhập.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  label: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.labelMd,
    color: Colors.onPrimary,
    opacity: 0.75,
    marginBottom: Spacing.xs,
  },
  balance: {
    fontFamily: Typography.fontHeadline_ExtraBold,
    fontSize: Typography.displayLg,
    color: Colors.onPrimary,
    letterSpacing: Typography.tightTracking,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.onPrimary,
    opacity: 0.15,
    marginVertical: Spacing.lg,
  },
  chartTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.bodySm,
    color: Colors.onPrimary,
    opacity: 0.9,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onPrimary,
    opacity: 0.75,
  },
  incomeValue: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodySm,
    color: '#4ADE80',
  },
  expenseValue: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodySm,
    color: '#F87171',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Rãnh mờ bên dưới
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  analysisContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  analysisText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.onPrimary,
    opacity: 0.8,
    textAlign: 'center',
  },
  highlight: {
    fontFamily: Typography.fontBody_Bold,
    color: '#FFFFFF',
  },
});
