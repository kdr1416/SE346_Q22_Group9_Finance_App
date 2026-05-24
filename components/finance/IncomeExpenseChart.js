import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { formatVND } from '../../utils/currency';

export default function IncomeExpenseChart({ income = 0, expenses = 0 }) {
  const total = income + expenses;
  const incomePercent = total > 0 ? (income / total) * 100 : 0;
  const expensesPercent = total > 0 ? (expenses / total) * 100 : 0;

  // Khởi tạo giá trị Animation để tạo hiệu ứng chạy thanh biểu đồ
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
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Thống kê thu chi tháng này</Text>
      
      {/* Khối Thu Nhập */}
      <View style={styles.row}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tổng Thu Nhập</Text>
          <Text style={styles.incomeValue}>{formatVND(income)}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View 
            style={[
              styles.bar, 
              { 
                backgroundColor: '#2E7D32',
                width: animIncome.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>
      </View>

      {/* Khối Chi Tiêu */}
      <View style={styles.row}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tổng Chi Tiêu</Text>
          <Text style={styles.expenseValue}>{formatVND(expenses)}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View 
            style={[
              styles.bar, 
              { 
                backgroundColor: Colors.error, 
                width: animExpenses.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>
      </View>

      {/* Phân tích tỷ lệ chi tiêu tự động */}
      {income > 0 && expenses > 0 && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisText}>
            Chi tiêu hiện tại đang chiếm <Text style={styles.highlight}>{((expenses / income) * 100).toFixed(1)}%</Text> tổng thu nhập.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurface,
    marginBottom: Spacing.lg,
  },
  row: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  incomeValue: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodyMd,
    color: '#2E7D32',
  },
  expenseValue: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodyMd,
    color: Colors.error,
  },
  track: {
    height: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  analysisContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  analysisText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  highlight: {
    fontFamily: Typography.fontBody_Bold,
    color: Colors.primary,
  },
});
