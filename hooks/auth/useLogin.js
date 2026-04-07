import { useState } from 'react';

/**
 * useLogin — quản lý toàn bộ logic màn hình đăng nhập
 * @param {object} navigation - React Navigation navigation prop
 */
export default function useLogin(navigation) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleEmailChange = (value) => {
    setEmail(value);
    // Xóa lỗi ngay khi user bắt đầu gõ lại
    if (emailError) setEmailError('');
  };

  const handleLogin = () => {
    if (!validateEmail(email)) {
      setEmailError('Địa chỉ email không hợp lệ');
      return;
    }
    setEmailError('');
    setLoading(true);

    // TODO: Thay bằng API call thực tế (Firebase Auth, v.v.)
    setTimeout(() => {
      setLoading(false);
      navigation.replace('MainTabs');
    }, 1000);
  };

  const goToRegister = () => navigation.navigate('Register');

  return {
    // State
    email,
    password,
    emailError,
    loading,
    // Handlers
    handleEmailChange,
    setPassword,
    handleLogin,
    goToRegister,
  };
}
