import { Alert, Linking, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { getDatabase } from '../db/database';

const PROMPT_SHOWN_KEY = 'batteryOptimizationPromptShown';

async function hasPromptBeenShown(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [PROMPT_SHOWN_KEY]
  );
  return result?.value === 'true';
}

async function markPromptAsShown(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [PROMPT_SHOWN_KEY, 'true']
  );
}

async function openBatterySettings(): Promise<void> {
  const packageName = Constants.expoConfig?.android?.package ?? 'com.quoteoftheday.app';

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      { data: `package:${packageName}` }
    );
  } catch {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
    } catch {
      Alert.alert(
        'Open Settings Manually',
        'Go to Settings > Apps > Quote of the Day > Battery > Unrestricted',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }
}

export async function promptBatteryOptimization(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const alreadyShown = await hasPromptBeenShown();
  if (alreadyShown) return;

  // Mark as shown immediately to prevent double prompts
  await markPromptAsShown();

  Alert.alert(
    'Enable Daily Wallpapers',
    'For your wallpaper to change automatically each day, please disable battery optimization for this app.\n\nWithout this, Android may prevent background updates.',
    [
      {
        text: 'Maybe Later',
        style: 'cancel'
      },
      {
        text: 'Enable Now',
        onPress: openBatterySettings,
        style: 'default'
      },
    ]
  );
}

// Export for use in Settings screen
export { openBatterySettings };
