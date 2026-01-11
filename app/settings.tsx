import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  TextInput,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getDarkBackground,
  setDarkBackground as saveDarkBackground,
} from '../src/db';
import {
  getXaiApiKey,
  setXaiApiKey as saveXaiApiKey,
} from '../src/services/secureStorage';
import { useTheme } from '../src/theme/ThemeContext';
import { invalidateCache } from '../src/services/wallpaperCache';

export default function SettingsScreen() {
  const { colors, isDark, setDarkMode } = useTheme();
  const [darkBackground, setDarkBackground] = useState(true);
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [dark, apiKey] = await Promise.all([getDarkBackground(), getXaiApiKey()]);
      setDarkBackground(dark);
      setXaiApiKey(apiKey ?? '');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleDarkBackgroundToggle = async (value: boolean) => {
    setDarkBackground(value);
    await saveDarkBackground(value);
    // Invalidate all cached wallpapers so they get regenerated with new style
    invalidateCache();
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
  };

  // Debounce API key saves to avoid writing to secure storage on every keystroke
  const apiKeyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (apiKeyTimeoutRef.current) {
        clearTimeout(apiKeyTimeoutRef.current);
      }
    };
  }, []);

  const handleApiKeyChange = (value: string) => {
    setXaiApiKey(value);

    if (apiKeyTimeoutRef.current) {
      clearTimeout(apiKeyTimeoutRef.current);
    }

    apiKeyTimeoutRef.current = setTimeout(async () => {
      await saveXaiApiKey(value || null);
    }, 500);
  };

  const handleOpenXaiSignup = () => {
    Linking.openURL('https://x.ai/api');
  };

  const handleOpenBatterySettings = async () => {
    if (Platform.OS !== 'android') return;

    const packageName = Constants.expoConfig?.android?.package ?? 'com.gabko14.quoteoftheday';

    try {
      // Try to open the app-specific battery optimization settings
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        { data: `package:${packageName}` }
      );
    } catch {
      // Fallback to general battery optimization settings
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
        );
      } catch {
        // Last resort: open general settings
        Linking.openSettings();
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 15,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    rowTitle: {
      fontSize: 16,
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    aboutText: {
      fontSize: 16,
      color: colors.text,
    },
    aboutSubtext: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
    apiKeyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    apiKeyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    apiKeyStatus: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
    },
    apiKeyStatusActive: {
      color: '#22c55e',
    },
    apiKeyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    apiKeyInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontFamily: 'monospace',
    },
    apiKeyToggle: {
      padding: 10,
    },
    getKeyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingVertical: 8,
    },
    getKeyButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    apiKeyHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
      lineHeight: 18,
    },
    batteryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 12,
    },
    batteryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    batteryHint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 12,
      lineHeight: 20,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>Dark Mode</Text>
            <Text style={styles.rowSubtitle}>
              {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel="Dark mode"
            accessibilityHint={isDark ? 'Currently enabled' : 'Currently disabled'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallpaper</Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>Dark Wallpaper</Text>
            <Text style={styles.rowSubtitle}>
              {darkBackground ? 'White text on black' : 'Black text on white'}
            </Text>
          </View>
          <Switch
            value={darkBackground}
            onValueChange={handleDarkBackgroundToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel="Dark wallpaper background"
            accessibilityHint={darkBackground ? 'White text on black background' : 'Black text on white background'}
          />
        </View>
      </View>

{Platform.OS === 'android' && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Updates</Text>

        <Text style={styles.rowTitle}>Battery Optimization</Text>
        <Text style={styles.batteryHint}>
          For reliable daily wallpaper changes, disable battery optimization for this app.
          Android may otherwise prevent background updates to save battery.
        </Text>

        <Pressable
          style={styles.batteryButton}
          onPress={handleOpenBatterySettings}
          accessibilityRole="button"
          accessibilityLabel="Open battery settings"
          accessibilityHint="Opens Android battery optimization settings for this app"
        >
          <Ionicons name="battery-half-outline" size={20} color="#fff" />
          <Text style={styles.batteryButtonText}>Open Battery Settings</Text>
        </Pressable>
      </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Import</Text>

        <View style={styles.apiKeyHeader}>
          <View style={styles.apiKeyTitleRow}>
            <Ionicons
              name={xaiApiKey ? 'checkmark-circle' : 'key-outline'}
              size={20}
              color={xaiApiKey ? '#22c55e' : colors.textMuted}
            />
            <Text style={styles.rowTitle}>XAI API Key</Text>
          </View>
          <Text style={[styles.apiKeyStatus, xaiApiKey ? styles.apiKeyStatusActive : null]}>
            {xaiApiKey ? 'Configured' : 'Not set'}
          </Text>
        </View>

        <View style={styles.apiKeyInputContainer}>
          <TextInput
            style={styles.apiKeyInput}
            value={xaiApiKey}
            onChangeText={handleApiKeyChange}
            placeholder="xai-xxxxxxxxxxxxxxxx"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="XAI API key"
            accessibilityHint="Enter your XAI API key for AI-powered quote import"
          />
          {xaiApiKey ? (
            <Pressable
              style={styles.apiKeyToggle}
              onPress={() => setShowApiKey(!showApiKey)}
              accessibilityRole="button"
              accessibilityLabel={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              <Ionicons
                name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
          {xaiApiKey ? (
            <Pressable
              style={styles.apiKeyToggle}
              onPress={() => handleApiKeyChange('')}
              accessibilityRole="button"
              accessibilityLabel="Clear API key"
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.getKeyButton}
          onPress={handleOpenXaiSignup}
          accessibilityRole="link"
          accessibilityLabel="Get a free API key at x.ai"
          accessibilityHint="Opens the XAI website in your browser"
        >
          <Ionicons name="open-outline" size={16} color={colors.primary} />
          <Text style={styles.getKeyButtonText}>Get a free API key at x.ai</Text>
        </Pressable>

        <Text style={styles.apiKeyHint}>
          Your key is stored securely on device and sent directly to XAI.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Quote of the day v1.0.0</Text>
        <Text style={styles.aboutSubtext}>
          Display your favorite quotes as your daily wallpaper
        </Text>
      </View>
    </View>
  );
}
