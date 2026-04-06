import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('MainTabs');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Bắt đầu hành trình tài chính của bạn</Text>
          </View>

          <AppInput label="Họ và tên" placeholder="Nguyễn Văn A" value={name} onChangeText={setName} />
          <AppInput label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <AppInput label="Mật khẩu" placeholder="Tối thiểu 8 ký tự" value={password} onChangeText={setPassword} secureTextEntry />

          <AppButton label="Tạo tài khoản" onPress={handleRegister} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
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
  backText: { fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant },
  header: { marginBottom: Spacing.xxxl },
  title: { fontSize: Typography.headlineMd, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: Typography.tightTracking, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.bodyLg, color: Colors.onSurfaceVariant },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { fontSize: Typography.bodyMd, color: Colors.onSurfaceVariant },
  login: { fontSize: Typography.bodyMd, color: Colors.primary, fontWeight: Typography.semiBold },
});
