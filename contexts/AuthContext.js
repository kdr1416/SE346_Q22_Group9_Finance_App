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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session load error:', error.message);
        // Clear stored invalid session from AsyncStorage
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setIsLoading(false);
        return;
      }
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('Session getSession catch:', err);
      supabase.auth.signOut().catch(() => {});
      setSession(null);
      setIsLoading(false);
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

  const updateProfileName = async (newName) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ name: newName })
      .eq('id', session.user.id);
    
    if (error) throw error;
    setProfile(prev => prev ? { ...prev, name: newName } : null);
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
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
