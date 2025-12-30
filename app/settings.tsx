import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDarkBackground, setDarkBackground as saveDarkBackground } from '../src/db';
import { useTheme } from '../src/theme/ThemeContext';

export default function SettingsScreen() {
  const { colors, isDark, setDarkMode } = useTheme();
  const [darkBackground, setDarkBackground] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const dark = await getDarkBackground();
      setDarkBackground(dark);
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
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
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
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Quote of the day v1.0.0</Text>
        <Text style={styles.aboutSubtext}>
          Display your favorite quotes as your daily wallpaper
        </Text>
      </View>
    </View>
  );
}
