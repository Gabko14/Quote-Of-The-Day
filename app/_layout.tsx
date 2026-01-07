import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { registerBackgroundTask } from '../src/services/backgroundTask';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { logger } from '../src/utils/logger';

// Ignore the linking warning caused by React 19 StrictMode double-mounting
// This is a known issue with expo-router and React 19's development mode behavior
// See: https://github.com/react-navigation/react-navigation/issues/10988
LogBox.ignoreLogs(['Looks like you have configured linking in multiple places']);

function TabsLayout() {
  const { colors } = useTheme();

  useEffect(() => {
    registerBackgroundTask().catch(logger.error);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quotes/index"
        options={{
          title: 'Quotes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quotes/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="quotes/import"
        options={{
          href: null,
          title: 'Import Quotes',
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TabsLayout />
    </ThemeProvider>
  );
}
