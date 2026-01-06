import * as SecureStore from 'expo-secure-store';

const XAI_API_KEY = 'xaiApiKey';

export async function getXaiApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(XAI_API_KEY);
  } catch {
    return null;
  }
}

export async function setXaiApiKey(key: string | null): Promise<void> {
  if (key) {
    await SecureStore.setItemAsync(XAI_API_KEY, key);
  } else {
    await SecureStore.deleteItemAsync(XAI_API_KEY);
  }
}
