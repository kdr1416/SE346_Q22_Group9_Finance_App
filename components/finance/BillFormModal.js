import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import { EXPENSE_CATEGORIES } from '../../constants/Categories';

export default function BillFormModal({ visible, onClose, onSave, onDelete, initialData }) {
  const isEditing = !!initialData;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [dueDay, setDueDay] = useState('');
  const [dueMonth, setDueMonth] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  // Đổ dữ liệu có sẵn khi mở sửa
  useEffect(() => {
    if (initialData && visible) {
      setTitle(initialData.title);
      setAmount(initialData.amount.toString());
      setCycle(initialData.cycle);
      setDueDay(initialData.dueDayOfMonth?.toString() || '');
      setDueMonth(initialData.dueMonthOfYear?.toString() || '');
      const cat = EXPENSE_CATEGORIES.find(c => c.value === initialData.category);
      if (cat) setCategory(cat);
    } else if (!visible) {
      // Reset form khi ẩn
      setTitle('');
      setAmount('');
      setCycle('monthly');
      setDueDay('');
      setDueMonth('');
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!title || !amount || !dueDay) return;
    if (cycle === 'yearly' && !dueMonth) return;

    onSave({
      id: isEditing ? initialData.id : undefined,
      title,
      amount: parseInt(amount, 10),
      cycle,
      dueDayOfMonth: parseInt(dueDay, 10),
      dueMonthOfYear: cycle === 'yearly' ? parseInt(dueMonth, 10) : undefined,
      category: category.value,
      iconName: category.icon,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Sửa Hóa Đơn' : 'Thêm Hóa Đơn Mới'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <AppInput label="Tên hóa đơn" placeholder="VD: Tiền nhà, Internet..." value={title} onChangeText={setTitle} />

            <AppInput label="Số tiền (VND)" placeholder="VD: 500000" keyboardType="numeric" value={amount} onChangeText={setAmount} />

            <Text style={styles.label}>Chu kỳ</Text>
            <View style={styles.cycleRow}>
              <TouchableOpacity
                style={[styles.cycleBtn, cycle === 'monthly' && styles.cycleBtnActive]}
                onPress={() => setCycle('monthly')}
              >
                <Text style={[styles.cycleText, cycle === 'monthly' && styles.cycleTextActive]}>Hằng tháng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cycleBtn, cycle === 'yearly' && styles.cycleBtnActive]}
                onPress={() => setCycle('yearly')}
              >
                <Text style={[styles.cycleText, cycle === 'yearly' && styles.cycleTextActive]}>Hằng năm</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <AppInput label="Ngày hạn (1-31)" placeholder="VD: 15" keyboardType="numeric" value={dueDay} onChangeText={setDueDay} />
              </View>
              {cycle === 'yearly' && (
                <View style={[styles.flex1, { marginLeft: Spacing.md }]}>
                  <AppInput label="Tháng hạn (1-12)" placeholder="VD: 10" keyboardType="numeric" value={dueMonth} onChangeText={setDueMonth} />
                </View>
              )}
            </View>

            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.catRow}>
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catBtn, category.value === cat.value && styles.catBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons name={cat.icon} size={20} color={category.value === cat.value ? Colors.primary : Colors.onSurfaceVariant} />
                  <Text style={[styles.catText, category.value === cat.value && styles.catTextActive]}>{cat.value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {isEditing && (
              <AppButton
                label="Xóa"
                onPress={() => onDelete(initialData.id)}
                variant="secondary"
                style={{ flex: 0.4, backgroundColor: Colors.errorContainer }}
              />
            )}
            <AppButton
              label={isEditing ? "Cập nhật" : "Lưu Hóa Đơn"}
              onPress={handleSave}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.radiusXl,
    borderTopRightRadius: Spacing.radiusXl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineSm,
    color: Colors.onSurface,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cycleBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
  },
  cycleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  cycleText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  cycleTextActive: {
    color: Colors.primaryDark,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: Spacing.xs,
  },
  catBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  catText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  catTextActive: {
    color: Colors.primaryDark,
    fontFamily: Typography.fontBody_Medium,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  }
});
