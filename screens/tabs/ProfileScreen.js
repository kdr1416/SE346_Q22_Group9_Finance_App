import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Modal, TextInput, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useProfile from '../../hooks/tabs/useProfile';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';

function SettingRow({ icon, label, onPress, destructive = false }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? Colors.error : Colors.onSurfaceVariant}
        />
      </View>
      <Text style={[styles.rowLabel, destructive && { color: Colors.error }]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={Colors.onSurfaceVariant} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, handleLogout, handleSaveName, handleUpdatePassword } = useProfile(navigation);

  const [editNameVisible, setEditNameVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync newName when user data is available
  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user]);

  const onEditNamePress = () => {
    setNewName(user.name);
    setEditNameVisible(true);
  };

  const onSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Thông báo', 'Họ tên không được để trống.');
      return;
    }
    setLoading(true);
    try {
      await handleSaveName(newName.trim());
      setEditNameVisible(false);
      Alert.alert('Thành công', 'Đã cập nhật họ tên của bạn!');
    } catch (e) {
      // Error handled inside hook
    } finally {
      setLoading(false);
    }
  };

  const onUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      await handleUpdatePassword(newPassword);
      setChangePasswordVisible(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', 'Đổi mật khẩu tài khoản thành công!');
    } catch (e) {
      // Error handled inside hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hồ sơ</Text>
        </View>

        {/* Avatar */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Cài đặt tài khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tài khoản</Text>
          <View style={styles.card}>
            <SettingRow icon="person-outline" label="Chỉnh sửa hồ sơ" onPress={onEditNamePress} />
            <View style={styles.divider} />
            <SettingRow icon="lock-closed-outline" label="Đổi mật khẩu" onPress={() => setChangePasswordVisible(true)} />
            <View style={styles.divider} />
            <SettingRow icon="notifications-outline" label="Thông báo" onPress={() => {}} />
          </View>
        </View>

        {/* Cài đặt app */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ứng dụng</Text>
          <View style={styles.card}>
            <SettingRow icon="color-palette-outline" label="Giao diện" onPress={() => {}} />
            <View style={styles.divider} />
            <SettingRow icon="information-circle-outline" label="Về ứng dụng" onPress={() => {}} />
          </View>
        </View>

        {/* Đăng xuất */}
        <View style={[styles.section, { marginTop: Spacing.base }]}>
          <View style={styles.card}>
            <SettingRow icon="log-out-outline" label="Đăng xuất" onPress={handleLogout} destructive />
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* ==================== MODAL ĐỔI TÊN HỒ SƠ ==================== */}
      <Modal
        visible={editNameVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditNameVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh sửa họ tên ✍️</Text>
            
            <AppInput
              label="Họ và tên mới"
              value={newName}
              onChangeText={setNewName}
              placeholder="Nhập tên mới của bạn"
              iconName="person-outline"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setEditNameVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSave]} 
                onPress={onSaveName}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== MODAL ĐỔI MẬT KHẨU ==================== */}
      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thay đổi mật khẩu 🔐</Text>
            
            <AppInput
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Tối thiểu 6 ký tự"
              secureTextEntry
              iconName="lock-closed-outline"
            />

            <AppInput
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              secureTextEntry
              iconName="shield-checkmark-outline"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setChangePasswordVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSave]} 
                onPress={onUpdatePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Đồng ý</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onSurface,
    letterSpacing: Typography.tightTracking,
  },
  profile: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.base },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.onPrimary,
  },
  name: {
    fontFamily: Typography.fontHeadline_SemiBold,
    fontSize: Typography.titleMd,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  email: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionLabel: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Spacing.radiusLg,
    overflow: 'hidden',
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowIcon: { width: 32, alignItems: 'center' },
  rowLabel: {
    flex: 1,
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginLeft: Spacing.base + 32 + Spacing.md,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    elevation: 10,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalTitle: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.titleLg,
    color: Colors.onSurface,
    marginBottom: Spacing.lg,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusMd,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  modalBtnCancelText: {
    fontFamily: Typography.fontBody_SemiBold,
    color: Colors.onSurfaceVariant,
    fontSize: Typography.bodyMd,
  },
  modalBtnSave: {
    backgroundColor: Colors.primary,
  },
  modalBtnSaveText: {
    fontFamily: Typography.fontBody_SemiBold,
    color: Colors.white,
    fontSize: Typography.bodyMd,
  },
});
