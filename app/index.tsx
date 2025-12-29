import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Quote, getDarkBackground, getQuoteCount } from '../src/db';
import { WallpaperPreview } from '../src/components/WallpaperPreview';
import { generateAndSaveWallpaper, cleanOldWallpapers } from '../src/services/wallpaperGenerator';
import { setBothWallpapers } from '../src/services/wallpaperService';
import { getDailyQuote } from '../src/services/dailyQuote';

export default function HomeScreen() {
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
      // Get device screen dimensions for proper wallpaper size
      const { width, height } = Dimensions.get('screen');

      // Generate wallpaper at device resolution
      const wallpaperPath = await generateAndSaveWallpaper({
        text: quote.text,
        author: quote.author,
        darkBackground: darkBg,
        width: Math.round(width * 2), // 2x for higher DPI
        height: Math.round(height * 2),
      });

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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  preview: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
