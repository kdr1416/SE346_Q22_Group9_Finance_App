import { useAuth } from '../../contexts/AuthContext';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function useProfile() {
  const { profile, user, signOut, updateProfileName } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất, vui lòng thử lại.');
    }
  };

  const handleSaveName = async (newName) => {
    if (!newName.trim()) {
      Alert.alert('Thông báo', 'Họ tên không được để trống.');
      return;
    }
    try {
      await updateProfileName(newName.trim());
    } catch (error) {
      console.error('Lỗi đổi tên:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật tên, vui lòng thử lại.');
      throw error;
    }
  };

  const handleUpdatePassword = async (newPassword) => {
    if (newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải tối thiểu 6 ký tự.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      Alert.alert('Lỗi', 'Không thể đổi mật khẩu: ' + error.message);
      throw error;
    }
  };

  return {
    user: profile ? {
      name: profile.name,
      email: user?.email,
    } : { name: 'Người dùng', email: '' },
    handleLogout,
    handleSaveName,
    handleUpdatePassword,
  };
}
