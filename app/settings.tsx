import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  TextInput,
  Pressable,
  Linking,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getDarkBackground,
  setDarkBackground as saveDarkBackground,
  getXaiApiKey,
  setXaiApiKey as saveXaiApiKey,
} from '../src/db';
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

  const handleApiKeyChange = async (value: string) => {
    setXaiApiKey(value);
    await saveXaiApiKey(value || null);
  };

  const handleOpenXaiSignup = () => {
    Linking.openURL('https://x.ai/api');
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
    apiKeyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
    },
    apiKeyInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    apiKeyToggle: {
      padding: 10,
    },
    linkButton: {
      marginTop: 12,
    },
    linkText: {
      fontSize: 14,
      color: colors.primary,
    },
    apiKeyHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
      lineHeight: 18,
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
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Import</Text>
        <View>
          <Text style={styles.rowTitle}>XAI API Key</Text>
          <Text style={styles.rowSubtitle}>Required for bulk quote import</Text>
        </View>
        <View style={styles.apiKeyInputContainer}>
          <TextInput
            style={styles.apiKeyInput}
            value={xaiApiKey}
            onChangeText={handleApiKeyChange}
            placeholder="Enter your XAI API key"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.apiKeyToggle} onPress={() => setShowApiKey(!showApiKey)}>
            <Ionicons
              name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
        <Text style={styles.apiKeyHint}>
          Your key is stored locally and sent directly to XAI. It never passes through our servers.
        </Text>
        <Pressable style={styles.linkButton} onPress={handleOpenXaiSignup}>
          <Text style={styles.linkText}>Get a free API key at x.ai/api</Text>
        </Pressable>
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
