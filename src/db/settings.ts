import { getDatabase } from './database';

export type SettingKey =
  | 'darkBackground'
  | 'darkMode'
  | 'lastQuoteDate'
  | 'currentQuoteId';

export async function getSetting(key: SettingKey): Promise<string | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result?.value ?? null;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function deleteSetting(key: SettingKey): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
}

// Convenience methods for typed settings
export async function getDarkBackground(): Promise<boolean> {
  const value = await getSetting('darkBackground');
  return value !== 'false'; // Default to true
}

export async function setDarkBackground(dark: boolean): Promise<void> {
  await setSetting('darkBackground', dark.toString());
}

export async function getCurrentQuoteId(): Promise<number | null> {
  const value = await getSetting('currentQuoteId');
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function setCurrentQuoteId(id: number): Promise<void> {
  await setSetting('currentQuoteId', id.toString());
}

export async function getLastQuoteDate(): Promise<string | null> {
  return getSetting('lastQuoteDate');
}

export async function setLastQuoteDate(date: string): Promise<void> {
  await setSetting('lastQuoteDate', date);
}
