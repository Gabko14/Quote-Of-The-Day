import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Quote,
  getRandomQuote,
  getCurrentQuoteId,
  setCurrentQuoteId,
  getQuoteById,
  getDarkBackground,
  getQuoteCount,
} from '../src/db';
import { WallpaperPreview } from '../src/components/WallpaperPreview';

export default function HomeScreen() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [hasQuotes, setHasQuotes] = useState(false);

  const loadQuote = useCallback(async () => {
    setLoading(true);
    try {
      const count = await getQuoteCount();
      setHasQuotes(count > 0);

      if (count === 0) {
        setQuote(null);
        setLoading(false);
        return;
      }

      const dark = await getDarkBackground();
      setDarkBg(dark);

      // Try to get current quote
      const currentId = await getCurrentQuoteId();
      if (currentId) {
        const current = await getQuoteById(currentId);
        if (current) {
          setQuote(current);
          setLoading(false);
          return;
        }
      }

      // No current quote, pick a random one
      const random = await getRandomQuote();
      if (random) {
        await setCurrentQuoteId(random.id);
        setQuote(random);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuote();
    }, [loadQuote])
  );

  const handleSetWallpaper = () => {
    // TODO: Implement wallpaper setting in Phase 5
    alert('Wallpaper functionality coming soon!');
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
        style={[styles.button, !hasQuotes && styles.buttonDisabled]}
        onPress={handleSetWallpaper}
        disabled={!hasQuotes}
      >
        <Text style={styles.buttonText}>Set as Wallpaper</Text>
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
