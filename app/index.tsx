import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.label}>Quote of the Day</Text>
      <View style={styles.previewContainer}>
        <Text style={styles.quoteText}>
          "Add your first quote to get started"
        </Text>
      </View>
      <Pressable style={styles.button}>
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
  quoteText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
