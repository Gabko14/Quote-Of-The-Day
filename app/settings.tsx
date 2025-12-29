import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDarkBackground, setDarkBackground as saveDarkBackground } from '../src/db';

export default function SettingsScreen() {
  const [darkBackground, setDarkBackground] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const dark = await getDarkBackground();
      setDarkBackground(dark);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleToggle = async (value: boolean) => {
    setDarkBackground(value);
    await saveDarkBackground(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallpaper</Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>Dark Background</Text>
            <Text style={styles.rowSubtitle}>
              {darkBackground ? 'White text on black' : 'Black text on white'}
            </Text>
          </View>
          <Switch
            value={darkBackground}
            onValueChange={handleToggle}
            trackColor={{ false: '#ddd', true: '#007AFF' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Quote of the day v1.0.0</Text>
        <Text style={styles.aboutSubtext}>
          Display your favorite quotes as your daily wallpaper
        </Text>
      </View>
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
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    color: '#333',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  aboutText: {
    fontSize: 16,
    color: '#333',
  },
  aboutSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
});
