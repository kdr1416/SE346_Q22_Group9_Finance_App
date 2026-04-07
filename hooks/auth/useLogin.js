import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function useLogin(navigation) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleEmailChange = (value) => {
    setEmail(value);
    if (!validateEmail(value)) {
      setEmailError('Email không hợp lệ');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value.length < 6) {
      setPasswordError('Mật khẩu tối thiểu 6 ký tự');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    let isValid = true;
    if (!validateEmail(email)) {
      setEmailError('Email không hợp lệ');
      isValid = false;
    }
    if (password.length < 6) {
      setPasswordError('Mật khẩu tối thiểu 6 ký tự');
      isValid = false;
    }

    if (!isValid) return;
    setGeneralError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
    } catch (error) {
      let msg = error.message;
      if (msg.includes('Invalid login')) msg = 'Email hoặc mật khẩu không chính xác';
      else if (msg.includes('rate limit')) msg = 'Thử lại quá nhiều lần. Vui lòng đợi lát nhé';
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => navigation.navigate('Register');

  return {
    email,
    password,
    emailError,
    passwordError,
    generalError,
    loading,
    handleEmailChange,
    handlePasswordChange,
    handleLogin,
    goToRegister,
  };
}
