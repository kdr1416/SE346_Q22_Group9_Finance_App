import { supabase } from '../lib/supabase';

/**
 * Đăng nhập bằng Email/Password
 */
export const loginWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Đăng ký tài khoản mới và lưu meta data (name)
 */
export const registerWithEmail = async (name, email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name, // raw_user_meta_data -> kích hoạt handle_new_user trigger
      },
    },
  });
  if (error) throw error;
  return data;
};

/**
 * Đăng xuất
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Lấy user profile từ bảng profiles
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};
