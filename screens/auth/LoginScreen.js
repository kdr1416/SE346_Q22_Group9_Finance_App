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
import useLogin from '../../hooks/auth/useLogin';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const {
    email, password, emailError, passwordError, generalError, loading,
    handleEmailChange, handlePasswordChange, handleLogin, goToRegister,
  } = useLogin(navigation);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header Title Section */}
          <View style={styles.header}>
            <Text style={styles.appName}>Finance App</Text>
            <Text style={styles.tagline}>Mừng bạn quay trở lại 👋</Text>
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
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={handlePasswordChange}
              error={passwordError}
              secureTextEntry
              iconName="lock-closed-outline"
            />

            <TouchableOpacity style={styles.forgot}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <AppButton label="Đăng nhập" onPress={handleLogin} loading={loading} style={{ marginTop: Spacing.md }} />

            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>Hoặc tiếp tục với</Text>
              <View style={styles.divider} />
            </View>

            <SocialButton provider="Google" onPress={() => { }} />
            <SocialButton provider="Apple" onPress={() => { }} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={goToRegister} activeOpacity={0.7}>
                <Text style={styles.signUp}>Đăng ký ngay</Text>
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
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: height * 0.08 },
  header: { marginBottom: Spacing.xxl },
  appName: {
    fontFamily: Typography.fontHeadline_ExtraBold,
    fontSize: Typography.displayMd,
    color: Colors.primary,
    letterSpacing: Typography.tightTracking,
  },
  tagline: {
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
  forgot: { alignSelf: 'flex-end', marginTop: -Spacing.xs },
  forgotText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.primary,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
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
  signUp: {
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
