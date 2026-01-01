import { Platform, NativeModules } from 'react-native';

const { WallpaperModule } = NativeModules;

export type WallpaperTarget = 'home' | 'lock' | 'both';

export interface WallpaperResult {
  success: boolean;
  error?: string;
}

export async function isWallpaperSupported(): Promise<boolean> {
  return Platform.OS === 'android' && WallpaperModule != null;
}

export async function setWallpaper(imagePath: string, target: WallpaperTarget = 'both'): Promise<WallpaperResult> {
  if (Platform.OS !== 'android') {
    return { success: false, error: 'Setting wallpaper is only supported on Android' };
  }

  if (!WallpaperModule) {
    return { success: false, error: 'Wallpaper module not available' };
  }

  try {
    await WallpaperModule.setWallpaper(imagePath, target);
    return { success: true };
  } catch (error: any) {
    console.error('Error setting wallpaper:', error);
    return { success: false, error: error.message || 'Failed to set wallpaper' };
  }
}

export async function setHomeScreenWallpaper(imagePath: string): Promise<WallpaperResult> {
  return setWallpaper(imagePath, 'home');
}

export async function setLockScreenWallpaper(imagePath: string): Promise<WallpaperResult> {
  return setWallpaper(imagePath, 'lock');
}

export async function setBothWallpapers(imagePath: string): Promise<WallpaperResult> {
  return setWallpaper(imagePath, 'both');
}
