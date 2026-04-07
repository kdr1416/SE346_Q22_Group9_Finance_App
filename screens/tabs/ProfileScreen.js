import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { mockUser } from '../../data/mockData';

function SettingRow({ icon, label, onPress, destructive }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={destructive ? Colors.error : Colors.onSurfaceVariant} />
      </View>
      <Text style={[styles.rowLabel, destructive && { color: Colors.error }]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={Colors.onSurfaceVariant} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hồ sơ</Text>
        </View>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{mockUser.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{mockUser.name}</Text>
          <Text style={styles.email}>{mockUser.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tài khoản</Text>
          <View style={styles.card}>
            <SettingRow icon="person-outline" label="Chỉnh sửa hồ sơ" onPress={() => {}} />
            <View style={styles.divider} />
            <SettingRow icon="lock-closed-outline" label="Đổi mật khẩu" onPress={() => {}} />
            <View style={styles.divider} />
            <SettingRow icon="notifications-outline" label="Thông báo" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ứng dụng</Text>
          <View style={styles.card}>
            <SettingRow icon="color-palette-outline" label="Giao diện" onPress={() => {}} />
            <View style={styles.divider} />
            <SettingRow icon="information-circle-outline" label="Về ứng dụng" onPress={() => {}} />
          </View>
        </View>

        <View style={[styles.section, { marginTop: Spacing.base }]}>
          <View style={styles.card}>
            <SettingRow
              icon="log-out-outline"
              label="Đăng xuất"
              onPress={() => navigation.replace('Auth')}
              destructive
            />
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
  title: { fontSize: Typography.headlineMd, fontWeight: Typography.bold, color: Colors.onSurface, letterSpacing: Typography.tightTracking },
  profile: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.base },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: Typography.headlineMd, fontWeight: Typography.bold, color: Colors.onPrimary },
  name: { fontSize: Typography.titleMd, fontWeight: Typography.semiBold, color: Colors.onSurface, marginBottom: 4 },
  email: { fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionLabel: { fontSize: Typography.labelMd, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm, fontWeight: Typography.medium },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Spacing.radiusLg, overflow: 'hidden', shadowColor: Colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md },
  rowIcon: { width: 32, alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: Typography.bodyMd, color: Colors.onSurface },
  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginLeft: Spacing.base + 32 + Spacing.md },
});
