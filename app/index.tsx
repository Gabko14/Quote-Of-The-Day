import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Quote, getDarkBackground, getQuoteCount } from '../src/db';
import { WallpaperPreview, WallpaperPreviewHandle } from '../src/components/WallpaperPreview';
import { cleanOldWallpapers } from '../src/services/wallpaperGenerator';
import { setBothWallpapers } from '../src/services/wallpaperService';
import { getDailyQuote } from '../src/services/dailyQuote';
import { useTheme } from '../src/theme/ThemeContext';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [hasQuotes, setHasQuotes] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const previewRef = useRef<WallpaperPreviewHandle>(null);

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
    if (!quote || !previewRef.current) return;

    setSettingWallpaper(true);
    try {
      // Get device screen dimensions for proper wallpaper size
      const { width, height } = Dimensions.get('screen');

      // Capture wallpaper at device resolution (2x for higher DPI)
      const wallpaperPath = await previewRef.current.capture(
        Math.round(width * 2),
        Math.round(height * 2)
      );

      if (!wallpaperPath) {
        Alert.alert('Error', 'Failed to generate wallpaper image');
        return;
      }

      // Set as wallpaper
      await setBothWallpapers(wallpaperPath);

      // Clean up old wallpapers, keep only the latest
      await cleanOldWallpapers(1);
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
        ref={previewRef}
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
