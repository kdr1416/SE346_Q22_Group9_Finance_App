import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Tab Screens
import OverviewScreen from './screens/tabs/OverviewScreen';
import TransactionsScreen from './screens/tabs/TransactionsScreen';
import BudgetsScreen from './screens/tabs/BudgetsScreen';
import PotsScreen from './screens/tabs/PotsScreen';
import ProfileScreen from './screens/tabs/ProfileScreen';

// Design Tokens
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing } from './constants/Spacing';

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
          fontSize: Typography.labelSm,
          fontWeight: Typography.medium,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{
          title: 'Ngân sách',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Pots"
        component={PotsScreen}
        options={{
          title: 'Tiết kiệm',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ==================== ROOT STACK NAVIGATOR ====================
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ==================== APP ENTRY ====================
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Auth group */}
          <Stack.Screen name="Auth" component={AuthStack} />
          {/* Main tabs */}
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" backgroundColor={Colors.surface} />
    </SafeAreaProvider>
  );
}
