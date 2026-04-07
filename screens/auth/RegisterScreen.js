import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import SocialButton from '../../components/ui/SocialButton';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useRegister from '../../hooks/auth/useRegister';

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const {
    name, email, password,
    nameError, emailError, passwordError, generalError, loading,
    handleNameChange, handleEmailChange, handlePasswordChange,
    handleRegister, goBack,
  } = useRegister({ navigation });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Floating Back Button (Glass-like) */}
      <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={24} color={Colors.onSurface} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Kiểm soát tài chính dễ dàng</Text>
          </View>

          {/* Floating Card */}
          <View style={styles.card}>
            {generalError ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={20} color={Colors.error} />
                <Text style={styles.errorBoxText}>{generalError}</Text>
              </View>
            ) : null}

            <AppInput
              label="Họ và tên"
              placeholder="Nhập họ và tên của bạn"
              value={name}
              onChangeText={handleNameChange}
              error={nameError}
              iconName="person-outline"
            />

            <AppInput
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChangeText={handleEmailChange}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="mail-outline"
            />

            <AppInput
              label="Mật khẩu"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChangeText={handlePasswordChange}
              error={passwordError}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            <AppButton label="Đăng ký ngay" onPress={handleRegister} loading={loading} style={{ marginTop: Spacing.md }} />

            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>Đăng ký với</Text>
              <View style={styles.divider} />
            </View>

            <SocialButton provider="Google" onPress={() => { }} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={goBack} activeOpacity={0.7}>
                <Text style={styles.login}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceContainerHighest },
  backBtn: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: height * 0.12 },
  header: { marginBottom: Spacing.xxl },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.primary,
    letterSpacing: Typography.tightTracking,
  },
  subtitle: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyLg,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    shadowColor: Colors.onSurface,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  orText: {
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  login: {
    fontFamily: Typography.fontBody_SemiBold,
    fontSize: Typography.bodyMd,
    color: Colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    padding: Spacing.md,
    borderRadius: Spacing.radiusMd,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorBoxText: {
    flex: 1,
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodySm,
    color: Colors.error,
  },
});
