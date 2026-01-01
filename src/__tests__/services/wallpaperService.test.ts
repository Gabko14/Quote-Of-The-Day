// Mock Platform and NativeModules with getters for dynamic behavior
let mockPlatformOS: 'android' | 'ios' | 'web' = 'android';
const mockSetWallpaper = jest.fn().mockResolvedValue(undefined);
let mockWallpaperModuleAvailable = true;

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
  },
  NativeModules: {
    get WallpaperModule() {
      return mockWallpaperModuleAvailable
        ? { setWallpaper: mockSetWallpaper }
        : null;
    },
  },
}));

// Import after mock is set up
import type { WallpaperResult } from '../../services/wallpaperService';

function setPlatformOS(os: 'android' | 'ios' | 'web'): void {
  mockPlatformOS = os;
}

function setWallpaperModuleAvailable(available: boolean): void {
  mockWallpaperModuleAvailable = available;
}

// Helper to dynamically import the service (to pick up mock changes)
async function getWallpaperService() {
  // Reset module registry to pick up new mock values
  jest.resetModules();
  return import('../../services/wallpaperService');
}

describe('wallpaperService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetWallpaper.mockResolvedValue(undefined);
    // Reset to Android with module available
    mockPlatformOS = 'android';
    mockWallpaperModuleAvailable = true;
  });

  describe('isWallpaperSupported', () => {
    it('returns true on Android with WallpaperModule available', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      const { isWallpaperSupported } = await getWallpaperService();

      const result = await isWallpaperSupported();

      expect(result).toBe(true);
    });

    it('returns false on iOS', async () => {
      setPlatformOS('ios');
      setWallpaperModuleAvailable(true);
      const { isWallpaperSupported } = await getWallpaperService();

      const result = await isWallpaperSupported();

      expect(result).toBe(false);
    });

    it('returns false on web', async () => {
      setPlatformOS('web');
      setWallpaperModuleAvailable(true);
      const { isWallpaperSupported } = await getWallpaperService();

      const result = await isWallpaperSupported();

      expect(result).toBe(false);
    });

    it('returns false when WallpaperModule is not available', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(false);
      const { isWallpaperSupported } = await getWallpaperService();

      const result = await isWallpaperSupported();

      expect(result).toBe(false);
    });
  });

  describe('setWallpaper', () => {
    it('returns success result on successful call', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      const { setWallpaper } = await getWallpaperService();

      const result = await setWallpaper('/path/to/image.png', 'both');

      expect(result).toEqual<WallpaperResult>({ success: true });
      expect(mockSetWallpaper).toHaveBeenCalledWith(
        '/path/to/image.png',
        'both'
      );
    });

    it('returns error result on non-Android platform', async () => {
      setPlatformOS('ios');
      const { setWallpaper } = await getWallpaperService();

      const result = await setWallpaper('/path/to/image.png', 'both');

      expect(result).toEqual<WallpaperResult>({
        success: false,
        error: 'Setting wallpaper is only supported on Android',
      });
    });

    it('returns error result when module is not available', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(false);
      const { setWallpaper } = await getWallpaperService();

      const result = await setWallpaper('/path/to/image.png', 'both');

      expect(result).toEqual<WallpaperResult>({
        success: false,
        error: 'Wallpaper module not available',
      });
    });

    it('returns error result when native call throws', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      mockSetWallpaper.mockRejectedValue(new Error('Permission denied'));
      const { setWallpaper } = await getWallpaperService();

      const result = await setWallpaper('/path/to/image.png', 'both');

      expect(result).toEqual<WallpaperResult>({
        success: false,
        error: 'Permission denied',
      });
    });

    it('returns generic error when error has no message', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      mockSetWallpaper.mockRejectedValue({});
      const { setWallpaper } = await getWallpaperService();

      const result = await setWallpaper('/path/to/image.png', 'both');

      expect(result).toEqual<WallpaperResult>({
        success: false,
        error: 'Failed to set wallpaper',
      });
    });

    it('defaults to "both" target', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      const { setWallpaper } = await getWallpaperService();

      await setWallpaper('/path/to/image.png');

      expect(mockSetWallpaper).toHaveBeenCalledWith(
        '/path/to/image.png',
        'both'
      );
    });
  });

  describe('convenience methods', () => {
    it('setHomeScreenWallpaper calls setWallpaper with "home"', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      const { setHomeScreenWallpaper } = await getWallpaperService();

      const result = await setHomeScreenWallpaper('/path/to/image.png');

      expect(result.success).toBe(true);
      expect(mockSetWallpaper).toHaveBeenCalledWith(
        '/path/to/image.png',
        'home'
      );
    });

    it('setLockScreenWallpaper calls setWallpaper with "lock"', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      const { setLockScreenWallpaper } = await getWallpaperService();

      const result = await setLockScreenWallpaper('/path/to/image.png');

      expect(result.success).toBe(true);
      expect(mockSetWallpaper).toHaveBeenCalledWith(
        '/path/to/image.png',
        'lock'
      );
    });

    it('setBothWallpapers calls setWallpaper with "both"', async () => {
      setPlatformOS('android');
      setWallpaperModuleAvailable(true);
      const { setBothWallpapers } = await getWallpaperService();

      const result = await setBothWallpapers('/path/to/image.png');

      expect(result.success).toBe(true);
      expect(mockSetWallpaper).toHaveBeenCalledWith(
        '/path/to/image.png',
        'both'
      );
    });
  });
});
