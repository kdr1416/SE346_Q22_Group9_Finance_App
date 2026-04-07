import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import useLogin from '../../hooks/auth/useLogin';

export default function LoginScreen({ navigation }) {
  const {
    email, password, emailError, loading,
    handleEmailChange, setPassword, handleLogin, goToRegister,
  } = useLogin(navigation);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.appName}>Finance</Text>
            <Text style={styles.tagline}>Kiểm soát tài chính của bạn</Text>
          </View>

          <AppInput
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={handleEmailChange}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AppInput
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <AppButton label="Đăng nhập" onPress={handleLogin} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.signUp}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  container: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center' },
  header: { marginBottom: Spacing.xxxl },
  appName: {
    fontFamily: Typography.fontHeadline_ExtraBold,
    fontSize: Typography.displayMd,
    color: Colors.primary,
    letterSpacing: Typography.tightTracking,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyLg,
    color: Colors.onSurfaceVariant,
  },
  forgot: { alignSelf: 'flex-end', marginBottom: Spacing.xl, marginTop: -Spacing.sm },
  forgotText: {
    fontFamily: Typography.fontBody_Medium,
    fontSize: Typography.bodyMd,
    color: Colors.primary,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
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
});
