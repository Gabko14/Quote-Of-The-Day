// In-memory storage for mock database
const settingsStore: Map<string, string> = new Map();

const mockDatabase = {
  getFirstAsync: jest.fn(async (sql: string, params?: (string | number)[]) => {
    if (sql.includes('SELECT value FROM settings WHERE key = ?')) {
      const key = params?.[0] as string;
      const value = settingsStore.get(key);
      return value !== undefined ? { value } : null;
    }
    return null;
  }),

  runAsync: jest.fn(async (sql: string, params?: (string | number)[]) => {
    if (sql.includes('INSERT OR REPLACE INTO settings')) {
      const key = params?.[0] as string;
      const value = params?.[1] as string;
      settingsStore.set(key, value);
    }
    if (sql.includes('DELETE FROM settings WHERE key = ?')) {
      const key = params?.[0] as string;
      settingsStore.delete(key);
    }
    return { changes: 1 };
  }),

  execAsync: jest.fn(async () => {}),
  closeAsync: jest.fn(async () => {}),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDatabase),
}));

function resetMockDatabase(): void {
  settingsStore.clear();
  jest.clearAllMocks();
}

function setMockSetting(key: string, value: string): void {
  settingsStore.set(key, value);
}

function getMockSetting(key: string): string | undefined {
  return settingsStore.get(key);
}

describe('settings db', () => {
  beforeEach(() => {
    resetMockDatabase();
    // Reset module cache to ensure fresh database instance
    jest.resetModules();
  });

  describe('getSetting / setSetting', () => {
    it('returns null when setting does not exist', async () => {
      const { getSetting } = await import('../../db/settings');

      const result = await getSetting('lastQuoteDate');

      expect(result).toBeNull();
    });

    it('returns value when setting exists', async () => {
      setMockSetting('lastQuoteDate', '2025-01-15');
      const { getSetting } = await import('../../db/settings');

      const result = await getSetting('lastQuoteDate');

      expect(result).toBe('2025-01-15');
    });

    it('stores and retrieves a setting', async () => {
      const { getSetting, setSetting } = await import('../../db/settings');

      await setSetting('lastQuoteDate', '2025-01-15');
      const result = await getSetting('lastQuoteDate');

      expect(result).toBe('2025-01-15');
      expect(getMockSetting('lastQuoteDate')).toBe('2025-01-15');
    });

    it('overwrites existing setting', async () => {
      setMockSetting('lastQuoteDate', '2025-01-14');
      const { getSetting, setSetting } = await import('../../db/settings');

      await setSetting('lastQuoteDate', '2025-01-15');
      const result = await getSetting('lastQuoteDate');

      expect(result).toBe('2025-01-15');
    });
  });

  describe('getDarkBackground - boolean coercion', () => {
    it('returns true when value is "true"', async () => {
      setMockSetting('darkBackground', 'true');
      const { getDarkBackground } = await import('../../db/settings');

      const result = await getDarkBackground();

      expect(result).toBe(true);
    });

    it('returns false when value is "false"', async () => {
      setMockSetting('darkBackground', 'false');
      const { getDarkBackground } = await import('../../db/settings');

      const result = await getDarkBackground();

      expect(result).toBe(false);
    });

    it('returns true when value is null (default behavior)', async () => {
      // Don't set any value
      const { getDarkBackground } = await import('../../db/settings');

      const result = await getDarkBackground();

      // Default to true when value is null
      expect(result).toBe(true);
    });

    it('returns true for any non-"false" string value', async () => {
      setMockSetting('darkBackground', 'yes');
      const { getDarkBackground } = await import('../../db/settings');

      const result = await getDarkBackground();

      // Logic is: value !== 'false', so any other string returns true
      expect(result).toBe(true);
    });
  });

  describe('setDarkBackground - boolean to string', () => {
    it('stores "true" when passed true', async () => {
      const { setDarkBackground } = await import('../../db/settings');

      await setDarkBackground(true);

      expect(getMockSetting('darkBackground')).toBe('true');
    });

    it('stores "false" when passed false', async () => {
      const { setDarkBackground } = await import('../../db/settings');

      await setDarkBackground(false);

      expect(getMockSetting('darkBackground')).toBe('false');
    });
  });

  describe('getCurrentQuoteId - number coercion', () => {
    it('returns null when value does not exist', async () => {
      const { getCurrentQuoteId } = await import('../../db/settings');

      const result = await getCurrentQuoteId();

      expect(result).toBeNull();
    });

    it('returns parsed integer when value exists', async () => {
      setMockSetting('currentQuoteId', '42');
      const { getCurrentQuoteId } = await import('../../db/settings');

      const result = await getCurrentQuoteId();

      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('handles string representation of numbers correctly', async () => {
      setMockSetting('currentQuoteId', '123');
      const { getCurrentQuoteId } = await import('../../db/settings');

      const result = await getCurrentQuoteId();

      expect(result).toBe(123);
    });

    it('returns null for non-numeric strings (corrupted value)', async () => {
      setMockSetting('currentQuoteId', 'not-a-number');
      const { getCurrentQuoteId } = await import('../../db/settings');

      const result = await getCurrentQuoteId();

      expect(result).toBeNull();
    });
  });

  describe('setCurrentQuoteId - number to string', () => {
    it('stores number as string', async () => {
      const { setCurrentQuoteId } = await import('../../db/settings');

      await setCurrentQuoteId(42);

      expect(getMockSetting('currentQuoteId')).toBe('42');
    });

    it('handles zero correctly', async () => {
      const { setCurrentQuoteId } = await import('../../db/settings');

      await setCurrentQuoteId(0);

      expect(getMockSetting('currentQuoteId')).toBe('0');
    });
  });

  describe('getLastQuoteDate / setLastQuoteDate', () => {
    it('returns null when not set', async () => {
      const { getLastQuoteDate } = await import('../../db/settings');

      const result = await getLastQuoteDate();

      expect(result).toBeNull();
    });

    it('stores and retrieves date string', async () => {
      const { getLastQuoteDate, setLastQuoteDate } = await import('../../db/settings');

      await setLastQuoteDate('2025-01-15');
      const result = await getLastQuoteDate();

      expect(result).toBe('2025-01-15');
    });
  });

  describe('deleteSetting', () => {
    it('removes a setting', async () => {
      setMockSetting('lastQuoteDate', '2025-01-15');
      const { getSetting, deleteSetting } = await import('../../db/settings');

      await deleteSetting('lastQuoteDate');
      const result = await getSetting('lastQuoteDate');

      expect(result).toBeNull();
    });
  });
});
