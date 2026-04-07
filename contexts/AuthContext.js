import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loginWithEmail, registerWithEmail, logout, getUserProfile } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lắng nghe sự thay đổi của session (login, logout, token refresh...)
  useEffect(() => {
    // Lấy session hiện tại lúc khởi động mờ app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Lắng nghe sự kiện auth (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Lỗi lấy profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email, password) => {
    return await loginWithEmail(email, password);
  };

  const signUp = async (name, email, password) => {
    return await registerWithEmail(name, email, password);
  };

  const signOut = async () => {
    return await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
