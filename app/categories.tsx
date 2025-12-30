import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Category, getAllCategories, createCategory, deleteCategory, categoryExists } from '../src/db';
import { useTheme } from '../src/theme/ThemeContext';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const handleAdd = async () => {
    const name = newCategory.trim();
    if (!name) return;

    const exists = await categoryExists(name);
    if (exists) {
      Alert.alert('Error', 'A category with this name already exists');
      return;
    }

    await createCategory(name);
    setNewCategory('');
    loadCategories();
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"? Quotes in this category will be uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(category.id);
            loadCategories();
          },
        },
      ]
    );
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
    inputRow: {
      flexDirection: 'row',
      padding: 15,
      gap: 10,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    addButton: {
      width: 50,
      height: 50,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingHorizontal: 15,
    },
    categoryItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    categoryName: {
      fontSize: 16,
      color: colors.text,
    },
    deleteButton: {
      padding: 8,
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
  });

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        hitSlop={10}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </Pressable>
    </View>
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
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New category name..."
          placeholderTextColor={colors.textMuted}
          value={newCategory}
          onChangeText={setNewCategory}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>No categories yet</Text>
          <Text style={styles.emptySubtext}>Categories help organize your quotes</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}
