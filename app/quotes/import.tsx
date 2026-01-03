import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { getAllCategories, Category, createQuote } from '../../src/db';
import { parseQuotesFromText, ParsedQuote } from '../../src/services/bulkImport';

type Phase = 'input' | 'loading' | 'preview';

interface EditableQuote extends ParsedQuote {
  id: string;
  categoryIds: number[];
}

export default function ImportScreen() {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>('input');
  const [inputText, setInputText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [quotes, setQuotes] = useState<EditableQuote[]>([]);
  const [saving, setSaving] = useState(false);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [estimatedTime, setEstimatedTime] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await getAllCategories();
    setCategories(cats);
  };

  const getCategoryIdsByNames = (names: string[]): number[] => {
    return names
      .map((name) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id)
      .filter((id): id is number => id !== undefined);
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const calculateDuration = (wordCount: number): number => {
    const duration = 2000 + wordCount * 50;
    return Math.min(duration, 30000);
  };

  const handleParse = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please paste some quotes first');
      return;
    }

    const wordCount = countWords(inputText);
    const duration = calculateDuration(wordCount);
    setEstimatedTime(Math.ceil(duration / 1000));

    setPhase('loading');
    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 0.9,
      duration: duration,
      useNativeDriver: false,
    }).start();

    try {
      const categoryNames = categories.map((c) => c.name);
      const parsed = await parseQuotesFromText(inputText, categoryNames);

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();

      if (parsed.length === 0) {
        Alert.alert('No Quotes Found', 'Could not find any quotes in the provided text.');
        setPhase('input');
        return;
      }

      const editableQuotes: EditableQuote[] = parsed.map((q, index) => ({
        ...q,
        id: `${Date.now()}-${index}`,
        categoryIds: getCategoryIdsByNames(q.categories),
      }));

      setQuotes(editableQuotes);
      setPhase('preview');
    } catch (error) {
      console.error('Parse error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to parse quotes');
      setPhase('input');
    }
  };

  const handleDeleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateQuote = (id: string, field: 'text' | 'author', value: string | null) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleToggleCategory = (quoteId: string, categoryId: number) => {
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== quoteId) return q;
        const has = q.categoryIds.includes(categoryId);
        return {
          ...q,
          categoryIds: has
            ? q.categoryIds.filter((id) => id !== categoryId)
            : [...q.categoryIds, categoryId],
        };
      })
    );
  };

  const handleSaveAll = async () => {
    if (quotes.length === 0) {
      Alert.alert('No Quotes', 'No quotes to save');
      return;
    }

    setSaving(true);
    try {
      for (const quote of quotes) {
        await createQuote({
          text: quote.text.trim(),
          author: quote.author?.trim() || null,
          category_ids: quote.categoryIds,
        });
      }

      Alert.alert('Success', `Saved ${quotes.length} quote${quotes.length > 1 ? 's' : ''}!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save quotes');
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    inputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    textInputContainer: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    textInput: {
      flex: 1,
      padding: 16,
      fontSize: 15,
      color: colors.text,
      textAlignVertical: 'top',
    },
    parseButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    parseButtonDisabled: {
      opacity: 0.6,
    },
    parseButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 24,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    loadingText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    estimatedText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 8,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    previewTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 4,
    },
    backButtonText: {
      fontSize: 15,
      color: colors.primary,
      marginLeft: 4,
    },
    quoteCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quoteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    quoteNumber: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    deleteButton: {
      padding: 4,
    },
    fieldLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 6,
      fontWeight: '500',
    },
    quoteTextInput: {
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 60,
    },
    authorInput: {
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoriesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    categoryChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipUnselected: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    categoryChipText: {
      fontSize: 13,
    },
    categoryChipTextSelected: {
      color: '#fff',
      fontWeight: '500',
    },
    categoryChipTextUnselected: {
      color: colors.text,
    },
    saveButtonContainer: {
      padding: 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderQuoteItem = useCallback(
    ({ item, index }: { item: EditableQuote; index: number }) => (
      <View style={styles.quoteCard}>
        <View style={styles.quoteHeader}>
          <Text style={styles.quoteNumber}>Quote {index + 1}</Text>
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDeleteQuote(item.id)}
            hitSlop={10}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>QUOTE</Text>
        <TextInput
          style={styles.quoteTextInput}
          value={item.text}
          onChangeText={(text) => handleUpdateQuote(item.id, 'text', text)}
          multiline
          placeholder="Quote text"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>AUTHOR</Text>
        <TextInput
          style={styles.authorInput}
          value={item.author ?? ''}
          onChangeText={(text) => handleUpdateQuote(item.id, 'author', text || null)}
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
        />

        {categories.length > 0 && (
          <>
            <Text style={styles.fieldLabel}>CATEGORIES</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => {
                const isSelected = item.categoryIds.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected ? styles.categoryChipSelected : styles.categoryChipUnselected,
                    ]}
                    onPress={() => handleToggleCategory(item.id, cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected ? styles.categoryChipTextSelected : styles.categoryChipTextUnselected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>
    ),
    [categories, colors]
  );

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: phase === 'preview' ? `${quotes.length} Quotes` : 'Import Quotes',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          ),
          headerRight: () =>
            phase === 'preview' ? (
              <Pressable onPress={() => setPhase('input')} style={{ padding: 8 }}>
                <Text style={{ color: colors.primary, fontSize: 15 }}>Edit Input</Text>
              </Pressable>
            ) : null,
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {phase === 'input' && (
          <View style={styles.content}>
            <Text style={styles.inputLabel}>
              Paste your quotes in any format. The AI will extract and organize them for you.
            </Text>
            <ScrollView
              style={styles.textInputContainer}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={`Example:\n\n"The only way to do great work is to love what you do." - Steve Jobs\n\n"Innovation distinguishes between a leader and a follower." - Steve Jobs`}
                placeholderTextColor={colors.textMuted}
                multiline
                scrollEnabled={false}
              />
            </ScrollView>
            <Pressable
              style={[styles.parseButton, !inputText.trim() && styles.parseButtonDisabled]}
              onPress={handleParse}
              disabled={!inputText.trim()}
            >
              <Text style={styles.parseButtonText}>Parse Quotes</Text>
            </Pressable>
          </View>
        )}

        {phase === 'loading' && (
          <View style={styles.loadingContainer}>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
            <Text style={styles.loadingText}>Parsing your quotes...</Text>
            <Text style={styles.estimatedText}>~{estimatedTime}s estimated</Text>
          </View>
        )}

        {phase === 'preview' && (
          <>
            <FlatList
              data={quotes}
              renderItem={renderQuoteItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              keyboardShouldPersistTaps="handled"
            />
            <View style={styles.saveButtonContainer}>
              <Pressable
                style={[styles.saveButton, (saving || quotes.length === 0) && styles.saveButtonDisabled]}
                onPress={handleSaveAll}
                disabled={saving || quotes.length === 0}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : `Save ${quotes.length} Quote${quotes.length !== 1 ? 's' : ''}`}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}
