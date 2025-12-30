import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { createQuote, updateQuote, getQuoteById, getAllCategories, Category } from '../../src/db';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../src/theme/ThemeContext';

export default function QuoteFormScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0); // 0 means no category
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const cats = await getAllCategories();
      setCategories(cats);

      if (!isNew) {
        const quote = await getQuoteById(parseInt(id, 10));
        if (quote) {
          setText(quote.text);
          setAuthor(quote.author ?? '');
          setCategoryId(quote.category_id ?? 0);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter a quote');
      return;
    }

    setSaving(true);
    try {
      const catId = categoryId === 0 ? null : categoryId;
      if (isNew) {
        await createQuote({
          text: text.trim(),
          author: author.trim() || null,
          category_id: catId,
        });
      } else {
        await updateQuote(parseInt(id, 10), {
          text: text.trim(),
          author: author.trim() || null,
          category_id: catId,
        });
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save quote');
    } finally {
      setSaving(false);
    }
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
    content: {
      padding: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    textArea: {
      minHeight: 120,
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
    button: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 30,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'New Quote' : 'Edit Quote' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Quote</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter your quote..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Author (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Who said this?"
          placeholderTextColor={colors.textMuted}
          value={author}
          onChangeText={setAuthor}
        />

        {categories.length > 0 && (
          <>
            <Text style={styles.label}>Category (optional)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={categoryId}
                onValueChange={(value) => setCategoryId(value)}
                style={styles.picker}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="No category" value={0} />
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Saving...' : isNew ? 'Add Quote' : 'Save Changes'}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}
