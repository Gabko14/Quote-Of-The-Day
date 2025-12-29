import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { Quote, getAllQuotes, deleteQuote } from '../../src/db';

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllQuotes();
      setQuotes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [loadQuotes])
  );

  const handleDelete = (quote: Quote) => {
    Alert.alert(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteQuote(quote.id);
            loadQuotes();
          },
        },
      ]
    );
  };

  const renderQuote = ({ item }: { item: Quote }) => (
    <Link href={`/quotes/${item.id}`} asChild>
      <Pressable style={styles.quoteItem}>
        <View style={styles.quoteContent}>
          <Text style={styles.quoteText} numberOfLines={2}>
            "{item.text}"
          </Text>
          {item.author && (
            <Text style={styles.authorText}>— {item.author}</Text>
          )}
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={10}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </Pressable>
      </Pressable>
    </Link>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {quotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No quotes yet</Text>
          <Text style={styles.emptySubtext}>Add your first quote to get started</Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          renderItem={renderQuote}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
      <Link href="/quotes/new" asChild>
        <Pressable style={styles.fab}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  list: {
    padding: 15,
  },
  quoteItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
  authorText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
