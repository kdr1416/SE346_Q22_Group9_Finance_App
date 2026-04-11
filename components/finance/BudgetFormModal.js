import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';

export default function BudgetFormModal({ visible, onClose, onSave, onDelete, initialData, availableCategories }) {
  const isEditing = !!initialData;
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(null);

  useEffect(() => {
    if (initialData && visible) {
      setAmount(initialData.limit.toString());
      setCategory({ value: initialData.category, icon: initialData.iconName });
    } else if (!visible) {
      setAmount('');
      if (availableCategories.length > 0) {
         setCategory(availableCategories[0]);
      } else {
         setCategory(null);
      }
    }
  }, [initialData, visible, availableCategories]);

  // Handle empty state gracefully
  useEffect(() => {
    if (!isEditing && visible && !category && availableCategories.length > 0) {
      setCategory(availableCategories[0]);
    }
  }, [visible, availableCategories, category, isEditing]);

  const handleSave = () => {
    if (!amount || !category) return;

    onSave({
      id: isEditing ? initialData.id : undefined,
      limit: parseInt(amount, 10),
      category: category.value,
    });
    onClose();
  };

  const renderCategories = () => {
    // Khi rỗng (hết category)
    if (!isEditing && availableCategories.length === 0) {
        return <Text style={styles.emptyText}>Mọi danh mục tháng này đã được thiết lập ngân sách.</Text>
    }
    
    // Nếu đang sửa, chỉ được quyền hiển thị category cũ vì không được sửa loại Category (Chống conflict)
    const renderList = isEditing ? [category] : availableCategories;
    
    return renderList.map(cat => {
      if (!cat) return null;
      return (
        <TouchableOpacity
          key={cat.value}
          style={[styles.catBtn, category?.value === cat.value && styles.catBtnActive]}
          onPress={() => !isEditing && setCategory(cat)}
        >
          <Ionicons name={cat.icon || 'star'} size={20} color={category?.value === cat.value ? Colors.primary : Colors.onSurfaceVariant} />
          <Text style={[styles.catText, category?.value === cat.value && styles.catTextActive]}>{cat.value}</Text>
        </TouchableOpacity>
      )
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>{isEditing ? 'Sửa Ngân Sách' : 'Thêm Ngân Sách Tháng'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <AppInput label="Hạn Mức Ngân Sách (VND)" placeholder="VD: 2000000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            
            <Text style={styles.label}>Áp dụng cho Danh Mục</Text>
            <View style={styles.catRow}>
               {renderCategories()}
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
              label={isEditing ? "Cập nhật" : "Lưu Ngân Sách"} 
              onPress={handleSave} 
              style={{ flex: 1 }} 
              disabled={!category || !amount}
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
  emptyText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  }
});
