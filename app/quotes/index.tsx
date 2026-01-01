import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { Quote, getAllQuotes, getQuotesByCategory, deleteQuote, getAllCategories, Category } from '../../src/db';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../src/theme/ThemeContext';
import { invalidateCache } from '../../src/services/wallpaperCache';

export default function QuotesScreen() {
  const { colors } = useTheme();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0); // 0 = all
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await getAllCategories();
      setCategories(cats);
      
      let data: Quote[];
      if (selectedCategory === 0) {
        data = await getAllQuotes();
      } else {
        data = await getQuotesByCategory(selectedCategory);
      }
      setQuotes(data);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCategoryChange = (value: number) => {
    setSelectedCategory(value);
  };

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
            invalidateCache(quote.id);
            loadData();
          },
        },
      ]
    );
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return null;
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name;
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
    filterContainer: {
      padding: 15,
      paddingBottom: 5,
    },
    filterLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    pickerContainer: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    picker: {
      height: 50,
      color: colors.text,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 8,
    },
    list: {
      padding: 15,
    },
    quoteItem: {
      backgroundColor: colors.surface,
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
      color: colors.text,
      fontStyle: 'italic',
    },
    authorText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
    },
    categoryBadge: {
      backgroundColor: colors.categoryBadge,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    categoryText: {
      fontSize: 12,
      color: colors.categoryText,
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
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });

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
          {item.category_id && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{getCategoryName(item.category_id)}</Text>
            </View>
          )}
        </View>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={10}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </Pressable>
    </Link>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {categories.length > 0 && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by category:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={handleCategoryChange}
              style={styles.picker}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="All quotes" value={0} />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>
        </View>
      )}
      
      {quotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {selectedCategory === 0 ? 'No quotes yet' : 'No quotes in this category'}
          </Text>
          <Text style={styles.emptySubtext}>
            {selectedCategory === 0 ? 'Add your first quote to get started' : 'Try a different filter'}
          </Text>
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
