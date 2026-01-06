import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  TextInput,
  Pressable,
  Linking,
  ScrollView,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  getDarkBackground,
  setDarkBackground as saveDarkBackground,
  getXaiApiKey,
  setXaiApiKey as saveXaiApiKey,
  deleteXaiApiKey,
} from '../src/db';
import { useTheme } from '../src/theme/ThemeContext';
import { invalidateCache } from '../src/services/wallpaperCache';

export default function SettingsScreen() {
  const { colors, isDark, setDarkMode } = useTheme();
  const [darkBackground, setDarkBackground] = useState(true);
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const dark = await getDarkBackground();
      setDarkBackground(dark);
      const apiKey = await getXaiApiKey();
      if (apiKey) {
        setXaiApiKey(apiKey);
        setHasApiKey(true);
      }
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

  const handleSaveApiKey = async () => {
    if (xaiApiKey.trim()) {
      await saveXaiApiKey(xaiApiKey.trim());
      setHasApiKey(true);
    }
  };

  const handleRemoveApiKey = async () => {
    await deleteXaiApiKey();
    setXaiApiKey('');
    setHasApiKey(false);
    setShowApiKey(false);
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
    apiKeyInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
    },
    apiKeyButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    apiKeyButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    apiKeyButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    apiKeyButtonDanger: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.danger,
    },
    apiKeyButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#fff',
    },
    apiKeyButtonTextSecondary: {
      color: colors.text,
    },
    apiKeyButtonTextDanger: {
      color: colors.danger,
    },
    link: {
      color: colors.primary,
      fontSize: 13,
      marginTop: 8,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      color: colors.text,
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
    <ScrollView style={styles.container}>
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
        <Text style={styles.rowSubtitle}>
          Add your XAI API key to use AI-powered bulk quote import.
        </Text>

        {hasApiKey ? (
          <>
            <View style={[styles.statusRow, { marginTop: 12 }]}>
              <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.statusText}>API key configured</Text>
            </View>
            <TextInput
              style={styles.apiKeyInput}
              value={showApiKey ? xaiApiKey : '••••••••••••••••'}
              onChangeText={setXaiApiKey}
              editable={showApiKey}
              placeholder="xai-..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.apiKeyButtons}>
              <Pressable
                style={[styles.apiKeyButton, styles.apiKeyButtonSecondary]}
                onPress={() => setShowApiKey(!showApiKey)}
              >
                <Text style={[styles.apiKeyButtonText, styles.apiKeyButtonTextSecondary]}>
                  {showApiKey ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
              {showApiKey && (
                <Pressable style={styles.apiKeyButton} onPress={handleSaveApiKey}>
                  <Text style={styles.apiKeyButtonText}>Save</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.apiKeyButton, styles.apiKeyButtonDanger]}
                onPress={handleRemoveApiKey}
              >
                <Text style={[styles.apiKeyButtonText, styles.apiKeyButtonTextDanger]}>
                  Remove
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <TextInput
              style={[styles.apiKeyInput, { marginTop: 12 }]}
              value={xaiApiKey}
              onChangeText={setXaiApiKey}
              placeholder="xai-..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Pressable
              style={[styles.apiKeyButton, !xaiApiKey.trim() && { opacity: 0.6 }]}
              onPress={handleSaveApiKey}
              disabled={!xaiApiKey.trim()}
            >
              <Text style={styles.apiKeyButtonText}>Save API Key</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.link} onPress={handleOpenXaiSignup}>
          Get your free API key at x.ai/api
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Quote of the day v1.0.0</Text>
        <Text style={styles.aboutSubtext}>
          Display your favorite quotes as your daily wallpaper
        </Text>
      </View>
    </ScrollView>
  );
}
