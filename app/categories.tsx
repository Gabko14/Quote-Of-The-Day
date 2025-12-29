import { View, Text, StyleSheet, Pressable, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function CategoriesScreen() {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = () => {
    if (newCategory.trim()) {
      // TODO: Save to database
      setNewCategory('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New category name..."
          value={newCategory}
          onChangeText={setNewCategory}
          onSubmitEditing={handleAdd}
        />
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.emptyState}>
        <Ionicons name="folder-open-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No categories yet</Text>
        <Text style={styles.emptySubtext}>Categories help organize your quotes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#007AFF',
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
});
