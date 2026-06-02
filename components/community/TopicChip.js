import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function TopicChip({ topic, selected, onPress }) {
  const activeColor = topic.color || Colors.secondary;

  return (
    <Pressable
      style={[
        styles.chip,
        selected
          ? { backgroundColor: activeColor, borderColor: activeColor }
          : { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={topic.iconName || 'pricetag-outline'}
        size={16}
        color={selected ? Colors.white : activeColor}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : { color: Colors.onSurface },
        ]}
      >
        {topic.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1,
    marginRight: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
  },
  labelSelected: {
    color: Colors.white,
    fontFamily: Typography.fontHeadline_SemiBold,
  },
});
