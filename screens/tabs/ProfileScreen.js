import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useProfile from '../../hooks/tabs/useProfile';

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
  const { user, handleLogout, handleEditProfile, handleChangePassword } = useProfile(navigation);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hồ sơ</Text>
        </View>

        {/* Avatar */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Cài đặt tài khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tài khoản</Text>
          <View style={styles.card}>
            <SettingRow icon="person-outline" label="Chỉnh sửa hồ sơ" onPress={handleEditProfile} />
            <View style={styles.divider} />
            <SettingRow icon="lock-closed-outline" label="Đổi mật khẩu" onPress={handleChangePassword} />
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
});
