import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Quote, getDarkBackground, getQuoteCount } from '../src/db';
import { WallpaperPreview } from '../src/components/WallpaperPreview';
import { setBothWallpapers } from '../src/services/wallpaperService';
import { getDailyQuote } from '../src/services/dailyQuote';
import { useTheme } from '../src/theme/ThemeContext';
import { getCachedWallpaperPath } from '../src/services/wallpaperCache';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [hasQuotes, setHasQuotes] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);

  const loadQuote = useCallback(async () => {
    setLoading(true);
    try {
      const count = await getQuoteCount();
      setHasQuotes(count > 0);

      if (count === 0) {
        setQuote(null);
        return;
      }

      const dark = await getDarkBackground();
      setDarkBg(dark);

      // Get daily quote (handles rotation automatically)
      const dailyQuote = await getDailyQuote();
      setQuote(dailyQuote);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuote();
    }, [loadQuote])
  );

  const handleSetWallpaper = async () => {
    if (!quote) return;

    setSettingWallpaper(true);
    try {
      // Use cached wallpaper (same as background task uses)
      const cachedPath = getCachedWallpaperPath(quote.id, darkBg);

      if (!cachedPath) {
        Alert.alert(
          'Wallpaper Not Ready',
          'The wallpaper is still being generated. Please wait a moment and try again.'
        );
        return;
      }

      // Set as wallpaper
      const result = await setBothWallpapers(cachedPath);

      if (result.success) {
        Alert.alert('Success', 'Wallpaper has been set!');
      } else {
        Alert.alert('Error', result.error || 'Failed to set wallpaper');
      }
    } catch (error) {
      console.error('Error setting wallpaper:', error);
      Alert.alert('Error', 'Failed to set wallpaper');
    } finally {
      setSettingWallpaper(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    label: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    preview: {
      marginBottom: 30,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 10,
      minWidth: 180,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.textMuted,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={styles.label}>Quote of the Day</Text>

      <WallpaperPreview
        text={quote?.text ?? 'Add your first quote to get started'}
        author={quote?.author}
        darkBackground={darkBg}
        style={styles.preview}
      />

      <Pressable
        style={[styles.button, (!hasQuotes || settingWallpaper) && styles.buttonDisabled]}
        onPress={handleSetWallpaper}
        disabled={!hasQuotes || settingWallpaper}
      >
        {settingWallpaper ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Set as Wallpaper</Text>
        )}
      </Pressable>
    </View>
  );
}
