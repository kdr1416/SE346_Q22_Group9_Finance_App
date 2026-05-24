import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatVND } from '../../utils/currency';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function SpendingPieChart({ breakdown = [] }) {
  const totalSpent = breakdown.reduce((sum, item) => sum + item.spent, 0);

  if (totalSpent === 0 || breakdown.length === 0) {
    return null; // Không hiển thị nếu chưa có chi tiêu
  }

  const radius = 55;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const size = (radius + strokeWidth) * 2;

  let currentAngle = 0;

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Cơ cấu chi tiêu thực tế</Text>
      
      <View style={styles.contentRow}>
        {/* Biểu đồ Donut vẽ bằng SVG nguyên bản */}
        <View style={styles.chartWrapper}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <View style={{ transform: [{ rotate: '-90deg' }], originX: size / 2, originY: size / 2 }}>
              {breakdown.map((item, index) => {
                const percentage = item.spent / totalSpent;
                const strokeLength = percentage * circumference;
                const strokeOffset = circumference - (strokeLength + currentAngle);
                
                // Tích lũy góc xoay cho lát cắt tiếp theo
                currentAngle += strokeLength;

                return (
                  <Circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={item.color || '#cccccc'}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${strokeLength} ${circumference}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Lớp nền trong suốt tạo khoảng khuyết ở giữa */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius - strokeWidth / 2 - 1}
                fill="#ffffff"
              />
            </View>
          </Svg>
          
          {/* Label hiển thị tổng số tiền chi tiêu ở tâm Donut */}
          <View style={styles.centerTextContainer}>
            <Text style={styles.centerLabel}>Đã chi</Text>
            <Text style={styles.centerValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatVND(totalSpent).replace('₫', '')}
            </Text>
            <Text style={styles.centerUnit}>VND</Text>
          </View>
        </View>

        {/* Cột chú thích danh mục bên phải (Giới hạn tối đa 4 danh mục lớn nhất để cân đối UI) */}
        <View style={styles.legendContainer}>
          {breakdown.slice(0, 4).map((item, index) => {
            const percentage = (item.spent / totalSpent) * 100;
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <View style={styles.legendInfo}>
                  <Text style={styles.legendLabel} numberOfLines={1}>{item.category}</Text>
                  <Text style={styles.legendPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  centerLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyXs,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerValue: {
    fontFamily: Typography.fontHeadline_ExtraBold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
    textAlign: 'center',
    marginTop: 2,
  },
  centerUnit: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  legendContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  legendInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurface,
    flex: 1,
    marginRight: Spacing.xs,
  },
  legendPercentage: {
    fontFamily: Typography.fontBody_Bold,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
});
