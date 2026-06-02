import React, { useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Google Fonts
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import OverviewScreen from './screens/tabs/OverviewScreen';
import TransactionsScreen from './screens/tabs/TransactionsScreen';
import BudgetsScreen from './screens/tabs/BudgetsScreen';
import FundsScreen from './screens/tabs/FundsScreen';
import ProfileScreen from './screens/tabs/ProfileScreen';
import BillsScreen from './screens/tabs/BillsScreen';
import GroupFundsScreen from './screens/tabs/GroupFundsScreen';
import GroupFundDetailScreen from './screens/tabs/GroupFundDetailScreen';

// Community Screens (NEW)
import CommunityScreen from './screens/tabs/CommunityScreen';
import PostDetailScreen from './screens/tabs/PostDetailScreen';
import CreatePostScreen from './screens/tabs/CreatePostScreen';
import SavedPostsScreen from './screens/tabs/SavedPostsScreen';
import CommunityProfileScreen from './screens/tabs/CommunityProfileScreen';
import CommunityNotificationsScreen from './screens/tabs/CommunityNotificationsScreen';
import CommunityAdminScreen from './screens/tabs/CommunityAdminScreen';

// Design Tokens & Auth
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing } from './constants/Spacing';
import { AuthProvider, useAuth } from './contexts/AuthContext';

SplashScreen.preventAutoHideAsync();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ==================== BOTTOM TAB NAVIGATOR ====================
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: Colors.surfaceContainerLowest,
          borderTopWidth: 0,
          height: Spacing.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: Colors.onSurface,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.fontBody_Medium,
          fontSize: Typography.labelSm,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={{ title: 'Tổng quan', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'Giao dịch', tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ title: 'Cộng đồng', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Funds"
        component={FundsScreen}
        options={{ title: 'Quỹ', tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Hồ sơ', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

// ==================== AUTH STACK ====================
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ==================== ROOT NAVIGATOR CÓ AUTH GUARD ====================
function RootNavigator() {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="GroupFundDetail" component={GroupFundDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Bills" component={BillsScreen} options={{ presentation: 'card' }} />
            
            {/* Budgets & Community Screens (NEW STACK SCREENS) */}
            <Stack.Screen name="Budgets" component={BudgetsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CommunityProfile" component={CommunityProfileScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CommunityNotifications" component={CommunityNotificationsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="CommunityAdmin" component={CommunityAdminScreen} options={{ presentation: 'card' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==================== APP ENTRY CÓ APP LOADER ====================
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  console.log('Fonts loaded:', fontsLoaded, 'Font error:', fontError);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <StatusBar style="dark" backgroundColor={Colors.surface} />
      </View>
    </SafeAreaProvider>
  );
}