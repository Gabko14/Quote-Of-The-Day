import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
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
    // TODO: Implement wallpaper setting
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
      <View style={[styles.previewContainer, !darkBg && styles.lightPreview]}>
        {quote ? (
          <>
            <Text style={[styles.quoteText, !darkBg && styles.darkText]}>
              "{quote.text}"
            </Text>
            {quote.author && (
              <Text style={[styles.authorText, !darkBg && styles.darkText]}>
                — {quote.author}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.quoteText, !darkBg && styles.darkText]}>
            Add your first quote to get started
          </Text>
        )}
      </View>
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
    marginBottom: 10,
  },
  previewContainer: {
    width: '80%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginBottom: 30,
  },
  lightPreview: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quoteText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  darkText: {
    color: '#000',
  },
  authorText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
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
