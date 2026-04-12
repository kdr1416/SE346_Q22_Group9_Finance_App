import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import { formatVND } from '../../utils/currency';

export default function PotActionModal({ visible, onClose, pot, availableBalance = 0, onDeposit, onWithdraw }) {
  const [mode, setMode] = useState('deposit'); // 'deposit' | 'withdraw'
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setAmount('');
      setError('');
      setMode('deposit');
    }
  }, [visible]);

  if (!pot) return null;

  const isDeposit = mode === 'deposit';
  const accentColor = isDeposit ? '#277C78' : Colors.error;

  const handleConfirm = async () => {
    setError('');
    const parsed = parseInt(amount, 10);
    if (!parsed || parsed <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    if (isDeposit) {
      // Kiểm tra số dư đủ để nạp không
      if (parsed > availableBalance) {
        setError(`Số dư hiện tại chỉ còn ${formatVND(availableBalance)}. Không thể nạp quá số tiền đang có.`);
        return;
      }
      onDeposit(pot, parsed);
      onClose();
    } else {
      if (parsed > pot.savedAmount) {
        setError(`Lọ chỉ còn ${formatVND(pot.savedAmount)}. Không thể rút nhiều hơn số tiền hiện có.`);
        return;
      }
      onWithdraw(pot, parsed);
      onClose();
    }
  };

  const remaining = pot.targetAmount - pot.savedAmount;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.potIcon, { backgroundColor: (pot.color || '#277C78') + '20' }]}>
              <Ionicons name={pot.iconName || 'wallet-outline'} size={24} color={pot.color || '#277C78'} />
            </View>
            <View style={styles.potInfo}>
              <Text style={styles.potName}>{pot.name}</Text>
              <Text style={styles.potBalance}>Hiện có: <Text style={{ color: pot.color || '#277C78', fontFamily: Typography.fontHeadline_Bold }}>{formatVND(pot.savedAmount)}</Text></Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Toggle Nạp / Rút */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isDeposit && { backgroundColor: '#277C78' }]}
              onPress={() => { setMode('deposit'); setError(''); }}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color={isDeposit ? Colors.white : Colors.onSurfaceVariant} />
              <Text style={[styles.toggleText, isDeposit && styles.toggleTextActive]}>Nạp vào</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isDeposit && { backgroundColor: Colors.error }]}
              onPress={() => { setMode('withdraw'); setError(''); }}
            >
              <Ionicons name="arrow-up-circle-outline" size={18} color={!isDeposit ? Colors.white : Colors.onSurfaceVariant} />
              <Text style={[styles.toggleText, !isDeposit && styles.toggleTextActive]}>Rút ra</Text>
            </TouchableOpacity>
          </View>

          {/* Thông tin gợi ý */}
          <View style={[styles.infoBox, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.infoText, { color: accentColor }]}>
              {isDeposit
                ? `Số dư khả dụng: ${formatVND(availableBalance)}  ·  Còn thiếu ${formatVND(Math.max(0, remaining))} để đạt mục tiêu`
                : `Số tiền rút tối đa: ${formatVND(pot.savedAmount)}`
              }
            </Text>
          </View>

          {/* Input số tiền */}
          <AppInput
            label="Số tiền (VND)"
            placeholder="VD: 500000"
            keyboardType="numeric"
            value={amount}
            onChangeText={(v) => { setAmount(v); setError(''); }}
          />

          {/* Thông báo lỗi */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Nút xác nhận */}
          <AppButton
            label={isDeposit ? 'Xác nhận nạp tiền' : 'Xác nhận rút tiền'}
            onPress={handleConfirm}
            style={{ backgroundColor: accentColor, marginTop: Spacing.md }}
          />
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
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.md },
  potIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  potInfo: { flex: 1 },
  potName: { fontFamily: Typography.fontHeadline_Bold, fontSize: Typography.titleMd, color: Colors.onSurface },
  potBalance: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  closeBtn: { padding: Spacing.xs },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Spacing.radiusMd,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderRadius: Spacing.radiusSm, gap: Spacing.xs,
  },
  toggleText: { fontFamily: Typography.fontBody_SemiBold, fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant },
  toggleTextActive: { color: Colors.white },
  infoBox: { borderRadius: Spacing.radiusMd, padding: Spacing.md, marginBottom: Spacing.md },
  infoText: { fontFamily: Typography.fontBody_Medium, fontSize: Typography.bodyMd, textAlign: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs, marginBottom: Spacing.sm },
  errorText: { fontFamily: Typography.fontBody_Regular, fontSize: Typography.bodySm, color: Colors.error, flex: 1 },
});
