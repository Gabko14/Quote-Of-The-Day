import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Quote, getDarkBackground, getQuoteCount } from '../src/db';
import { WallpaperPreview } from '../src/components/WallpaperPreview';
import { setBothWallpapers } from '../src/services/wallpaperService';
import { getDailyQuote } from '../src/services/dailyQuote';
import { useTheme } from '../src/theme/ThemeContext';
import { getCachedWallpaperPath } from '../src/services/wallpaperCache';
import { getBackgroundTaskStatus } from '../src/services/backgroundTask';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [hasQuotes, setHasQuotes] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const [wallpaperReady, setWallpaperReady] = useState(false);
  const [taskRegistered, setTaskRegistered] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for cache readiness when quote exists but wallpaper isn't ready
  useEffect(() => {
    if (!quote || wallpaperReady) {
      // No need to poll
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Poll every 500ms for cache availability (layout generates it)
    pollIntervalRef.current = setInterval(() => {
      const cachedPath = getCachedWallpaperPath(quote.id, darkBg);
      if (cachedPath) {
        setWallpaperReady(true);
      }
    }, 500);

    // Stop polling after 30 seconds (timeout)
    const timeout = setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      clearTimeout(timeout);
    };
  }, [quote, wallpaperReady, darkBg]);

  const loadQuote = useCallback(async () => {
    setLoading(true);
    try {
      const count = await getQuoteCount();
      setHasQuotes(count > 0);

      if (count === 0) {
        setQuote(null);
        setWallpaperReady(false);
        return;
      }

      const dark = await getDarkBackground();
      setDarkBg(dark);

      // Get daily quote (handles rotation automatically)
      const dailyQuote = await getDailyQuote();
      setQuote(dailyQuote);

      // Check if wallpaper is cached (single source of truth for readiness)
      if (dailyQuote) {
        const cachedPath = getCachedWallpaperPath(dailyQuote.id, dark);
        setWallpaperReady(!!cachedPath);
      } else {
        setWallpaperReady(false);
      }

      // Check background task registration
      const taskStatus = await getBackgroundTaskStatus();
      setTaskRegistered(taskStatus.isRegistered);
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
    if (!quote || !wallpaperReady) return;

    setSettingWallpaper(true);
    try {
      // Use cached wallpaper (same as background task uses)
      const cachedPath = getCachedWallpaperPath(quote.id, darkBg);

      // Set as wallpaper
      const result = await setBothWallpapers(cachedPath!);

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
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 13,
      color: colors.textSecondary,
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
        style={[styles.button, (!wallpaperReady || settingWallpaper) && styles.buttonDisabled]}
        onPress={handleSetWallpaper}
        disabled={!wallpaperReady || settingWallpaper}
      >
        {settingWallpaper ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {hasQuotes && !wallpaperReady ? 'Generating...' : 'Set as Wallpaper'}
          </Text>
        )}
      </Pressable>

      {hasQuotes && (
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: wallpaperReady && taskRegistered ? '#4CAF50' : colors.textMuted },
            ]}
          />
          <Text style={styles.statusText}>
            {!wallpaperReady
              ? 'Generating wallpaper...'
              : taskRegistered
                ? 'Auto-update active - changes daily'
                : 'Auto-update unavailable'}
          </Text>
        </View>
      )}
    </View>
  );
}
