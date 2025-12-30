import { Platform, Alert, NativeModules } from 'react-native';

const { WallpaperModule } = NativeModules;

export type WallpaperTarget = 'home' | 'lock' | 'both';

export async function isWallpaperSupported(): Promise<boolean> {
  return Platform.OS === 'android' && WallpaperModule != null;
}

export async function setWallpaper(imagePath: string, target: WallpaperTarget = 'both'): Promise<boolean> {
  if (Platform.OS !== 'android') {
    Alert.alert('Not Supported', 'Setting wallpaper is only supported on Android');
    return false;
  }

  if (!WallpaperModule) {
    Alert.alert('Error', 'Wallpaper module not available');
    return false;
  }

  try {
    await WallpaperModule.setWallpaper(imagePath, target);
    Alert.alert('Success', 'Wallpaper has been set!');
    return true;
  } catch (error: any) {
    console.error('Error setting wallpaper:', error);
    Alert.alert('Error', error.message || 'Failed to set wallpaper');
    return false;
  }
}

export async function setHomeScreenWallpaper(imagePath: string): Promise<boolean> {
  return setWallpaper(imagePath, 'home');
}

export async function setLockScreenWallpaper(imagePath: string): Promise<boolean> {
  return setWallpaper(imagePath, 'lock');
}

export async function setBothWallpapers(imagePath: string): Promise<boolean> {
  return setWallpaper(imagePath, 'both');
}
