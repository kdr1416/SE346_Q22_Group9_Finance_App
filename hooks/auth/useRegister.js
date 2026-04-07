import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function useRegister({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleNameChange = (val) => {
    setName(val);
    if (!val.trim()) setNameError('Vui lòng nhập họ tên');
    else setNameError('');
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (!validateEmail(val)) setEmailError('Email không hợp lệ');
    else setEmailError('');
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (val.length < 6) setPasswordError('Mật khẩu tối thiểu 6 ký tự');
    else setPasswordError('');
  };

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Vui lòng nhập họ tên');
      valid = false;
    }
    if (!validateEmail(email)) {
      setEmailError('Email không hợp lệ');
      valid = false;
    }
    if (password.length < 6) {
      setPasswordError('Mật khẩu tối thiểu 6 ký tự');
      valid = false;
    }
    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setGeneralError('');
    setLoading(true);

    try {
      await signUp(name.trim(), email.trim(), password);
    } catch (error) {
      let msg = error.message;
      if (msg.includes('already registered')) msg = 'Tài khoản này đã tồn tại';
      else if (msg.includes('invalid')) msg = 'Email không hợp lệ';
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => navigation.goBack();

  return {
    name, email, password,
    nameError, emailError, passwordError, generalError,
    loading,
    handleNameChange, handleEmailChange, handlePasswordChange,
    handleRegister, goBack,
  };
}
