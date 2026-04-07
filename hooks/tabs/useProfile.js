import { mockUser } from '../../data/mockData';

/**
 * useProfile — quản lý logic màn hình hồ sơ
 * @param {object} navigation - React Navigation navigation prop
 */
export default function useProfile(navigation) {
  const handleLogout = () => {
    // TODO: Thêm logic xóa token / session khi có Auth thực
    navigation.replace('Auth');
  };

  const handleEditProfile = () => {
    // TODO: navigate đến màn hình chỉnh sửa hồ sơ
    console.log('Chỉnh sửa hồ sơ');
  };

  const handleChangePassword = () => {
    // TODO: navigate đến màn hình đổi mật khẩu
    console.log('Đổi mật khẩu');
  };

  return {
    user: mockUser,
    handleLogout,
    handleEditProfile,
    handleChangePassword,
  };
}
