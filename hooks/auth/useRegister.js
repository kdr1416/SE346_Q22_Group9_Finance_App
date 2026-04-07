import { useState } from 'react';

/**
 * useRegister — quản lý toàn bộ logic màn hình đăng ký
 * @param {object} navigation - React Navigation navigation prop
 */
export default function useRegister(navigation) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Vui lòng nhập họ và tên');
      valid = false;
    } else {
      setNameError('');
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Địa chỉ email không hợp lệ');
      valid = false;
    } else {
      setEmailError('');
    }
    return valid;
  };

  const handleRegister = () => {
    if (!validate()) return;
    setLoading(true);

    // TODO: Thay bằng API call thực tế (Firebase Auth, v.v.)
    setTimeout(() => {
      setLoading(false);
      navigation.replace('MainTabs');
    }, 1000);
  };

  const goBack = () => navigation.goBack();

  return {
    // State
    name,
    email,
    password,
    nameError,
    emailError,
    loading,
    // Handlers
    setName,
    setEmail,
    setPassword,
    handleRegister,
    goBack,
  };
}
