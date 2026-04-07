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
import useRegister from '../../hooks/auth/useRegister';

export default function RegisterScreen({ navigation }) {
  const {
    name, email, password,
    nameError, emailError, loading,
    setName, setEmail, setPassword,
    handleRegister, goBack,
  } = useRegister(navigation);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.back} onPress={goBack}>
            <Text style={styles.backText}>← Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Bắt đầu hành trình tài chính của bạn</Text>
          </View>

          <AppInput
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={name}
            onChangeText={setName}
            error={nameError}
          />
          <AppInput
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AppInput
            label="Mật khẩu"
            placeholder="Tối thiểu 8 ký tự"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AppButton label="Tạo tài khoản" onPress={handleRegister} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={goBack}>
              <Text style={styles.login}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  container: { flexGrow: 1, padding: Spacing.lg },
  back: { marginTop: Spacing.xl, marginBottom: Spacing.xl },
  backText: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  header: { marginBottom: Spacing.xxxl },
  title: {
    fontFamily: Typography.fontHeadline_Bold,
    fontSize: Typography.headlineMd,
    color: Colors.primary,
    letterSpacing: Typography.tightTracking,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.fontBody_Regular,
    fontSize: Typography.bodyLg,
    color: Colors.onSurfaceVariant,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
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
});
