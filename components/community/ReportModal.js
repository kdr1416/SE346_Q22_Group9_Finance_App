import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

const REPORT_REASONS = [
  'Nội dung spam',
  'Ngôn từ xúc phạm, thù ghét',
  'Thông tin sai lệch, lừa đảo',
  'Quảng cáo trái phép, bán hàng',
  'Khác',
];

export default function ReportModal({ visible, onClose, onSubmit, targetType }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');

  const handleClose = () => {
    setSelectedReason('');
    setDetail('');
    onClose();
  };

  const handleSub = () => {
    // BR-COM09: Báo cáo bắt buộc chọn lý do
    if (!selectedReason) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn một lý do báo cáo.');
      return;
    }

    if (selectedReason === 'Khác' && !detail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mô tả chi tiết cho lý do khác.');
      return;
    }

    onSubmit(selectedReason, detail.trim());
    setSelectedReason('');
    setDetail('');
  };

  const displayName = targetType === 'post' ? 'bài viết' : 'bình luận';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheet}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Báo cáo {displayName}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Hãy chọn lý do báo cáo nội dung này. Báo cáo của bạn sẽ được gửi tới Ban quản trị kiểm duyệt.
              </Text>

              {/* Reasons List */}
              <View style={styles.reasonsList}>
                {REPORT_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[styles.reasonOption, isSelected ? styles.reasonOptionActive : null]}
                      onPress={() => setSelectedReason(reason)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? Colors.error : Colors.outline}
                      />
                      <Text style={[styles.reasonText, isSelected ? styles.reasonTextActive : null]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Detail Input for "Khác" */}
              {selectedReason === 'Khác' && (
                <TextInput
                  style={styles.detailInput}
                  placeholder="Vui lòng nhập thêm thông tin chi tiết vi phạm..."
                  placeholderTextColor={Colors.outline}
                  multiline
                  numberOfLines={3}
                  value={detail}
                  onChangeText={setDetail}
                  maxLength={200}
                />
              )}

              {/* Actions Footer */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, !selectedReason ? styles.submitBtnDisabled : null]}
                  onPress={handleSub}
                  disabled={!selectedReason}
                >
                  <Text style={styles.submitBtnText}>Gửi báo cáo</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.radiusXl,
    borderTopRightRadius: Spacing.radiusXl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + (Platform.OS === 'ios' ? 12 : 0),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleLg,
    color: Colors.error, // Sử dụng màu đỏ cảnh báo để tạo sự trang nghiêm
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  reasonsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
    gap: Spacing.sm,
  },
  reasonOptionActive: {
    borderColor: Colors.errorContainer,
    backgroundColor: '#fff8f7',
  },
  reasonText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  },
  reasonTextActive: {
    fontFamily: Typography.fontHeadline_SemiBold,
    color: Colors.error,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.sm,
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.onSurface,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.bodyLg,
    color: Colors.white,
  },
});
