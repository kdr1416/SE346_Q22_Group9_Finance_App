import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Thiếu EXPO_PUBLIC_SUPABASE_URL. Hãy tạo file .env từ .env.example và điền giá trị.'
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    'Thiếu EXPO_PUBLIC_SUPABASE_ANON_KEY (hoặc EXPO_PUBLIC_SUPABASE_KEY). Hãy tạo file .env từ .env.example và điền giá trị.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
