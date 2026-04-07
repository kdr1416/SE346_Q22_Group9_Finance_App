import { useAuth } from '../../contexts/AuthContext';
import { Alert } from 'react-native';

export default function useProfile() {
  const { profile, user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      // Auth Guard in App.js will reroute automatically
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất, vui lòng thử lại.');
    }
  };

  const handleEditProfile = () => {
    console.log('Chỉnh sửa hồ sơ');
  };

  const handleChangePassword = () => {
    console.log('Đổi mật khẩu');
  };

  return {
    // Thay vì dùng mockUser, dùng thông tin profile thật từ DB
    user: profile ? {
      name: profile.name,
      email: user?.email,
    } : { name: 'Người dùng', email: '' },
    handleLogout,
    handleEditProfile,
    handleChangePassword,
  };
}
