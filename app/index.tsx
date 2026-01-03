import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Quote, getDarkBackground, getQuoteCount } from '../src/db';
import { WallpaperPreview } from '../src/components/WallpaperPreview';
import { setBothWallpapers } from '../src/services/wallpaperService';
import { getDailyQuote } from '../src/services/dailyQuote';
import { useTheme } from '../src/theme/ThemeContext';
import { getCachedWallpaperPath, getQuotesWithoutCache } from '../src/services/wallpaperCache';
import { getBackgroundTaskStatus } from '../src/services/backgroundTask';
import { WallpaperGenerator, WallpaperGeneratorHandle } from '../src/components/WallpaperGenerator';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [hasQuotes, setHasQuotes] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const [wallpaperReady, setWallpaperReady] = useState(false);
  const [taskRegistered, setTaskRegistered] = useState(false);

  const generatorRef = useRef<WallpaperGeneratorHandle>(null);
  const isGeneratingRef = useRef(false);

  const generateMissingWallpapers = useCallback(async (isDarkBg: boolean) => {
    if (isGeneratingRef.current || !generatorRef.current) return;

    try {
      isGeneratingRef.current = true;
      const quotesWithoutCache = await getQuotesWithoutCache(isDarkBg);

      if (quotesWithoutCache.length > 0) {
        console.log(`[WallpaperCache] Generating ${quotesWithoutCache.length} missing wallpapers...`);
        const count = await generatorRef.current.generateAll(quotesWithoutCache, isDarkBg);
        console.log(`[WallpaperCache] Generated ${count} wallpapers`);
      }
    } catch (error) {
      console.error('[WallpaperCache] Error generating wallpapers:', error);
    } finally {
      isGeneratingRef.current = false;
    }
  }, []);

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

      // Check if wallpaper is cached
      if (dailyQuote) {
        const cachedPath = getCachedWallpaperPath(dailyQuote.id, dark);
        if (cachedPath) {
          setWallpaperReady(true);
        } else {
          // Generate missing wallpapers (including this one)
          setWallpaperReady(false);
          await generateMissingWallpapers(dark);
          // Check again after generation
          const newPath = getCachedWallpaperPath(dailyQuote.id, dark);
          setWallpaperReady(!!newPath);
        }
      } else {
        setWallpaperReady(false);
      }

      // Check background task registration
      const taskStatus = await getBackgroundTaskStatus();
      setTaskRegistered(taskStatus.isRegistered);
    } finally {
      setLoading(false);
    }
  }, [generateMissingWallpapers]);

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
      <WallpaperGenerator ref={generatorRef} />
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
