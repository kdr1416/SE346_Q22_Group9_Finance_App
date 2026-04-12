import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';

const PRESET_ICONS = [
  { icon: 'airplane-outline', label: 'Du lịch' },
  { icon: 'laptop-outline', label: 'Thiết bị' },
  { icon: 'shield-checkmark-outline', label: 'Khẩn cấp' },
  { icon: 'home-outline', label: 'Nhà ở' },
  { icon: 'car-outline', label: 'Xe cộ' },
  { icon: 'school-outline', label: 'Học tập' },
  { icon: 'heart-outline', label: 'Sức khỏe' },
  { icon: 'gift-outline', label: 'Quà tặng' },
  { icon: 'wallet-outline', label: 'Khác' },
];

const PRESET_COLORS = ['#277C78', '#865400', '#006d4a', '#9E422C', '#2196F3', '#9C27B0', '#E91E63', '#607D8B'];

export default function PotFormModal({ visible, onClose, onSave, onDelete, initialData }) {
  const isEditing = !!initialData;

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0].icon);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (initialData && visible) {
      setName(initialData.name);
      setTargetAmount(initialData.targetAmount.toString());
      setTargetDate(initialData.targetDate || '');
      setSelectedIcon(initialData.iconName || PRESET_ICONS[0].icon);
      setSelectedColor(initialData.color || PRESET_COLORS[0]);
    } else if (!visible) {
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setSelectedIcon(PRESET_ICONS[0].icon);
      setSelectedColor(PRESET_COLORS[0]);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!name || !targetAmount) return;
    onSave({
      id: isEditing ? initialData.id : undefined,
      name,
      targetAmount: parseInt(targetAmount, 10),
      targetDate: targetDate || null,
      iconName: selectedIcon,
      color: selectedColor,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>{isEditing ? 'Sửa Lọ Tiết Kiệm' : 'Tạo Lọ Mới'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Preview Icon */}
            <View style={styles.previewRow}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor + '25' }]}>
                <Ionicons name={selectedIcon} size={36} color={selectedColor} />
              </View>
              <Text style={[styles.previewName, { color: selectedColor }]}>{name || 'Tên lọ...'}</Text>
            </View>

            <AppInput label="Tên lọ tiết kiệm" placeholder="VD: Nghỉ hè, Laptop mới..." value={name} onChangeText={setName} />
            <AppInput label="Số tiền mục tiêu (VND)" placeholder="VD: 20000000" keyboardType="numeric" value={targetAmount} onChangeText={setTargetAmount} />
            <AppInput label="Ngày mục tiêu (tùy chọn)" placeholder="VD: 2025-12-31" value={targetDate} onChangeText={setTargetDate} />

            {/* Chọn Icon */}
            <Text style={styles.label}>Biểu tượng</Text>
            <View style={styles.iconRow}>
              {PRESET_ICONS.map(({ icon }) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconBtn, selectedIcon === icon && { backgroundColor: selectedColor + '25', borderColor: selectedColor }]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons name={icon} size={22} color={selectedIcon === icon ? selectedColor : Colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Chọn Màu */}
            <Text style={styles.label}>Màu sắc</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorBtn, { backgroundColor: color }, selectedColor === color && styles.colorBtnActive]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {isEditing && (
              <AppButton
                label="Xóa lọ"
                variant="secondary"
                style={{ flex: 0.4, backgroundColor: Colors.errorContainer }}
                onPress={() => { onDelete(initialData.id); onClose(); }}
              />
            )}
            <AppButton
              label={isEditing ? 'Cập nhật' : 'Tạo lọ'}
              onPress={handleSave}
              style={{ flex: 1, backgroundColor: selectedColor }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.radiusXl,
    borderTopRightRadius: Spacing.radiusXl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  heading: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.headlineSm, color: Colors.onSurface },
  closeBtn: { padding: Spacing.xs },
  form: { marginBottom: Spacing.lg },
  previewRow: { alignItems: 'center', marginBottom: Spacing.lg },
  previewIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  previewName: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleLg },
  label: { fontFamily: Typography.fontBody_Medium, fontSize: Typography.labelMd, color: Colors.onSurface, marginBottom: Spacing.sm, marginTop: Spacing.md },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.outlineVariant },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorBtnActive: { borderWidth: 2.5, borderColor: Colors.white, elevation: 4 },
  footer: { flexDirection: 'row', gap: Spacing.md },
});
