import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/Categories';

export default function TransactionFormModal({ visible, onClose, onSave, onDelete, initialData }) {
  const isEditing = !!initialData;
  
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);

  // Đổ dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (initialData && visible) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(initialData.amount.toString());
      
      const catList = initialData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const cat = catList.find(c => c.value === initialData.category);
      if (cat) setCategory(cat);
    } else if (!visible) {
      // Reset khi đóng
      setType('expense');
      setTitle('');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [initialData, visible]);

  // Đổi type thì cài lại default category
  const handleTypeToggle = (selectedType) => {
    setType(selectedType);
    setCategory(selectedType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSave = () => {
    if (!title || !amount) return;

    onSave({
      id: isEditing ? initialData.id : undefined,
      title,
      amount: parseInt(amount, 10),
      type,
      category: category.value,
      iconName: category.icon,
      date: isEditing ? initialData.date : new Date().toISOString()
    });
    onClose();
  };

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>{isEditing ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Loại giao dịch (Toggle) */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
                onPress={() => handleTypeToggle('expense')}
              >
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Chi tiêu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
                onPress={() => handleTypeToggle('income')}
              >
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Thu nhập</Text>
              </TouchableOpacity>
            </View>

            <AppInput label="Nội dung" placeholder="VD: Mua cà phê..." value={title} onChangeText={setTitle} />
            
            <AppInput label="Số tiền (VND)" placeholder="VD: 50000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            
            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.catRow}>
              {currentCategories.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catBtn, category.value === cat.value && (type === 'income' ? styles.catBtnIncome : styles.catBtnExpense)]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons name={cat.icon} size={18} color={category.value === cat.value ? (type === 'income' ? Colors.secondary : Colors.error) : Colors.onSurfaceVariant} />
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
                style={{ flex: 0.4, backgroundColor: Colors.errorContainer, } } // Override text color if needed, but AppButton uses predefined style.
              />
            )}
            <AppButton 
              label={isEditing ? "Cập nhật" : "Lưu Giao Dịch"} 
              onPress={handleSave} 
              style={{ flex: 1, backgroundColor: type === 'income' ? Colors.secondary : Colors.primary }} 
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heading: {
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
  typeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Spacing.radiusMd,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Spacing.radiusSm,
  },
  typeBtnExpense: {
    backgroundColor: Colors.error,
  },
  typeBtnIncome: {
    backgroundColor: Colors.secondary,
  },
  typeText: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  typeTextActive: {
    color: Colors.white,
  },
  label: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
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
  catBtnExpense: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorContainer + '40',
  },
  catBtnIncome: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryContainer + '50',
  },
  catText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  catTextActive: {
    color: Colors.primaryDark, // Fallback if missing
    fontFamily: Typography.fontBody_Medium,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  }
});
